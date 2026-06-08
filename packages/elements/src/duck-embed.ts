import { DuckElement } from './base'
import {
  DuckUI,
  createChart,
  queryResultToChartData,
  decodeShare,
  extractShareParam,
  lightTheme,
  darkTheme,
  type SharePayload,
  type SharedChartConfig,
  type SharedParam,
  type FilterValue,
  type QueryResult,
  type DuckTheme,
} from '@duck_ui/core'
import { themeToCSS, loadingHTML, errorHTML, emptyHTML, escapeHTML } from './styles'

interface ChartInstance {
  destroy(): void
  setSize(opts: { width: number; height: number }): void
}

const DEFAULT_APP_ORIGIN = 'https://duckui.com'
const CORE_CHART_TYPES = new Set(['line', 'bar', 'area', 'scatter'])
const NUMERIC_TYPE = /int|float|double|decimal|hugeint|numeric|real/i

const embedCSS = `
  .embed {
    display: flex; flex-direction: column;
    border: 1px solid var(--duck-border, #e5e7eb); border-radius: 8px; overflow: hidden;
    background: var(--duck-bg, #ffffff); color: var(--duck-text, #374151);
    font-family: ui-sans-serif, system-ui, sans-serif;
  }
  .embed-title { padding: 10px 14px 0; font-size: 14px; font-weight: 600; }
  .embed-filters {
    display: flex; flex-wrap: wrap; gap: 8px; padding: 10px 14px 4px;
    align-items: flex-end;
  }
  .embed-filter { display: flex; flex-direction: column; gap: 2px; }
  .embed-filter label { font-size: 11px; color: var(--duck-text-muted, #6b7280); }
  .embed-filter select, .embed-filter input {
    font-size: 12px; padding: 4px 6px; border: 1px solid var(--duck-border, #e5e7eb);
    border-radius: 6px; background: var(--duck-bg, #fff); color: var(--duck-text, #374151);
    min-width: 120px;
  }
  .embed-range { display: flex; gap: 4px; align-items: center; }
  .embed-range input { width: 72px; min-width: 0; }
  .embed-body { flex: 1; min-height: 0; padding: 8px 14px; overflow: auto; }
  .embed-footer {
    display: flex; align-items: center; justify-content: space-between;
    padding: 6px 12px; border-top: 1px solid var(--duck-border, #e5e7eb);
    font-size: 12px; background: var(--duck-muted-bg, #f9fafb);
  }
  .embed-footer a { color: var(--duck-text-muted, #6b7280); text-decoration: none; }
  .embed-footer a.cta { color: var(--duck-accent, #2563eb); font-weight: 600; }
  .embed-footer a:hover { text-decoration: underline; }
  table.embed-table { border-collapse: collapse; width: 100%; font-size: 12px; }
  table.embed-table th, table.embed-table td {
    border: 1px solid var(--duck-border, #e5e7eb); padding: 4px 8px; text-align: left;
    white-space: nowrap; max-width: 320px; overflow: hidden; text-overflow: ellipsis;
  }
  table.embed-table th { background: var(--duck-muted-bg, #f9fafb); position: sticky; top: 0; }
`

/**
 * <duck-embed> — one-line, read-only, self-contained viewer for a Duck-UI share.
 *
 * Decodes a Duck-UI share payload, spins up its own in-browser DuckDB engine,
 * runs the query, and renders the chart (or table). If the share defines
 * parameters, an interactive filter bar lets viewers fork the analysis live.
 * No data leaves the page.
 *
 * Usage:
 *   <duck-embed share="<token>"></duck-embed>
 *   <duck-embed src="https://duckui.com/a/?s=<token>" theme="dark"></duck-embed>
 *
 * Needs a cross-origin-isolated host page (COOP/COEP) for SharedArrayBuffer.
 * On pages that can't set those headers, use the /embed iframe instead.
 */
export class DuckEmbedElement extends DuckElement {
  static observedAttributes = ['share', 'src', 'height', 'theme', 'app-origin']

  private engine: DuckUI | null = null
  private chartInstance: ChartInstance | null = null
  private root!: HTMLDivElement
  private titleEl!: HTMLDivElement
  private filterBar!: HTMLDivElement
  private body!: HTMLDivElement
  private booting = false
  private loadedToken: string | null = null
  private baseSql = ''
  private chartConfig?: SharedChartConfig

  // Self-contained: no provider required.
  render(): void {
    this.ensureScaffold()
    void this.boot()
  }

  connectedCallback(): void {
    this.ensureScaffold()
    void this.boot()
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this.destroyChart()
    void this.engine?.destroy()
    this.engine = null
    this.loadedToken = null
  }

  private get theme(): DuckTheme {
    return this.getAttribute('theme') === 'dark' ? darkTheme : lightTheme
  }

