import { useState, useRef, useMemo, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type ColumnResizeMode,
} from '@tanstack/react-table'
import { usePaginatedQuery } from '../provider/hooks'
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

function SortIndicator({ direction }: { direction: 'asc' | 'desc' | null }) {
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
  className,
  tableName,
  striped = true,
  maxHeight,
}: DataTableProps) {
  // Pagination state
  const [pageIndex, setPageIndex] = useState(0)
  const [currentPageSize, setCurrentPageSize] = useState(initialPageSize)

  // Sort state (SQL-level sorting)
  const [orderBy, setOrderBy] = useState<{
    column: string
    direction: 'asc' | 'desc'
  } | undefined>(undefined)

  const [columnResizeMode] = useState<ColumnResizeMode>('onChange')
  const [hoveredResizer, setHoveredResizer] = useState<string | null>(null)

  // SQL-level paginated query
  const { rows, columns: queryColumns, totalRows, loading, error } =
    usePaginatedQuery(sql, {
      page: pageIndex,
      pageSize: currentPageSize,
      orderBy,
      tableName,
    })

  // Build column definitions from query result
  const columns = useMemo<ColumnDef<RowData, unknown>[]>(
    () => buildColumns(queryColumns),
    [queryColumns],
  )

  // Handle sort click
  const handleSort = useCallback(
    (columnName: string) => {
      if (!sortable) return
      setOrderBy((prev) => {
        if (prev?.column === columnName) {
          if (prev.direction === 'asc') return { column: columnName, direction: 'desc' }
          // If already desc, clear sort
          return undefined
        }
        return { column: columnName, direction: 'asc' }
      })
      // Reset to first page when sort changes
      setPageIndex(0)
    },
    [sortable],
  )

  // Table instance (no client-side sorting/pagination — handled by SQL)
  const table = useReactTable<RowData>({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode,
    enableSorting: false, // sorting handled via SQL
    enableColumnResizing: resizable,
  })

  // Virtualisation ref (for scroll container)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Column widths (for resize tracking)
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
  if (loading && rows.length === 0) return <Loading />
  if (error) return <ErrorDisplay error={error} />
  if (!loading && rows.length === 0 && totalRows === 0) return <EmptyState />

  // ----- Derived pagination info -----
  const pageCount = Math.max(1, Math.ceil(totalRows / currentPageSize))
  const rangeStart = totalRows === 0 ? 0 : pageIndex * currentPageSize + 1
  const rangeEnd = Math.min((pageIndex + 1) * currentPageSize, totalRows)
  const canPreviousPage = pageIndex > 0
  const canNextPage = pageIndex < pageCount - 1

  // ----- Scroll container height -----
  const scrollHeight = maxHeight != null
    ? (typeof maxHeight === 'number' ? maxHeight : maxHeight)
    : undefined

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
                  const canResize = header.column.getCanResize()
                  const isResizing = header.column.getIsResizing()
                  const isSorted = orderBy?.column === header.column.id
                  const sortDir = isSorted ? orderBy!.direction : null

                  return (
                    <th
                      key={header.id}
                      style={{
                        ...thBaseStyle,
                        width: `var(--header-${header.id}-size)`,
                        position: 'sticky',
                        top: 0,
                        cursor: sortable ? 'pointer' : 'default',
                      }}
                      onClick={sortable ? () => handleSort(header.column.id) : undefined}
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
                        {sortable && <SortIndicator direction={sortDir} />}
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
        </table>
      </div>

      {/* Loading overlay for page transitions */}
      {loading && rows.length > 0 && (
        <div
          style={{
            ...paginationBarStyle,
            justifyContent: 'center',
            borderTop: 'none',
            padding: '4px 14px',
            background: '#eff6ff',
            color: '#2563eb',
            fontSize: 12,
          }}
        >
          Loading...
        </div>
      )}

      {/* Pagination bar */}
      {totalRows > 0 && (
        <div style={paginationBarStyle}>
          <span style={{ color: '#6b7280' }}>
            Showing {rangeStart}&ndash;{rangeEnd} of{' '}
            {totalRows.toLocaleString()} rows
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Page size selector */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: '#6b7280',
                fontSize: 13,
              }}
            >
              Rows:
              <select
                value={currentPageSize}
                onChange={(e) => {
                  setCurrentPageSize(Number(e.target.value))
                  setPageIndex(0)
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
            <span
              style={{
                color: '#6b7280',
                fontSize: 13,
                minWidth: 80,
                textAlign: 'center',
              }}
            >
              Page {pageIndex + 1} of {pageCount}
            </span>

            {/* Navigation buttons */}
            <button
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={!canPreviousPage}
              style={{
                ...paginationButtonStyle,
                opacity: canPreviousPage ? 1 : 0.5,
                cursor: canPreviousPage ? 'pointer' : 'not-allowed',
              }}
            >
              Previous
            </button>
            <button
              onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + 1))}
              disabled={!canNextPage}
              style={{
                ...paginationButtonStyle,
                opacity: canNextPage ? 1 : 0.5,
                cursor: canNextPage ? 'pointer' : 'not-allowed',
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
