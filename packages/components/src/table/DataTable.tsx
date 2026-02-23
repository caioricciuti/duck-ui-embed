import { useState, useRef, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnResizeMode,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useQuery } from '../provider/hooks'
import type { UseQueryOptions } from '../provider/hooks'
import type { ColumnInfo } from '@duck_ui/core'
import { Loading } from '../shared/Loading'
import { ErrorDisplay } from '../shared/Error'
import { EmptyState } from '../shared/EmptyState'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RowData = Record<string, unknown>

export interface DataTableProps {
  /** SQL query to execute */
  sql: string
  /** Page size for pagination */
  pageSize?: number
  /** Enable sorting */
  sortable?: boolean
  /** Enable column resizing */
  resizable?: boolean
  /** Row count threshold to enable virtualisation (default 200) */
  virtualizeThreshold?: number
  /** Custom className on the root wrapper */
  className?: string
  /** Table name for filter injection */
  tableName?: string
  /** Stripe alternate rows */
  striped?: boolean
  /** Max height for the scroll container (px or CSS string) */
  maxHeight?: number | string
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '\u2014'
  if (typeof value === 'number') {
    return value.toLocaleString(undefined, { maximumFractionDigits: 6 })
  }
  if (value instanceof Date) {
    return value.toLocaleDateString()
  }
  return String(value)
}

// ---------------------------------------------------------------------------
// Column generation
// ---------------------------------------------------------------------------

function buildColumns(columns: ColumnInfo[]): ColumnDef<RowData, unknown>[] {
  return columns.map((col) => ({
    id: col.name,
    accessorKey: col.name,
    header: col.name,
    cell: (info) => formatCellValue(info.getValue()),
    size: 150,
    minSize: 60,
    maxSize: 600,
  }))
}

// ---------------------------------------------------------------------------
// Styles (static objects kept outside render to avoid re-allocation)
// ---------------------------------------------------------------------------

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250]

const rootStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  overflow: 'hidden',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  display: 'flex',
  flexDirection: 'column',
}

const thBaseStyle: React.CSSProperties = {
  padding: '10px 14px',
  textAlign: 'left',
  borderBottom: '2px solid #e5e7eb',
  userSelect: 'none',
  fontSize: 12,
  fontWeight: 600,
  color: '#374151',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
  background: 'rgba(249,250,251,0.85)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  position: 'sticky',
  top: 0,
  zIndex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  boxSizing: 'border-box',
}

const tdBaseStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderBottom: '1px solid #f3f4f6',
  fontSize: 13,
  color: '#374151',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
}

const resizerBaseStyle: React.CSSProperties = {
  position: 'absolute',
  right: 0,
  top: 0,
  height: '100%',
  width: 6,
  cursor: 'col-resize',
  userSelect: 'none',
  touchAction: 'none',
  borderRight: '2px solid transparent',
  transition: 'border-color 0.15s',
}

const resizerHoverStyle: React.CSSProperties = {
  ...resizerBaseStyle,
  borderRight: '2px solid #2563eb',
}

const resizerActiveStyle: React.CSSProperties = {
  ...resizerBaseStyle,
  borderRight: '2px solid #2563eb',
  background: 'rgba(37,99,235,0.08)',
}

const paginationBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  padding: '10px 14px',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderTop: '1px solid #e5e7eb',
  background: '#f9fafb',
  fontSize: 13,
  flexShrink: 0,
}

const paginationButtonStyle: React.CSSProperties = {
  padding: '6px 14px',
  fontSize: 13,
  fontWeight: 500,
  color: '#374151',
  background: '#fff',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  cursor: 'pointer',
  lineHeight: 1.5,
}

