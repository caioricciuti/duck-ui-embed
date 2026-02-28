import { DuckUI, lightTheme, darkTheme } from '@duck_ui/core'
import type { DataInput, DuckTheme, FilterValue } from '@duck_ui/core'
import { themeToCSS } from './styles'

/**
 * <duck-provider> — Root element that initializes DuckDB-WASM and provides
 * context to all child duck-* elements.
 *
 * Usage:
 *   <!-- Declarative: single remote file -->
 *   <duck-provider src="/data.parquet" table="sales" format="parquet">
 *     <duck-chart sql="SELECT ..." type="bar"></duck-chart>
 *   </duck-provider>
 *
 *   <!-- Programmatic: call .load() with multiple tables -->
 *   <duck-provider id="app">...</duck-provider>
 *   <script>
 *     document.getElementById('app').load({
 *       sales: { url: '/sales.parquet', format: 'parquet' },
 *       users: [{ id: 1, name: 'Alice' }],
 *     })
 *   </script>
 */
export class DuckProviderElement extends HTMLElement {
  private engine: DuckUI
  private _theme: DuckTheme
  private _ready = false
  private _filters: Record<string, FilterValue> = {}
  private _filterVersion = 0

  static observedAttributes = ['theme', 'src', 'table', 'format']

  constructor() {
    super()
    this._theme = lightTheme
    this.engine = new DuckUI()
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** The DuckUI engine instance. Used by child elements to run queries. */
  get duckUI(): DuckUI {
    return this.engine
  }

  /** Current resolved theme. */
  get theme(): DuckTheme {
    return this._theme
  }

  /** Whether the engine is ready and data is loaded. */
  get ready(): boolean {
    return this._ready
  }

  /** Active filter state. */
  get filters(): Record<string, FilterValue> {
    return this._filters
  }

  get filterVersion(): number {
    return this._filterVersion
  }

  /** Set a filter value. Dispatches 'duck-filter-change' to children. */
  setFilter(column: string, value: FilterValue): void {
    this._filters = { ...this._filters, [column]: value }
    this._filterVersion++
    this.engine.setFilter(column, value)
    this.dispatchEvent(new CustomEvent('duck-filter-change', { bubbles: false }))
  }

  /** Clear all filters. */
  clearFilters(): void {
    this._filters = {}
    this._filterVersion = 0
    this.engine.clearFilters()
    this.dispatchEvent(new CustomEvent('duck-filter-change', { bubbles: false }))
  }

  /** Load data into DuckDB. Key = table name, value = data source. */
  async load(data: Record<string, DataInput>): Promise<void> {
    try {
      this._ready = false
      await this.engine.init(data)
      this._ready = true
      this.dispatchEvent(new CustomEvent('duck-ready', { bubbles: false }))
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.dispatchEvent(
        new CustomEvent('duck-error', { bubbles: false, detail: { error } }),
      )
    }
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  connectedCallback(): void {
    this.updateTheme()
    this.applyThemeCSS()
    this.tryDeclarativeLoad()
  }

  attributeChangedCallback(name: string): void {
    if (name === 'theme') {
      this.updateTheme()
      this.applyThemeCSS()
    }
    if (name === 'src' || name === 'table' || name === 'format') {
      this.tryDeclarativeLoad()
    }
  }

  disconnectedCallback(): void {
    this.engine.destroy()
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private updateTheme(): void {
    const themeAttr = this.getAttribute('theme')
    if (themeAttr === 'dark') {
      this._theme = darkTheme
    } else {
      this._theme = lightTheme
    }
  }

  private applyThemeCSS(): void {
    this.style.cssText = themeToCSS(this._theme)
  }

  /** If src + table attributes are set, auto-load from URL. */
  private tryDeclarativeLoad(): void {
    const src = this.getAttribute('src')
    const table = this.getAttribute('table')
    if (!src || !table) return

    const format = (this.getAttribute('format') as 'csv' | 'json' | 'parquet') ?? undefined
    this.load({ [table]: { url: src, format } })
  }
}
