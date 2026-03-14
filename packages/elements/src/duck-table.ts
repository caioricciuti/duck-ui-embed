import { DuckElement } from './base'
import { formatCellValue } from '@duck_ui/core'
import type { QueryResult, ColumnInfo } from '@duck_ui/core'
import { loadingHTML, errorHTML, emptyHTML, escapeHTML } from './styles'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250]

const tableCSS = `
  .table-root {
    border: 1px solid var(--duck-border, #e5e7eb);
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .table-scroll {
    overflow-x: auto;
    overflow-y: auto;
    flex: 1 1 auto;
  }
  table {
    min-width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  th {
    padding: 10px 14px;
    text-align: left;
    border-bottom: 2px solid var(--duck-border, #e5e7eb);
    user-select: none;
    font-size: 12px;
    font-weight: 600;
    color: var(--duck-text, #374151);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    white-space: nowrap;
    background: var(--duck-surface, #f9fafb);
    position: sticky;
    top: 0;
    z-index: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    box-sizing: border-box;
  }
  th.sortable {
    cursor: pointer;
  }
  th.sortable:hover {
    background: var(--duck-hover, #f3f4f6);
  }
  th .th-content {
    display: inline-flex;
    align-items: center;
  }
  .sort-icon {
    font-size: 10px;
    margin-left: 4px;
  }
  .sort-icon.active {
    color: var(--duck-primary, #2563eb);
  }
  .sort-icon.inactive {
    color: var(--duck-border, #e5e7eb);
  }
  td {
    padding: 10px 14px;
    border-bottom: 1px solid var(--duck-hover, #f3f4f6);
    font-size: 13px;
    color: var(--duck-text, #374151);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    box-sizing: border-box;
  }
  tr.striped {
    background: var(--duck-stripe, #f9fafb);
  }
  .resizer {
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
    width: 6px;
    cursor: col-resize;
    user-select: none;
    touch-action: none;
    border-right: 2px solid transparent;
    transition: border-color 0.15s;
  }
  .resizer:hover, .resizer.active {
    border-right-color: var(--duck-primary, #2563eb);
  }

  /* Pagination */
  .pagination {
    display: flex;
    gap: 8px;
    padding: 10px 14px;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid var(--duck-border, #e5e7eb);
    background: var(--duck-surface, #f9fafb);
    font-size: 13px;
    flex-shrink: 0;
  }
  .pagination .info {
    color: var(--duck-muted, #6b7280);
  }
  .pagination .controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .pagination .page-info {
    color: var(--duck-muted, #6b7280);
    font-size: 13px;
    min-width: 80px;
    text-align: center;
  }
  .pagination select {
    padding: 4px 8px;
    font-size: 13px;
    border: 1px solid var(--duck-border, #e5e7eb);
    border-radius: 6px;
    background: var(--duck-bg, #ffffff);
    color: var(--duck-text, #374151);
    cursor: pointer;
  }
  .pagination button {
    padding: 6px 14px;
    font-size: 13px;
    font-weight: 500;
    color: var(--duck-text, #374151);
    background: var(--duck-bg, #ffffff);
    border: 1px solid var(--duck-border, #e5e7eb);
    border-radius: 6px;
    cursor: pointer;
    line-height: 1.5;
    transition: background 0.15s;
  }
  .pagination button:hover:not(:disabled) {
    background: var(--duck-hover, #f3f4f6);
  }
  .pagination button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .pagination label {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--duck-muted, #6b7280);
    font-size: 13px;
  }
  .loading-bar {
    text-align: center;
    padding: 4px 14px;
    font-size: 12px;
    color: var(--duck-primary, #2563eb);
    background: color-mix(in srgb, var(--duck-primary, #2563eb) 6%, transparent);
  }
`

/**
 * <duck-table> — Paginated, sortable data table from a SQL query.
 *
 * Usage:
 *   <duck-table
 *     sql="SELECT * FROM orders"
 *     page-size="25"
 *     sortable
 *     striped
 *     max-height="400"
 *   ></duck-table>
 */
export class DuckTableElement extends DuckElement {
  static observedAttributes = ['sql', 'page-size', 'sortable', 'striped', 'max-height', 'resizable', 'table-name']

  private root!: HTMLDivElement
  private pageIndex = 0
  private pageSize = 25
  private orderBy: { column: string; direction: 'asc' | 'desc' } | null = null
  private totalRows = 0
  private columns: ColumnInfo[] = []
  private rows: Record<string, unknown>[] = []
  private columnWidths: Record<string, number> = {}
  private loading = false
  private rendering = false

