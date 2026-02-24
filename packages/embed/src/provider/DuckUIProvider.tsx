import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import { useStore } from 'zustand'
import { DuckDBManager } from '../engine/init'
import { ConnectionPool } from '../engine/pool'
import { QueryExecutor, type QueryResult } from '../engine/query'
import { SchemaInspector } from '../engine/schema'
import { QueryCache } from '../engine/cache'
import { loadData, dropTables, type DataInput } from '../engine/data-loader'
import { LicenseValidator, type LicensePayload } from '../license/validator'
import { DuckUIContext, type DuckUIContextValue } from './context'
import { createFilterStore } from './filter-state'
import type { DuckTheme } from '../charts/theme'
import { lightTheme } from '../charts/theme'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DuckUIProviderProps {
  /** Data tables: key = table name, value = data input */
  data: Record<string, DataInput>
  /** Pro license key */
  license?: string
  /** Theme override */
  theme?: Partial<DuckTheme>
  /** Called when engine is ready and data is loaded */
  onReady?: () => void
  /** Called on initialization error */
  onError?: (error: Error) => void
  children: ReactNode
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

const badgeStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 8,
  right: 8,
  padding: '4px 10px',
  fontSize: 11,
  fontWeight: 500,
  color: '#6b7280',
  background: 'rgba(249,250,251,0.92)',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  zIndex: 9999,
  pointerEvents: 'auto',
  textDecoration: 'none',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DuckUIProvider({
  data,
  license,
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
  const [licensePayload, setLicensePayload] = useState<LicensePayload | null>(null)

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

  // Validate license
  useEffect(() => {
    if (!license) {
      setLicensePayload(null)
      return
    }

    const validator = new LicenseValidator()
    validator.validate(license).then((valid) => {
      setLicensePayload(valid ? validator.getPayload() : null)
    })
  }, [license])

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
  }, [data])

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

  const isPro = licensePayload !== null

  const value: DuckUIContextValue = {
    query,
    executor: executorRef.current,
    inspector: inspectorRef.current,
    cache: cacheRef.current,
    status,
    error,
    filters: filterState.filters,
    setFilter: filterState.setFilter,
    clearFilters: filterState.clearFilters,
    filterVersion: filterState.filterVersion,
    tableNames,
    license: licensePayload,
    theme: mergedTheme,
  }

  return (
    <DuckUIContext.Provider value={value}>
      {children}
      {!isPro && (
        <a
          href="https://duckui.dev"
          target="_blank"
          rel="noopener noreferrer"
          style={badgeStyle}
        >
          Powered by Duck-UI
        </a>
      )}
    </DuckUIContext.Provider>
  )
}