  private get appOrigin(): string {
    return this.getAttribute('app-origin') || DEFAULT_APP_ORIGIN
  }

  private ensureScaffold(): void {
    if (this.root) {
      this.style.cssText = themeToCSS(this.theme)
      return
    }
    this.applyStyles(embedCSS)
    this.style.cssText = themeToCSS(this.theme)
    this.root = document.createElement('div')
    this.root.className = 'embed'
    this.titleEl = document.createElement('div')
    this.titleEl.className = 'embed-title'
    this.titleEl.style.display = 'none'
    this.filterBar = document.createElement('div')
    this.filterBar.className = 'embed-filters'
    this.filterBar.style.display = 'none'
    this.body = document.createElement('div')
    this.body.className = 'embed-body'
    this.root.append(this.titleEl, this.filterBar, this.body)
    this.root.appendChild(this.buildFooter())
    this.shadow.appendChild(this.root)
  }

  private buildFooter(): HTMLDivElement {
    const footer = document.createElement('div')
    footer.className = 'embed-footer'
    const token = this.resolveToken()
    const forkHref = token ? `${this.appOrigin}/#s=${token}` : this.appOrigin
    footer.innerHTML =
      `<a href="${forkHref}" target="_blank" rel="noopener">Powered by Duck-UI</a>` +
      `<a class="cta" href="${forkHref}" target="_blank" rel="noopener">Open in Duck-UI →</a>`
    return footer
  }

  private resolveToken(): string | null {
    const share = this.getAttribute('share')
    if (share) return extractShareParam(share)
    const src = this.getAttribute('src')
    if (src) return extractShareParam(src)
    return null
  }

  private async boot(): Promise<void> {
    const token = this.resolveToken()
    if (!token) {
      this.body.innerHTML = errorHTML('No share token provided')
      return
    }
    if (this.booting || token === this.loadedToken) return
    this.booting = true
    this.body.innerHTML = loadingHTML('Running analysis…')

    try {
      const payload = await decodeShare(token)
      if (!payload) {
        this.body.innerHTML = errorHTML('This shared link is invalid or corrupted')
        return
      }
      this.applyTitle(payload)

      const sql = payload.type === 'sql' ? (payload.sql ?? '').trim() : ''
      if (!sql) {
        this.body.innerHTML = emptyHTML('Nothing to display')
        return
      }
      this.baseSql = sql
      this.chartConfig = payload.chartConfig

      if (!this.engine) {
        this.engine = new DuckUI({ theme: this.theme })
        await this.engine.init({})
        await this.engine.query('INSTALL httpfs').catch(() => {})
        await this.engine.query('LOAD httpfs').catch(() => {})
      }

      // Build the filter bar before running (distinct values fetched unfiltered).
      await this.buildFilters(payload.params)

      const result = await this.engine.query(sql)
      this.loadedToken = token
      this.renderResult(result)
    } catch (err) {
      this.body.innerHTML = errorHTML(err instanceof Error ? err.message : String(err))
    } finally {
      this.booting = false
    }
  }

  private applyTitle(payload: SharePayload): void {
    if (payload.title) {
      this.titleEl.textContent = payload.title
      this.titleEl.style.display = 'block'
    }
  }

  // ---------------------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------------------

  private async buildFilters(params?: SharedParam[]): Promise<void> {
    this.filterBar.innerHTML = ''
    if (!params || params.length === 0 || !this.engine) {
      this.filterBar.style.display = 'none'
      return
    }
    this.filterBar.style.display = 'flex'

    for (const param of params) {
      const field = document.createElement('div')
      field.className = 'embed-filter'
      const label = document.createElement('label')
      label.textContent = param.label || param.column
      field.appendChild(label)

      if (param.type === 'select') {
        field.appendChild(await this.buildSelect(param))
      } else if (param.type === 'range') {
        field.appendChild(this.buildRange(param))
      } else {
        field.appendChild(this.buildSearch(param))
      }
      this.filterBar.appendChild(field)
    }
  }

  private async buildSelect(param: SharedParam): Promise<HTMLSelectElement> {
    const select = document.createElement('select')
    const all = document.createElement('option')
    all.value = ''
    all.textContent = 'All'
    select.appendChild(all)

    let numeric = false
    try {
      // Distinct values, unfiltered (no filters active yet).
      const dv = await this.engine!.query(
        `SELECT DISTINCT ${quoteIdent(param.column)} AS v FROM (${this.baseSql}) AS _d ` +
          `WHERE ${quoteIdent(param.column)} IS NOT NULL ORDER BY 1 LIMIT 100`,
      )
      numeric = NUMERIC_TYPE.test(dv.columns[0]?.type ?? '')
      for (const row of dv.rows) {
        const v = row.v
        if (v === null || v === undefined) continue
        const opt = document.createElement('option')
        opt.value = String(v)
        opt.textContent = String(v)
        select.appendChild(opt)
      }
    } catch {
      // If distinct fails (e.g. column not in result), the control still renders empty.
    }

    select.addEventListener('change', () => {
      const raw = select.value
      const value: FilterValue = raw === '' ? null : numeric ? Number(raw) : raw
      void this.applyFilter(param.column, value)
    })
    return select
  }

