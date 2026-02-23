import { useContext, useEffect, useState, useCallback, useMemo } from 'react'
import type { QueryResult, TableSchema } from '@duck_ui/core'
import { FilterInjector } from '@duck_ui/core'
import { DuckContext } from './context'

export function useDuck() {
  const ctx = useContext(DuckContext)
  if (!ctx) throw new Error('useDuck must be used within a DuckProvider')
  return ctx
}

export interface UseQueryOptions {
  /** Table name for filter injection. Defaults to the first registered source. */
  tableName?: string
  /** Disable caching for this query */
  noCache?: boolean
  /** Skip filter injection (e.g. for metadata queries that need all values) */
  noFilter?: boolean
}

export interface UseQueryResult {
  data: QueryResult | null
  loading: boolean
  error: Error | null
  refetch: () => void
  /** The actual SQL executed (with filters injected) */
  effectiveSql: string
}

export function useQuery(sql: string, options?: UseQueryOptions): UseQueryResult {
  const { executor, status, filters, filterVersion, registry, cache } = useDuck()

  const effectiveSql = useMemo(() => {
    if (options?.noFilter) return sql
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== null && v !== undefined)
    )
    if (Object.keys(activeFilters).length === 0) return sql
    const table = options?.tableName ?? registry?.list()[0]?.name
    if (!table) return sql
    return FilterInjector.inject(sql, activeFilters, table)
  }, [sql, filters, options?.tableName, options?.noFilter, registry])

  const [data, setData] = useState<QueryResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(async () => {
    if (!executor || status !== 'ready') return

    // Check cache first
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
      // Store in cache
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

  return { data, loading, error, refetch: execute, effectiveSql }
}

export function useSchema(tableName?: string) {
  const { inspector, status } = useDuck()
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