  render(): void {
    if (!this.root) {
      this.applyStyles(tableCSS)
      this.root = document.createElement('div')
      this.shadow.appendChild(this.root)
    }

    this.pageSize = parseInt(this.getAttribute('page-size') ?? '25', 10)

    const provider = this.getProvider()
    if (!provider?.ready) {
      this.root.innerHTML = loadingHTML()
      return
    }

    this.fetchAndRender()
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
      this.root.innerHTML = errorHTML('No SQL query provided')
      this.rendering = false
      return
    }

    try {
      this.loading = true

      // Build paginated SQL
      let countSql = `SELECT COUNT(*) as cnt FROM (${sql}) _sub`
      let dataSql = `SELECT * FROM (${sql}) _sub`

      if (this.orderBy) {
        dataSql += ` ORDER BY "${this.orderBy.column}" ${this.orderBy.direction}`
      }

      dataSql += ` LIMIT ${this.pageSize} OFFSET ${this.pageIndex * this.pageSize}`

      const [countResult, dataResult] = await Promise.all([
        provider.duckUI.query(countSql),
        provider.duckUI.query(dataSql),
      ])

      this.totalRows = countResult.rows[0] ? (Object.values(countResult.rows[0])[0] as number) : 0
      this.columns = dataResult.columns
      this.rows = dataResult.rows
      this.loading = false

      if (this.rows.length === 0 && this.totalRows === 0) {
        this.root.innerHTML = emptyHTML()
        this.rendering = false
        return
      }

      this.buildTable()
    } catch (err) {
      this.loading = false
      this.root.innerHTML = errorHTML(err instanceof Error ? err.message : String(err))
    }

