import { DuckElement } from './base'
import { exportToFile } from '@duck_ui/core'
import type { QueryResult } from '@duck_ui/core'
import { loadingHTML, errorHTML, escapeHTML } from './styles'

const exportCSS = `
  .export-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    font-size: 13px;
    font-weight: 500;
    color: var(--duck-text, #374151);
    background: var(--duck-bg, #ffffff);
    border: 1px solid var(--duck-border, #e5e7eb);
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
    line-height: 1.5;
    transition: background 0.15s, border-color 0.15s;
  }
  .export-btn:hover:not(:disabled) {
    background: var(--duck-hover, #f3f4f6);
    border-color: var(--duck-primary, #2563eb);
  }
  .export-btn:disabled {
    color: var(--duck-muted, #6b7280);
    background: var(--duck-surface, #f9fafb);
    cursor: not-allowed;
    opacity: 0.6;
  }
  .export-btn svg {
    flex-shrink: 0;
  }
`

/**
 * <duck-export> — Export button that runs a SQL query and downloads the result.
 *
 * Usage:
 *   <duck-export sql="SELECT * FROM orders" format="csv" file-name="orders"></duck-export>
 */
export class DuckExportElement extends DuckElement {
  static observedAttributes = ['sql', 'format', 'file-name', 'label']

  private button!: HTMLButtonElement
  private lastResult: QueryResult | null = null

  render(): void {
    if (!this.button) {
      this.applyStyles(exportCSS)
      this.button = document.createElement('button')
      this.button.className = 'export-btn'
      this.button.addEventListener('click', () => this.handleExport())
      this.shadow.appendChild(this.button)
    }

    const label = this.getAttribute('label') ?? 'Export'

    this.button.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 2v7m0 0L4.5 6.5M7 9l2.5-2.5M2 11h10"
          stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      ${escapeHTML(label)}
    `

    // Pre-fetch data if we have a SQL query
    this.fetchData()
  }

  private async fetchData(): Promise<void> {
    const sql = this.getAttribute('sql')
    if (!sql) return

    const provider = this.getProvider()
    if (!provider?.ready) return

    try {
      this.lastResult = await provider.duckUI.query(sql)
      this.button.disabled = !this.lastResult || this.lastResult.rowCount === 0
    } catch {
      this.button.disabled = true
    }
  }

  private handleExport(): void {
    if (!this.lastResult || this.lastResult.rowCount === 0) return

    const format = (this.getAttribute('format') as 'csv' | 'json') ?? 'csv'
    const fileName = this.getAttribute('file-name') ?? 'export'

    exportToFile(this.lastResult, format, fileName)
  }
}