  private buildSearch(param: SharedParam): HTMLInputElement {
    const input = document.createElement('input')
    input.type = 'text'
    input.placeholder = 'contains…'
    let timer: ReturnType<typeof setTimeout> | null = null
    input.addEventListener('input', () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        const v = input.value.trim()
        void this.applyFilter(param.column, v ? { ilike: `%${v}%` } : null)
      }, 300)
    })
    return input
  }

  private buildRange(param: SharedParam): HTMLDivElement {
    const wrap = document.createElement('div')
    wrap.className = 'embed-range'
    const min = document.createElement('input')
    min.type = 'number'
    min.placeholder = 'min'
    const max = document.createElement('input')
    max.type = 'number'
    max.placeholder = 'max'
    const onChange = () => {
      const lo = min.value === '' ? null : Number(min.value)
      const hi = max.value === '' ? null : Number(max.value)
      if (lo === null && hi === null) {
        void this.applyFilter(param.column, null)
      } else {
        void this.applyFilter(param.column, {
          min: lo ?? Number.NEGATIVE_INFINITY,
          max: hi ?? Number.POSITIVE_INFINITY,
        })
      }
    }
    min.addEventListener('change', onChange)
    max.addEventListener('change', onChange)
    wrap.append(min, document.createTextNode('–'), max)
    return wrap
  }

  /** Set a filter on the engine and re-run the base query (DuckUI auto-injects). */
  private async applyFilter(column: string, value: FilterValue): Promise<void> {
    if (!this.engine) return
    this.engine.setFilter(column, value)
    this.body.innerHTML = loadingHTML('Filtering…')
    try {
      const result = await this.engine.query(this.baseSql)
      this.renderResult(result)
    } catch (err) {
      this.body.innerHTML = errorHTML(err instanceof Error ? err.message : String(err))
    }
  }

  // ---------------------------------------------------------------------------
  // Result rendering
  // ---------------------------------------------------------------------------

  private renderResult(result: QueryResult): void {
    this.destroyChart()
    this.body.innerHTML = ''

    if (!result || result.rowCount === 0) {
      this.body.innerHTML = emptyHTML()
      return
    }

    const coreType = this.mapChartType(this.chartConfig?.type)
    if (coreType) {
      this.renderChart(result, coreType)
    } else {
      this.renderTable(result)
    }
  }

  /** Map the Duck-UI app chart type to a core-supported type, or null → table. */
  private mapChartType(type?: string): 'line' | 'bar' | 'area' | 'scatter' | null {
    if (!type) return null
    if (CORE_CHART_TYPES.has(type)) return type as 'line' | 'bar' | 'area' | 'scatter'
    if (type === 'stacked_bar' || type === 'grouped_bar' || type === 'combo' || type === 'donut')
      return 'bar'
    if (type === 'stacked_area') return 'area'
    if (type === 'bubble') return 'scatter'
    // pie, heatmap, treemap, funnel, gauge, box → no core equivalent; show table.
    return null
  }

  private renderChart(result: QueryResult, type: 'line' | 'bar' | 'area' | 'scatter'): void {
    const chartResult = queryResultToChartData(result)
    const labels = result.columns.map((c) => c.name)
    const height = parseInt(this.getAttribute('height') ?? '360', 10)
    const width = this.offsetWidth || 600
    this.chartInstance = createChart(this.body, chartResult.data, {
      type,
      width,
      height,
      labels,
      xLabels: chartResult.xLabels,
      theme: this.theme,
      legend: true,
      tooltip: true,
    })
  }

  private renderTable(result: QueryResult): void {
    const cols = result.columns.map((c) => c.name)
    const head = `<tr>${cols.map((c) => `<th>${escapeHTML(c)}</th>`).join('')}</tr>`
    const rows = result.rows
      .slice(0, 200)
      .map(
        (row) =>
          `<tr>${cols.map((c) => `<td>${escapeHTML(formatCell(row[c]))}</td>`).join('')}</tr>`,
      )
      .join('')
    this.body.innerHTML = `<table class="embed-table"><thead>${head}</thead><tbody>${rows}</tbody></table>`
  }

  private destroyChart(): void {
    this.chartInstance?.destroy()
    this.chartInstance = null
  }
}

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
