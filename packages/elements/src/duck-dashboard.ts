import { observeSize } from '@duck_ui/core'
import { DuckElement } from './base'

function getResponsiveColumns(width: number | undefined, maxColumns: number): number {
  if (width === undefined) return maxColumns
  if (width < 480) return 1
  if (width < 768) return Math.min(2, maxColumns)
  if (width < 1024) return Math.min(3, maxColumns)
  return maxColumns
}

const dashboardCSS = `
  :host {
    display: block;
  }
  .dashboard-grid {
    display: grid;
    gap: var(--dashboard-gap, 16px);
    padding: var(--dashboard-padding, 24px);
    background: var(--duck-bg, #ffffff);
  }
  ::slotted(duck-panel) {
    background: var(--duck-surface, #f9fafb);
    border: 1px solid var(--duck-border, #e5e7eb);
    border-radius: 8px;
    overflow: hidden;
    min-width: 0;
  }
`

/**
 * <duck-dashboard> — Responsive CSS Grid layout container.
 *
 * Usage:
 *   <duck-dashboard columns="3" gap="16" padding="24">
 *     <duck-panel><duck-kpi ...></duck-kpi></duck-panel>
 *     <duck-panel span="2"><duck-chart ...></duck-chart></duck-panel>
 *   </duck-dashboard>
 */
export class DuckDashboardElement extends DuckElement {
  static observedAttributes = ['columns', 'gap', 'padding']

  private grid!: HTMLDivElement
  private cleanupObserver: (() => void) | null = null

  render(): void {
    // Only build DOM once
    if (!this.grid) {
      this.applyStyles(dashboardCSS)
      this.grid = document.createElement('div')
      this.grid.className = 'dashboard-grid'

      const slot = document.createElement('slot')
      this.grid.appendChild(slot)
      this.shadow.appendChild(this.grid)
    }

    this.updateLayout()
  }

  connectedCallback(): void {
    super.connectedCallback()
    this.cleanupObserver = observeSize(this, () => this.updateLayout())
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this.cleanupObserver?.()
    this.cleanupObserver = null
  }

  private updateLayout(): void {
    if (!this.grid) return

    const maxCols = parseInt(this.getAttribute('columns') ?? '2', 10)
    const gap = parseInt(this.getAttribute('gap') ?? '16', 10)
    const padding = parseInt(this.getAttribute('padding') ?? '24', 10)

    const effectiveCols = getResponsiveColumns(this.offsetWidth || undefined, maxCols)

    this.grid.style.gridTemplateColumns = `repeat(${effectiveCols}, 1fr)`
    this.grid.style.gap = `${gap}px`
    this.grid.style.padding = `${padding}px`

    const theme = this.getTheme()
    this.grid.style.background = theme.background
  }
}

/**
 * <duck-panel> — A panel inside a <duck-dashboard>.
 *
 * Usage:
 *   <duck-panel span="2" row-span="1">
 *     <duck-chart ...></duck-chart>
 *   </duck-panel>
 */
export class DuckPanelElement extends DuckElement {
  static observedAttributes = ['span', 'row-span']

  render(): void {
    // Only build DOM once
    if (this.shadow.childNodes.length === 0) {
      const style = document.createElement('style')
      style.textContent = `
        :host {
          display: block;
          min-width: 0;
          overflow: hidden;
        }
      `
      this.shadow.appendChild(style)

      const slot = document.createElement('slot')
      this.shadow.appendChild(slot)
    }

    const span = parseInt(this.getAttribute('span') ?? '1', 10)
    const rowSpan = parseInt(this.getAttribute('row-span') ?? '1', 10)

    this.style.gridColumn = span > 1 ? `span ${span}` : ''
    this.style.gridRow = rowSpan > 1 ? `span ${rowSpan}` : ''
  }
}
