import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import { useStore } from 'zustand'
import { DuckDBManager, ConnectionPool, QueryExecutor, SchemaInspector, QueryCache, loadData, dropTables, lightTheme } from '@duck_ui/core'
import type { DataInput, QueryResult, DuckTheme } from '@duck_ui/core'
import { DuckUIContext, type DuckUIContextValue } from './context'
import { createFilterStore } from './filter-state'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DuckUIProviderProps {
  /** Data tables: key = table name, value = data input */
  data: Record<string, DataInput>
  /** Theme override */
  theme?: Partial<DuckTheme>
  /** Called when engine is ready and data is loaded */
  onReady?: () => void
  /** Called on initialization error */
  onError?: (error: Error) => void
  children: ReactNode
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DuckUIProvider({
  data,
  theme: userTheme,
  onReady,
  onError,
  children,
}: DuckUIProviderProps) {
  const storeRef = useRef<ReturnType<typeof createFilterStore>>(null)
  if (!storeRef.current) {
    storeRef.current = createFilterStore()
  }

  const [status, setStatus] = useState<DuckUIContextValue['status']>('idle')
  const [error, setError] = useState<Error | null>(null)
  const [tableNames, setTableNames] = useState<string[]>([])

  const engineRef = useRef<DuckDBManager>(null)
  const poolRef = useRef<ConnectionPool>(null)
  const executorRef = useRef<QueryExecutor>(null)
  const inspectorRef = useRef<SchemaInspector>(null)
  const cacheRef = useRef<QueryCache>(new QueryCache())
  const prevTableNamesRef = useRef<string[]>([])

  const filterState = useStore(storeRef.current)

  // Merge user theme with defaults
  const mergedTheme: DuckTheme = {
    ...lightTheme,
    ...userTheme,
  }

  // Stable data reference: only re-run init when table keys or DataInput references actually change
  const dataRef = useRef(data)
  const stableData = (() => {
    const prev = dataRef.current
    const prevKeys = Object.keys(prev).sort()
    const nextKeys = Object.keys(data).sort()
    if (
      prevKeys.length === nextKeys.length &&
      prevKeys.every((k, i) => k === nextKeys[i]) &&
      nextKeys.every((k) => prev[k] === data[k])
    ) {
      return prev
    }
    dataRef.current = data
    return data
  })()

  // Initialize engine and load data
  useEffect(() => {
    let cancelled = false

    const init = async () => {
      try {
        setStatus('loading')
        setError(null)

        // Boot engine if first time
        if (!engineRef.current) {
          const engine = new DuckDBManager()
          await engine.initialize()
          if (cancelled) { await engine.terminate(); return }

          const pool = new ConnectionPool(engine)
          const connectionHandle = {
            acquire: () => pool.acquire(),
            release: (conn: Parameters<typeof pool.release>[0]) => pool.release(conn),
          }

          engineRef.current = engine
          poolRef.current = pool
          executorRef.current = new QueryExecutor(connectionHandle)
          inspectorRef.current = new SchemaInspector(connectionHandle)
        }

        if (cancelled) return

        const pool = poolRef.current!
        const db = engineRef.current!.getDatabase()

        // Drop old tables that are no longer in the new data prop
        const conn = await pool.acquire()
        try {
          const oldTables = prevTableNamesRef.current
          const newTableKeys = Object.keys(data)
          const toDrop = oldTables.filter((t) => !newTableKeys.includes(t))
          if (toDrop.length > 0) {
            await dropTables(conn, toDrop)
          }
          if (cancelled) return

          // Load new data
          await loadData(db, conn, data)
        } finally {
          pool.release(conn)
        }

        if (cancelled) return

        cacheRef.current?.invalidate()
        const names = Object.keys(data)
        prevTableNamesRef.current = names
        setTableNames(names)
        setStatus('ready')
        onReady?.()
      } catch (err) {
        if (!cancelled) {
          const e = err instanceof Error ? err : new Error(String(err))
          setStatus('error')
          setError(e)
          onError?.(e)
        }
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [stableData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      poolRef.current?.drain()
      engineRef.current?.terminate()
    }
  }, [])

  // Public query function for useDuckUI() hook
  const query = useCallback(async (sql: string): Promise<QueryResult> => {
    if (!executorRef.current) {
      throw new Error('DuckDB engine not ready')
    }
    return executorRef.current.execute(sql)
  }, [status])

  const value: DuckUIContextValue = {
    query,
    executor: executorRef.current,
    inspector: inspectorRef.current,
    cache: cacheRef.current,
    status,
    error,
    filters: filterState.filters,
    setFilter: filterState.setFilter,
    setFilters: filterState.setFilters,
    clearFilters: filterState.clearFilters,
    filterVersion: filterState.filterVersion,
    tableNames,
    theme: mergedTheme,
  }

  return (
    <DuckUIContext.Provider value={value}>
      {children}
    </DuckUIContext.Provider>
  )
}