    this.rendering = false
  }

  private buildTable(): void {
    const sortable = this.hasAttribute('sortable')
    const striped = this.getAttribute('striped') !== 'false'
    const resizable = this.getAttribute('resizable') !== 'false'
    const maxHeight = this.getAttribute('max-height')

    // Initialize column widths
    for (const col of this.columns) {
      if (!this.columnWidths[col.name]) {
        this.columnWidths[col.name] = 150
      }
    }

    const root = document.createElement('div')
    root.className = 'table-root'

    // Scroll container
    const scroll = document.createElement('div')
    scroll.className = 'table-scroll'
    if (maxHeight) {
      scroll.style.maxHeight = `${maxHeight}px`
    }

    // Table
    const table = document.createElement('table')
    table.setAttribute('role', 'grid')

    // Total width
    const totalWidth = this.columns.reduce((sum, col) => sum + (this.columnWidths[col.name] ?? 150), 0)
    table.style.width = `${totalWidth}px`

    // Thead
    const thead = document.createElement('thead')
    const headerRow = document.createElement('tr')

    for (const col of this.columns) {
      const th = document.createElement('th')
      th.style.width = `${this.columnWidths[col.name] ?? 150}px`
      th.style.position = 'relative'

      if (sortable) {
        th.className = 'sortable'
        th.addEventListener('click', () => this.handleSort(col.name))
        const isSorted = this.orderBy?.column === col.name
        if (isSorted) {
          th.setAttribute('aria-sort', this.orderBy!.direction === 'asc' ? 'ascending' : 'descending')
        }
      }

      const content = document.createElement('span')
      content.className = 'th-content'
      content.textContent = col.name

      if (sortable) {
        const sortIcon = document.createElement('span')
        const isSorted = this.orderBy?.column === col.name
        if (isSorted) {
          sortIcon.className = 'sort-icon active'
          sortIcon.textContent = this.orderBy!.direction === 'asc' ? '\u25B2' : '\u25BC'
        } else {
          sortIcon.className = 'sort-icon inactive'
          sortIcon.textContent = '\u21C5'
        }
        content.appendChild(sortIcon)
      }

      th.appendChild(content)

      // Resizer
      if (resizable) {
        const resizer = document.createElement('div')
        resizer.className = 'resizer'
        resizer.addEventListener('pointerdown', (e) => this.startResize(e, col.name, th, table))
        resizer.addEventListener('click', (e) => e.stopPropagation())
        th.appendChild(resizer)
      }

      headerRow.appendChild(th)
    }

    thead.appendChild(headerRow)
    table.appendChild(thead)

    // Tbody
    const tbody = document.createElement('tbody')

    for (let i = 0; i < this.rows.length; i++) {
      const row = this.rows[i]
      const tr = document.createElement('tr')
      if (striped && i % 2 === 1) {
        tr.className = 'striped'
      }

      for (const col of this.columns) {
        const td = document.createElement('td')
        const w = this.columnWidths[col.name] ?? 150
        td.style.width = `${w}px`
        td.style.maxWidth = `${w}px`
        const val = row[col.name]
        td.textContent = formatCellValue(val)
        td.title = String(val ?? '')
        tr.appendChild(td)
      }

      tbody.appendChild(tr)
    }

    table.appendChild(tbody)
    scroll.appendChild(table)
    root.appendChild(scroll)

    // Pagination
    if (this.totalRows > 0) {
      root.appendChild(this.buildPagination())
    }

    this.root.innerHTML = ''
    this.root.appendChild(root)
  }

  private buildPagination(): HTMLDivElement {
    const pageCount = Math.max(1, Math.ceil(this.totalRows / this.pageSize))
    const rangeStart = this.totalRows === 0 ? 0 : this.pageIndex * this.pageSize + 1
    const rangeEnd = Math.min((this.pageIndex + 1) * this.pageSize, this.totalRows)
    const canPrev = this.pageIndex > 0
    const canNext = this.pageIndex < pageCount - 1

    const bar = document.createElement('div')
    bar.className = 'pagination'

    const info = document.createElement('span')
    info.className = 'info'
    info.setAttribute('aria-live', 'polite')
    info.innerHTML = `Showing ${rangeStart}&ndash;${rangeEnd} of ${this.totalRows.toLocaleString()} rows`
    bar.appendChild(info)

    const controls = document.createElement('div')
    controls.className = 'controls'

    // Page size selector
    const label = document.createElement('label')
    label.textContent = 'Rows: '
    const select = document.createElement('select')
    for (const size of PAGE_SIZE_OPTIONS) {
      const option = document.createElement('option')
      option.value = String(size)
      option.textContent = String(size)
      if (size === this.pageSize) option.selected = true
      select.appendChild(option)
    }
    select.addEventListener('change', () => {
      this.pageSize = parseInt(select.value, 10)
      this.pageIndex = 0
      this.fetchAndRender()
    })
    label.appendChild(select)
    controls.appendChild(label)

    // Page info
    const pageInfo = document.createElement('span')
    pageInfo.className = 'page-info'
    pageInfo.textContent = `Page ${this.pageIndex + 1} of ${pageCount}`
    controls.appendChild(pageInfo)

    // Previous button
    const prevBtn = document.createElement('button')
    prevBtn.textContent = 'Previous'
    prevBtn.disabled = !canPrev
    prevBtn.setAttribute('aria-label', 'Go to previous page')
    prevBtn.addEventListener('click', () => {
      if (canPrev) {
        this.pageIndex--
        this.fetchAndRender()
      }
    })
    controls.appendChild(prevBtn)

    // Next button
    const nextBtn = document.createElement('button')
    nextBtn.textContent = 'Next'
    nextBtn.disabled = !canNext
    nextBtn.setAttribute('aria-label', 'Go to next page')
    nextBtn.addEventListener('click', () => {
      if (canNext) {
        this.pageIndex++
        this.fetchAndRender()
      }
    })
    controls.appendChild(nextBtn)

    bar.appendChild(controls)
    return bar
  }

  private handleSort(column: string): void {
    if (this.orderBy?.column === column) {
      if (this.orderBy.direction === 'asc') {
        this.orderBy = { column, direction: 'desc' }
      } else {
        this.orderBy = null
      }
    } else {
      this.orderBy = { column, direction: 'asc' }
    }
    this.pageIndex = 0
    this.fetchAndRender()
  }

  private startResize(e: PointerEvent, colName: string, th: HTMLTableCellElement, table: HTMLTableElement): void {
    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX
    const startWidth = this.columnWidths[colName] ?? 150
    const resizer = e.target as HTMLDivElement
    resizer.classList.add('active')

    const onMove = (ev: PointerEvent) => {
      const delta = ev.clientX - startX
      const newWidth = Math.max(60, Math.min(600, startWidth + delta))
      this.columnWidths[colName] = newWidth
      th.style.width = `${newWidth}px`

      // Update td widths in the same column index
      const colIndex = this.columns.findIndex((c) => c.name === colName)
      if (colIndex >= 0) {
        const tds = table.querySelectorAll(`tbody td:nth-child(${colIndex + 1})`)
        tds.forEach((td) => {
          ;(td as HTMLElement).style.width = `${newWidth}px`
          ;(td as HTMLElement).style.maxWidth = `${newWidth}px`
        })
      }

      // Update total table width
      const totalWidth = this.columns.reduce((sum, col) => sum + (this.columnWidths[col.name] ?? 150), 0)
      table.style.width = `${totalWidth}px`
    }

    const onUp = () => {
      resizer.classList.remove('active')
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }
}
