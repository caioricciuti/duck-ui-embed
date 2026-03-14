import { useState, useRef, useMemo, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type ColumnResizeMode,
} from '@tanstack/react-table'
import { formatCellValue } from '@duck_ui/core'
import type { ColumnInfo, DuckTheme } from '@duck_ui/core'
import { usePaginatedQuery, useDuckInternal } from '../provider/hooks'
import { Loading } from './shared/Loading'
import { ErrorDisplay } from './shared/Error'
import { EmptyState } from './shared/EmptyState'

type RowData = Record<string, unknown>

export interface DataTableProps {
  sql: string
  pageSize?: number
  sortable?: boolean
  resizable?: boolean
  className?: string
  tableName?: string
  striped?: boolean
  maxHeight?: number | string
}

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

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250]

function SortIndicator({ direction, theme }: { direction: 'asc' | 'desc' | null; theme: DuckTheme }) {
  if (!direction) {
    return (
      <span style={{ fontSize: 10, color: theme.borderColor, marginLeft: 4 }}>
        {'\u21C5'}
      </span>
    )
  }
  return (
    <span style={{ fontSize: 10, color: theme.primaryColor, marginLeft: 4 }}>
      {direction === 'asc' ? '\u25B2' : '\u25BC'}
    </span>
  )
}

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
  const { theme } = useDuckInternal()

  const [pageIndex, setPageIndex] = useState(0)
  const [currentPageSize, setCurrentPageSize] = useState(initialPageSize)

  const [orderBy, setOrderBy] = useState<{
    column: string
    direction: 'asc' | 'desc'
  } | undefined>(undefined)

  const [columnResizeMode] = useState<ColumnResizeMode>('onChange')
  const [hoveredResizer, setHoveredResizer] = useState<string | null>(null)

  const { rows, columns: queryColumns, totalRows, loading, error, refetch } =
    usePaginatedQuery(sql, {
      page: pageIndex,
      pageSize: currentPageSize,
      orderBy,
      tableName,
    })

  const columns = useMemo<ColumnDef<RowData, unknown>[]>(
    () => buildColumns(queryColumns),
    [queryColumns],
  )

  const handleSort = useCallback(
    (columnName: string) => {
      if (!sortable) return
      setOrderBy((prev) => {
        if (prev?.column === columnName) {
          if (prev.direction === 'asc') return { column: columnName, direction: 'desc' }
          return undefined
        }
        return { column: columnName, direction: 'asc' }
      })
      setPageIndex(0)
    },
    [sortable],
  )

  const table = useReactTable<RowData>({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode,
    enableSorting: false,
    enableColumnResizing: resizable,
  })

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const columnSizeVars = useMemo(() => {
    const headers = table.getFlatHeaders()
    const vars: Record<string, string> = {}
    for (const header of headers) {
      vars[`--header-${header.id}-size`] = `${header.getSize()}px`
      vars[`--col-${header.column.id}-size`] = `${header.column.getSize()}px`
    }
    return vars
  }, [table.getState().columnSizingInfo, table.getState().columnSizing])

  if (loading && rows.length === 0) return <Loading variant="skeleton-table" />
  if (error) return <ErrorDisplay error={error} onRetry={refetch} />
  if (!loading && rows.length === 0 && totalRows === 0) return <EmptyState />

  const pageCount = Math.max(1, Math.ceil(totalRows / currentPageSize))
  const rangeStart = totalRows === 0 ? 0 : pageIndex * currentPageSize + 1
  const rangeEnd = Math.min((pageIndex + 1) * currentPageSize, totalRows)
  const canPreviousPage = pageIndex > 0
  const canNextPage = pageIndex < pageCount - 1

  const scrollHeight = maxHeight != null
    ? (typeof maxHeight === 'number' ? maxHeight : maxHeight)
    : undefined

  // Theme-based styles
  const rootStyle: React.CSSProperties = {
    border: `1px solid ${theme.borderColor}`,
    borderRadius: 8,
    overflow: 'hidden',
    fontFamily: theme.fontFamily,
    display: 'flex',
    flexDirection: 'column',
  }

  const thBaseStyle: React.CSSProperties = {
    padding: '10px 14px',
    textAlign: 'left',
    borderBottom: `2px solid ${theme.borderColor}`,
    userSelect: 'none',
    fontSize: 12,
    fontWeight: 600,
    color: theme.textColor,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
    background: `${theme.surfaceColor}e0`,
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
    borderBottom: `1px solid ${theme.hoverColor}`,
    fontSize: 13,
    color: theme.textColor,
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
    borderRight: `2px solid ${theme.primaryColor}`,
  }

  const resizerActiveStyle: React.CSSProperties = {
    ...resizerBaseStyle,
    borderRight: `2px solid ${theme.primaryColor}`,
    background: `${theme.primaryColor}14`,
  }

  const paginationBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    padding: '10px 14px',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTop: `1px solid ${theme.borderColor}`,
    background: theme.surfaceColor,
    fontSize: 13,
    flexShrink: 0,
  }

  const paginationButtonStyle: React.CSSProperties = {
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 500,
    color: theme.textColor,
    background: theme.background,
    border: `1px solid ${theme.borderColor}`,
    borderRadius: 6,
    cursor: 'pointer',
    lineHeight: 1.5,
  }

  const selectStyle: React.CSSProperties = {
    padding: '4px 8px',
    fontSize: 13,
    border: `1px solid ${theme.borderColor}`,
    borderRadius: 6,
    background: theme.background,
    color: theme.textColor,
    cursor: 'pointer',
  }

  return (
    <div className={className} style={rootStyle}>
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
          role="grid"
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
                      aria-sort={isSorted ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
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
                        {sortable && <SortIndicator direction={sortDir} theme={theme} />}
                      </span>

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
                  background: striped && i % 2 === 1 ? theme.stripeColor : theme.background,
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

      {loading && rows.length > 0 && (
        <div
          style={{
            ...paginationBarStyle,
            justifyContent: 'center',
            borderTop: 'none',
            padding: '4px 14px',
            background: `${theme.primaryColor}10`,
            color: theme.primaryColor,
            fontSize: 12,
          }}
        >
          Loading...
        </div>
      )}

      {totalRows > 0 && (
        <div style={paginationBarStyle}>
          <span style={{ color: theme.mutedTextColor }} aria-live="polite">
            Showing {rangeStart}&ndash;{rangeEnd} of{' '}
            {totalRows.toLocaleString()} rows
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: theme.mutedTextColor,
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

            <span
              style={{
                color: theme.mutedTextColor,
                fontSize: 13,
                minWidth: 80,
                textAlign: 'center',
              }}
            >
              Page {pageIndex + 1} of {pageCount}
            </span>

            <button
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={!canPreviousPage}
              aria-label="Go to previous page"
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
              aria-label="Go to next page"
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
