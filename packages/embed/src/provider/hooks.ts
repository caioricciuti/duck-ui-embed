import { useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { FilterInjector } from '@duck_ui/core'
import type { QueryResult, TableSchema, DuckTheme } from '@duck_ui/core'
import { DuckUIContext, type DuckUIContextValue } from './context'

// ---------------------------------------------------------------------------
// useDuckUI — public hook
// ---------------------------------------------------------------------------

export function useDuckUI(): Pick<DuckUIContextValue, 'query' | 'status'> {
  const ctx = useContext(DuckUIContext)
  if (!ctx) throw new Error('useDuckUI must be used within a DuckUIProvider')
  return { query: ctx.query, status: ctx.status }
}

// ---------------------------------------------------------------------------
// Internal context hook (used by components)
// ---------------------------------------------------------------------------

export function useDuckInternal(): DuckUIContextValue {
  const ctx = useContext(DuckUIContext)
  if (!ctx) throw new Error('Duck-UI components must be used within a DuckUIProvider')
  return ctx
}

// ---------------------------------------------------------------------------
// useTheme — public hook
// ---------------------------------------------------------------------------

export function useTheme(): DuckTheme {
  const ctx = useContext(DuckUIContext)
  if (!ctx) throw new Error('useTheme must be used within a DuckUIProvider')
  return ctx.theme
}

// ---------------------------------------------------------------------------
// useQuery
// ---------------------------------------------------------------------------

export interface UseQueryOptions {
  tableName?: string
  noCache?: boolean
  noFilter?: boolean
}

export interface UseQueryResult {
  data: QueryResult | null
  loading: boolean
  error: Error | null
  refetch: () => void
}

export function useQuery(sql: string, options?: UseQueryOptions): UseQueryResult {
  const { executor, status, filters, filterVersion, tableNames, cache } = useDuckInternal()

  const effectiveSql = useMemo(() => {
    if (options?.noFilter) return sql
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== null && v !== undefined)
    )
    if (Object.keys(activeFilters).length === 0) return sql
    const table = options?.tableName ?? tableNames[0]
    if (!table) return sql
    return FilterInjector.inject(sql, activeFilters, table)
  }, [sql, filters, options?.tableName, options?.noFilter, tableNames])

  const [data, setData] = useState<QueryResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(async () => {
    if (!executor || status !== 'ready') return

    if (!options?.noCache && cache) {
      const cached = cache.get<QueryResult>(effectiveSql)
      if (cached) {
        setData(cached)
        setLoading(false)
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      const result = await executor.execute(effectiveSql)
      setData(result)
      if (!options?.noCache && cache) {
        cache.set(effectiveSql, result)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [executor, effectiveSql, status, filterVersion, cache, options?.noCache])

  useEffect(() => {
    execute()
  }, [execute])

  return { data, loading, error, refetch: execute }
}

// ---------------------------------------------------------------------------
// usePaginatedQuery
// ---------------------------------------------------------------------------

export interface UsePaginatedQueryOptions {
  page: number
  pageSize: number
  orderBy?: { column: string; direction: 'asc' | 'desc' }
  tableName?: string
  noFilter?: boolean
}

export interface UsePaginatedQueryResult {
  rows: Record<string, unknown>[]
  columns: QueryResult['columns']
  totalRows: number
  loading: boolean
  error: Error | null
  refetch: () => void
}

export function usePaginatedQuery(
  sql: string,
  options: UsePaginatedQueryOptions
): UsePaginatedQueryResult {
  const { executor, status, filters, filterVersion, tableNames, cache } = useDuckInternal()

  const baseSql = useMemo(() => {
    if (options.noFilter) return sql
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== null && v !== undefined)
    )
    if (Object.keys(activeFilters).length === 0) return sql
    const table = options.tableName ?? tableNames[0]
    if (!table) return sql
    return FilterInjector.inject(sql, activeFilters, table)
  }, [sql, filters, options.tableName, options.noFilter, tableNames])

  const countSql = useMemo(
    () => `SELECT COUNT(*) AS _total FROM (${baseSql}) AS _count_base`,
    [baseSql]
  )

  const pageSql = useMemo(() => {
    const orderClause = options.orderBy
      ? ` ORDER BY "${options.orderBy.column}" ${options.orderBy.direction.toUpperCase()}`
      : ''
    const offset = options.page * options.pageSize
    return `SELECT * FROM (${baseSql}) AS _page_base${orderClause} LIMIT ${options.pageSize} OFFSET ${offset}`
  }, [baseSql, options.orderBy, options.page, options.pageSize])

  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [columns, setColumns] = useState<QueryResult['columns']>([])
  const [totalRows, setTotalRows] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(async () => {
    if (!executor || status !== 'ready') return

    setLoading(true)
    setError(null)

    try {
      const [countResult, pageResult] = await Promise.all([
        cache?.get<QueryResult>(countSql)
          ? Promise.resolve(cache.get<QueryResult>(countSql)!)
          : executor.execute(countSql),
        executor.execute(pageSql),
      ])

      if (cache && !cache.get(countSql)) {
        cache.set(countSql, countResult)
      }

      const total = Number(countResult.rows[0]?._total ?? 0)
      setTotalRows(total)
      setRows(pageResult.rows)
      setColumns(pageResult.columns)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [executor, countSql, pageSql, status, filterVersion, cache])

  useEffect(() => {
    execute()
  }, [execute])

  return { rows, columns, totalRows, loading, error, refetch: execute }
}

// ---------------------------------------------------------------------------
// useSchema
// ---------------------------------------------------------------------------

export function useSchema(tableName?: string) {
  const { inspector, status } = useDuckInternal()
  const [tables, setTables] = useState<string[]>([])
  const [schema, setSchema] = useState<TableSchema | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!inspector || status !== 'ready') return

    const load = async () => {
      setLoading(true)
      try {
        const tableList = await inspector.getTables()
        setTables(tableList)

        if (tableName) {
          const tableSchema = await inspector.getTableSchema(tableName)
          setSchema(tableSchema)
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [inspector, status, tableName])

  return { tables, schema, loading }
}
