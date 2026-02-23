import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  DuckDBManager,
  ConnectionPool,
  QueryExecutor,
  SchemaInspector,
  DataSourceRegistry,
  QueryCache,
  SourceLoader,
} from '@duck_ui/core'
import type { SourceConfig } from '@duck_ui/core'
import { DuckContext, type DuckContextValue } from './context'
import { createFilterStore } from './filter-state'
import { useStore } from 'zustand'

export interface DuckConfig {
  /** Data sources to load on initialization */
  sources?: SourceConfig[]
  /** Memory limit in bytes */
  memoryLimit?: number
  /** Connection pool max size */
  maxConnections?: number
}

export function DuckProvider({
  config,
  children,
}: {
  config: DuckConfig
  children: ReactNode
}) {
  const storeRef = useRef<ReturnType<typeof createFilterStore>>(null)
  if (!storeRef.current) {
    storeRef.current = createFilterStore()
  }

  const [status, setStatus] = useState<DuckContextValue['status']>('idle')
  const [error, setError] = useState<Error | null>(null)

  const engineRef = useRef<DuckDBManager>(null)
  const poolRef = useRef<ConnectionPool>(null)
  const executorRef = useRef<QueryExecutor>(null)
  const inspectorRef = useRef<SchemaInspector>(null)
  const registryRef = useRef<DataSourceRegistry>(null)
  const cacheRef = useRef<QueryCache>(new QueryCache())

  const filterState = useStore(storeRef.current)

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      try {
        setStatus('loading')
        setError(null)

        const engine = new DuckDBManager({ memoryLimit: config.memoryLimit })
        await engine.initialize()

        if (cancelled) {
          await engine.terminate()
          return
        }

        const pool = new ConnectionPool(engine, {
          maxSize: config.maxConnections ?? 4,
        })
        const connectionHandle = {
          acquire: () => pool.acquire(),
          release: (conn: Parameters<typeof pool.release>[0]) => pool.release(conn),
        }

        engineRef.current = engine
        poolRef.current = pool
        executorRef.current = new QueryExecutor(connectionHandle)
        inspectorRef.current = new SchemaInspector(connectionHandle)
        registryRef.current = new DataSourceRegistry()

        // Invalidate cache on re-init
        cacheRef.current?.invalidate()

        // Actually load sources into DuckDB
        if (config.sources) {
          const db = engine.getDatabase()
          for (const source of config.sources) {
            registryRef.current.register(source)
            const conn = await pool.acquire()
            try {
              await SourceLoader.load(db, conn, source)
            } finally {
              pool.release(conn)
            }
          }
        }

        if (!cancelled) {
          setStatus('ready')
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error')
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      }
    }

    init()

    return () => {
      cancelled = true
      poolRef.current?.drain()
      engineRef.current?.terminate()
    }
  }, [config.memoryLimit, config.maxConnections, config.sources])

  const value: DuckContextValue = {
    engine: engineRef.current,
    executor: executorRef.current,
    inspector: inspectorRef.current,
    registry: registryRef.current,
    cache: cacheRef.current,
    status,
    error,
    filters: filterState.filters,
    setFilter: filterState.setFilter,
    clearFilters: filterState.clearFilters,
    filterVersion: filterState.filterVersion,
  }

  return <DuckContext.Provider value={value}>{children}</DuckContext.Provider>
}
