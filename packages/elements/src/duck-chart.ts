import { DuckElement } from './base'
import { createChart, queryResultToChartData, observeSize } from '@duck_ui/core'
import { loadingHTML, errorHTML, emptyHTML } from './styles'

interface ChartInstance {
  destroy(): void
  setSize(opts: { width: number; height: number }): void
}

const chartCSS = `
  .chart-wrapper {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    background: var(--duck-bg, #ffffff);
  }
  .chart-title {
    padding: 12px 16px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--duck-text, #374151);
  }
  .chart-container {
    width: 100%;
  }
`

/**
 * <duck-chart> — Renders a uPlot chart from a SQL query.
 *
 * Usage:
 *   <duck-chart
 *     sql="SELECT month, sum(total) FROM orders GROUP BY 1"
 *     type="bar"
 *     height="300"
 *     title="Monthly Revenue"
 *   ></duck-chart>
 */
export class DuckChartElement extends DuckElement {
  static observedAttributes = ['sql', 'type', 'height', 'width', 'title', 'table-name', 'legend']

  private wrapper!: HTMLDivElement
  private chartContainer!: HTMLDivElement
  private chartInstance: ChartInstance | null = null
  private cleanupObserver: (() => void) | null = null
  private rendering = false

  render(): void {
    if (!this.wrapper) {
      this.applyStyles(chartCSS)
      this.wrapper = document.createElement('div')
      this.wrapper.className = 'chart-wrapper'
      this.chartContainer = document.createElement('div')
      this.chartContainer.className = 'chart-container'
      this.wrapper.appendChild(this.chartContainer)
      this.shadow.appendChild(this.wrapper)
    }

    const provider = this.getProvider()
    if (!provider?.ready) {
      this.chartContainer.innerHTML = loadingHTML()
      return
    }

    this.fetchAndRender()
  }

  connectedCallback(): void {
    super.connectedCallback()
    this.cleanupObserver = observeSize(this, (size) => {
      if (this.chartInstance && size.width) {
        const height = parseInt(this.getAttribute('height') ?? '300', 10)
        this.chartInstance.setSize({ width: size.width, height })
      }
    })
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this.cleanupObserver?.()
    this.cleanupObserver = null
    this.destroyChart()
  }

  private destroyChart(): void {
    this.chartInstance?.destroy()
    this.chartInstance = null
  }

  private async fetchAndRender(): Promise<void> {
    if (this.rendering) return
    this.rendering = true

    const provider = this.getProvider()
    if (!provider?.ready) {
      this.rendering = false
      return
    }

    const sql = this.getAttribute('sql')
    if (!sql) {
      this.chartContainer.innerHTML = errorHTML('No SQL query provided')
      this.rendering = false
      return
    }

    try {
      const data = await provider.duckUI.query(sql)

      if (!data || data.rowCount === 0) {
        this.destroyChart()
        this.chartContainer.innerHTML = emptyHTML()
        this.rendering = false
        return
      }

      const chartResult = queryResultToChartData(data)
      const labels = data.columns.map((c) => c.name)
      const theme = this.getTheme()

      const type = (this.getAttribute('type') as 'line' | 'bar' | 'area' | 'scatter') ?? 'line'
      const height = parseInt(this.getAttribute('height') ?? '300', 10)
      const widthAttr = this.getAttribute('width')
      const width = widthAttr ? parseInt(widthAttr, 10) : (this.offsetWidth || 400)
      const title = this.getAttribute('title') ?? undefined
      const legend = this.getAttribute('legend') !== 'false'

      // Clear and rebuild
      this.destroyChart()
      this.chartContainer.innerHTML = ''

      // Add title if provided
      if (title) {
        const titleEl = document.createElement('div')
        titleEl.className = 'chart-title'
        titleEl.textContent = title
        this.wrapper.insertBefore(titleEl, this.chartContainer)
      }

      this.chartInstance = createChart(this.chartContainer, chartResult.data, {
        type,
        width,
        height,
        labels,
        xLabels: chartResult.xLabels,
        theme,
        legend,
        tooltip: true,
      })
    } catch (err) {
      this.destroyChart()
      this.chartContainer.innerHTML = errorHTML(err instanceof Error ? err.message : String(err))
    }

    this.rendering = false
  }
}