const selectStyle: React.CSSProperties = {
  padding: '4px 8px',
  fontSize: 13,
  border: '1px solid #d1d5db',
  borderRadius: 6,
  background: '#fff',
  color: '#374151',
  cursor: 'pointer',
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SortIndicator({ direction }: { direction: 'asc' | 'desc' | false }) {
  if (!direction) {
    return (
      <span style={{ fontSize: 10, color: '#d1d5db', marginLeft: 4 }}>
        {'⇅'}
      </span>
    )
  }
  return (
    <span style={{ fontSize: 10, color: '#2563eb', marginLeft: 4 }}>
      {direction === 'asc' ? '▲' : '▼'}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DataTable({
  sql,
  pageSize: initialPageSize = 25,
  sortable = true,
  resizable = true,
  virtualizeThreshold = 200,
  className,
  tableName,
  striped = true,
  maxHeight,
}: DataTableProps) {
  const queryOpts: UseQueryOptions | undefined = tableName
    ? { tableName }
    : undefined
  const { data, loading, error } = useQuery(sql, queryOpts)

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnResizeMode] = useState<ColumnResizeMode>('onChange')
  const [hoveredResizer, setHoveredResizer] = useState<string | null>(null)

  // Build column definitions from QueryResult
  const columns = useMemo<ColumnDef<RowData, unknown>[]>(
    () => (data ? buildColumns(data.columns) : []),
    [data],
  )

  const rows = useMemo<RowData[]>(() => data?.rows ?? [], [data])

  const shouldVirtualize = rows.length > virtualizeThreshold

  // Table instance
  const table = useReactTable<RowData>({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // Only enable client-side pagination when NOT virtualising
    ...(shouldVirtualize
      ? {}
      : { getPaginationRowModel: getPaginationRowModel() }),
    columnResizeMode,
    enableSorting: sortable,
    enableColumnResizing: resizable,
    initialState: {
      pagination: {
        pageSize: initialPageSize,
      },
    },
  })

  // Virtualisation refs
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const ROW_HEIGHT = 40

  const allRows = table.getRowModel().rows
  const virtualizer = useVirtualizer({
    count: shouldVirtualize ? allRows.length : 0,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
    enabled: shouldVirtualize,
  })

  // ----- Column widths (for resize tracking) -----
  const columnSizeVars = useMemo(() => {
    const headers = table.getFlatHeaders()
    const vars: Record<string, string> = {}
    for (const header of headers) {
      vars[`--header-${header.id}-size`] = `${header.getSize()}px`
      vars[`--col-${header.column.id}-size`] = `${header.column.getSize()}px`
    }
    return vars
  }, [table.getState().columnSizingInfo, table.getState().columnSizing])

  // ----- Loading / Error / Empty -----
  if (loading) return <Loading />
  if (error) return <ErrorDisplay error={error} />
  if (!data || data.rowCount === 0) return <EmptyState />

  // ----- Derived pagination info -----
  const pageIndex = table.getState().pagination.pageIndex
  const currentPageSize = table.getState().pagination.pageSize
  const totalRows = shouldVirtualize ? rows.length : table.getFilteredRowModel().rows.length
  const pageCount = shouldVirtualize ? 1 : table.getPageCount()
  const rangeStart = shouldVirtualize ? 1 : pageIndex * currentPageSize + 1
  const rangeEnd = shouldVirtualize ? totalRows : Math.min((pageIndex + 1) * currentPageSize, totalRows)

  // ----- Scroll container height -----
  const scrollHeight =
    maxHeight != null
      ? typeof maxHeight === 'number'
        ? maxHeight
        : maxHeight
      : shouldVirtualize
        ? 600
        : undefined

  // ----- Render rows -----
  const renderRows = () => {
    if (shouldVirtualize) {
      const virtualItems = virtualizer.getVirtualItems()
      const totalSize = virtualizer.getTotalSize()

      return (
        <tbody>
          {/* Top spacer */}
          {virtualItems.length > 0 && (
            <tr>
              <td
                style={{ height: virtualItems[0].start, padding: 0, border: 'none' }}
                colSpan={columns.length}
              />
            </tr>
          )}
          {virtualItems.map((virtualRow) => {
            const row = allRows[virtualRow.index]
            const isEven = virtualRow.index % 2 === 0
            return (
              <tr
                key={row.id}
                data-index={virtualRow.index}
                style={{
                  height: ROW_HEIGHT,
                  background: striped && !isEven ? '#f9fafb' : '#fff',
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    style={{
                      ...tdBaseStyle,
                      width: `var(--col-${cell.column.id}-size)`,
                      maxWidth: `var(--col-${cell.column.id}-size)`,
                    }}
                    title={String(cell.getValue() ?? '')}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            )
          })}
          {/* Bottom spacer */}
          {virtualItems.length > 0 && (
            <tr>
              <td
                style={{
                  height: totalSize - (virtualItems[virtualItems.length - 1].end),
                  padding: 0,
                  border: 'none',
                }}
                colSpan={columns.length}
              />
            </tr>
          )}
        </tbody>
      )
    }

    // Non-virtual: render paginated rows
    return (
      <tbody>
        {table.getRowModel().rows.map((row, i) => (
          <tr
            key={row.id}
            style={{
              background: striped && i % 2 === 1 ? '#f9fafb' : '#fff',
              transition: 'background 0.1s',
            }}
          >
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                style={{
                  ...tdBaseStyle,
                  width: `var(--col-${cell.column.id}-size)`,
                  maxWidth: `var(--col-${cell.column.id}-size)`,
                }}
                title={String(cell.getValue() ?? '')}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    )
  }

  // ----- Pagination controls (not shown during virtualisation) -----
  const showPagination = !shouldVirtualize && pageCount > 1

  return (
    <div className={className} style={rootStyle}>
      {/* Scroll container */}
      <div
        ref={scrollContainerRef}
        style={{
          overflowX: 'auto',
          overflowY: 'auto',
          flex: '1 1 auto',
          ...(scrollHeight != null ? { maxHeight: scrollHeight } : {}),
          // Inject CSS custom properties for column widths
          ...columnSizeVars,
        } as React.CSSProperties}
      >
        <table
          style={{
            width: table.getTotalSize(),
            minWidth: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
          }}
        >
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  const canResize = header.column.getCanResize()
                  const isResizing = header.column.getIsResizing()

                  return (
                    <th
                      key={header.id}
                      style={{
                        ...thBaseStyle,
                        width: `var(--header-${header.id}-size)`,
                        position: 'sticky',
                        top: 0,
                        cursor: canSort ? 'pointer' : 'default',
                      }}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && <SortIndicator direction={sorted} />}
                      </span>

                      {/* Resize handle */}
                      {canResize && (
                        <div
                          onDoubleClick={() => header.column.resetSize()}
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          onMouseEnter={() => setHoveredResizer(header.id)}
                          onMouseLeave={() => setHoveredResizer(null)}
                          onClick={(e) => e.stopPropagation()}
                          style={
                            isResizing
                              ? resizerActiveStyle
                              : hoveredResizer === header.id
                                ? resizerHoverStyle
                                : resizerBaseStyle
                          }
                        />
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>

          {renderRows()}
        </table>
      </div>

      {/* Pagination bar */}
      {showPagination && (
        <div style={paginationBarStyle}>
          <span style={{ color: '#6b7280' }}>
            Showing {rangeStart}&ndash;{rangeEnd} of {totalRows} rows
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Page size selector */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6b7280', fontSize: 13 }}>
              Rows:
              <select
                value={currentPageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value))
                }}
                style={selectStyle}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>

            {/* Page indicator */}
            <span style={{ color: '#6b7280', fontSize: 13, minWidth: 80, textAlign: 'center' }}>
              Page {pageIndex + 1} of {pageCount}
            </span>

            {/* Navigation buttons */}
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              style={{
                ...paginationButtonStyle,
                opacity: table.getCanPreviousPage() ? 1 : 0.5,
                cursor: table.getCanPreviousPage() ? 'pointer' : 'not-allowed',
              }}
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              style={{
                ...paginationButtonStyle,
                opacity: table.getCanNextPage() ? 1 : 0.5,
                cursor: table.getCanNextPage() ? 'pointer' : 'not-allowed',
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Row count footer for virtualised mode */}
      {shouldVirtualize && (
        <div style={{ ...paginationBarStyle, justifyContent: 'center' }}>
          <span style={{ color: '#6b7280' }}>
            {totalRows.toLocaleString()} rows (virtualised)
          </span>
        </div>
      )}
    </div>
  )
}
