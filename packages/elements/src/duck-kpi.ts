import { DuckElement } from './base'
import { resolveFormatter, createSparkline } from '@duck_ui/core'
import type { FormatPreset } from '@duck_ui/core'
import { loadingHTML, errorHTML, escapeHTML } from './styles'

const kpiCSS = `
  .kpi-container {
    padding: 20px;
  }
  .kpi-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--duck-muted, #6b7280);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .kpi-value {
    font-size: 32px;
    font-weight: 700;
    color: var(--duck-text, #374151);
    line-height: 1.2;
    letter-spacing: -0.02em;
  }
  .kpi-change {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 8px;
    padding: 2px 8px;
    font-size: 13px;
    font-weight: 600;
    border-radius: 12px;
  }
  .kpi-change.positive {
    color: var(--duck-success, #16a34a);
    background: var(--duck-success-bg, #f0fdf4);
  }
  .kpi-change.negative {
    color: var(--duck-danger, #dc2626);
    background: var(--duck-danger-bg, #fef2f2);
  }
  .kpi-change-label {
    font-weight: 400;
    color: var(--duck-muted, #6b7280);
    margin-left: 2px;
  }
  .kpi-sparkline {
    margin-top: 12px;
  }
`

/**
 * <duck-kpi> — Single-value KPI card with optional comparison and sparkline.
 *
 * Usage:
 *   <duck-kpi
 *     sql="SELECT sum(total) as value FROM orders"
 *     label="Revenue"
 *     format="currency"
 *     currency="USD"
 *     compare-sql="SELECT sum(total) as value FROM orders WHERE year = 2024"
 *     compare-label="vs 2024"
 *     sparkline-sql="SELECT month, sum(total) FROM orders GROUP BY 1 ORDER BY 1"
 *   ></duck-kpi>
 */
export class DuckKPIElement extends DuckElement {
  static observedAttributes = ['sql', 'label', 'format', 'currency', 'compare-sql', 'compare-label', 'sparkline-sql', 'table-name']

  private container!: HTMLDivElement
  private sparklineContainer: HTMLDivElement | null = null
  private sparklineInstance: { destroy: () => void } | null = null

  render(): void {
    if (!this.container) {
      this.applyStyles(kpiCSS)
      this.container = this.createContainer()
    }

    const provider = this.getProvider()
    if (!provider?.ready) {
      this.container.innerHTML = loadingHTML()
      return
    }

    this.fetchAndRender()
  }

  private async fetchAndRender(): Promise<void> {
    const provider = this.getProvider()
    if (!provider?.ready) return

    const sql = this.getAttribute('sql')
    if (!sql) {
      this.container.innerHTML = errorHTML('No SQL query provided')
      return
    }

    try {
      this.container.innerHTML = loadingHTML()

      const data = await provider.duckUI.query(sql)
      const value = data?.rows[0] ? (Object.values(data.rows[0])[0] as number) : 0

      const formatAttr = this.getAttribute('format') as FormatPreset | null
      const currency = this.getAttribute('currency') ?? undefined
      const formatter = resolveFormatter(formatAttr ?? undefined, currency)

      const label = this.getAttribute('label') ?? ''
      const compareLabel = this.getAttribute('compare-label') ?? ''

      // Start building HTML
      let html = `
        <div class="kpi-container">
          <div class="kpi-label">${escapeHTML(label)}</div>
          <div class="kpi-value">${escapeHTML(formatter(value))}</div>
      `

      // Comparison
      const compareSql = this.getAttribute('compare-sql')
      if (compareSql) {
        try {
          const compData = await provider.duckUI.query(compareSql)
          const prevValue = compData?.rows[0] ? (Object.values(compData.rows[0])[0] as number) : null

          if (prevValue !== null && prevValue !== 0) {
            const changePercent = ((value - prevValue) / prevValue) * 100
            const cls = changePercent >= 0 ? 'positive' : 'negative'
            const arrow = changePercent >= 0 ? '\u2191' : '\u2193'

            html += `
              <div class="kpi-change ${cls}">
                <span>${arrow}</span>
                ${Math.abs(changePercent).toFixed(1)}%
                ${compareLabel ? `<span class="kpi-change-label">${escapeHTML(compareLabel)}</span>` : ''}
              </div>
            `
          }
        } catch {
          // Silently skip comparison on error
        }
      }

      html += `<div class="kpi-sparkline"></div></div>`
      this.container.innerHTML = html

      // Sparkline
      const sparklineSql = this.getAttribute('sparkline-sql')
      if (sparklineSql) {
        try {
          const sparkData = await provider.duckUI.query(sparklineSql)
          const sparkValues = sparkData.rows.map((row) => Object.values(row)[0] as number)

          if (sparkValues.length > 1) {
            const theme = this.getTheme()
            this.sparklineContainer = this.container.querySelector('.kpi-sparkline') as HTMLDivElement
            if (this.sparklineContainer) {
              this.sparklineInstance?.destroy()
              const uplot = createSparkline(this.sparklineContainer, sparkValues, {
                width: 140,
                height: 28,
                color: theme.primaryColor,
                fill: true,
              })
              this.sparklineInstance = { destroy: () => uplot.destroy() }
            }
          }
        } catch {
          // Silently skip sparkline on error
        }
      }
    } catch (err) {
      this.container.innerHTML = errorHTML(err instanceof Error ? err.message : String(err))
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this.sparklineInstance?.destroy()
    this.sparklineInstance = null
  }
}
