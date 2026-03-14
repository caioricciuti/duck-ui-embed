import { DuckDBManager } from './engine/init'
import { ConnectionPool } from './engine/pool'
import { QueryExecutor, type QueryResult } from './engine/query'
import { SchemaInspector, type TableSchema } from './engine/schema'
import { QueryCache } from './engine/cache'
import { FilterInjector, type FilterValue } from './engine/filter-inject'
import { loadData, dropTables, type DataInput } from './engine/data-loader'
import { DuckUIError } from './engine/errors'
import type { DuckTheme } from './charts/theme'
import { lightTheme } from './charts/theme'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DuckUIStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface DuckUIOptions {
  theme?: Partial<DuckTheme>
}

// ---------------------------------------------------------------------------
// Imperative API — framework-agnostic DuckDB-WASM manager
// ---------------------------------------------------------------------------

export class DuckUI {
  private manager: DuckDBManager | null = null
  private pool: ConnectionPool | null = null
  private executor: QueryExecutor | null = null
  private _inspector: SchemaInspector | null = null
  private cache = new QueryCache()
  private _tableNames: string[] = []
  private _status: DuckUIStatus = 'idle'
  private _error: Error | null = null
  private _theme: DuckTheme
  private _filters: Record<string, FilterValue> = {}
  private _filterVersion = 0

  constructor(options?: DuckUIOptions) {
    this._theme = { ...lightTheme, ...options?.theme }
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  /** Initialize DuckDB-WASM engine and load data into tables. */
  async init(data: Record<string, DataInput>): Promise<void> {
    try {
      this._status = 'loading'
      this._error = null

      if (!this.manager) {
        const engine = new DuckDBManager()
        await engine.initialize()

        const pool = new ConnectionPool(engine)
        const connectionHandle = {
          acquire: () => pool.acquire(),
          release: (conn: Parameters<typeof pool.release>[0]) => pool.release(conn),
        }

        this.manager = engine
        this.pool = pool
        this.executor = new QueryExecutor(connectionHandle)
        this._inspector = new SchemaInspector(connectionHandle)
      }

      const db = this.manager.getDatabase()
      const conn = await this.pool!.acquire()

      try {
        // Drop old tables no longer in new data
        const newTableKeys = Object.keys(data)
        const toDrop = this._tableNames.filter((t) => !newTableKeys.includes(t))
        if (toDrop.length > 0) {
          await dropTables(conn, toDrop)
        }

        // Load new data
        await loadData(db, conn, data)
      } finally {
        this.pool!.release(conn)
      }

      this.cache.invalidate()
      this._tableNames = Object.keys(data)
      this._status = 'ready'
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      this._status = 'error'
      this._error = e
      throw e
    }
  }

  /** Cleanup: drain connection pool and terminate DuckDB. */
  async destroy(): Promise<void> {
    this.pool?.drain()
    await this.manager?.terminate()
    this.manager = null
    this.pool = null
    this.executor = null
    this._inspector = null
    this._tableNames = []
    this._status = 'idle'
  }

  // -------------------------------------------------------------------------
  // Query
  // -------------------------------------------------------------------------

  /** Execute a SQL query against the in-browser DuckDB. */
  async query(sql: string): Promise<QueryResult> {
    if (!this.executor) {
      throw new DuckUIError('DuckDB engine not ready. Call init() first.', 'NOT_READY')
    }

    // Apply active filters if any
    const hasFilters = Object.values(this._filters).some((v) => v !== null && v !== undefined)
    const finalSql = hasFilters
      ? FilterInjector.injectAsSubquery(sql, this._filters)
      : sql

    // Check cache
    const cached = this.cache.get<QueryResult>(finalSql)
    if (cached) return cached

    const result = await this.executor.execute(finalSql)
    this.cache.set(finalSql, result)
    return result
  }

  // -------------------------------------------------------------------------
  // Filters
  // -------------------------------------------------------------------------

  /** Set a filter value for a column. Pass null to clear. */
  setFilter(column: string, value: FilterValue): void {
    this._filters = { ...this._filters, [column]: value }
    this._filterVersion++
  }

  /** Set multiple filters at once (single version bump). */
  setFilters(filters: Record<string, FilterValue>): void {
    this._filters = { ...this._filters, ...filters }
    this._filterVersion++
  }

  /** Clear all active filters. */
  clearFilters(): void {
    this._filters = {}
    this._filterVersion = 0
  }

  // -------------------------------------------------------------------------
  // Schema
  // -------------------------------------------------------------------------

  /** Get schema for a table. */
  async getSchema(tableName: string): Promise<TableSchema | null> {
    if (!this._inspector) return null
    return this._inspector.getTableSchema(tableName)
  }

  // -------------------------------------------------------------------------
  // Getters
  // -------------------------------------------------------------------------

  get status(): DuckUIStatus { return this._status }
  get error(): Error | null { return this._error }
  get tableNames(): string[] { return this._tableNames }
  get theme(): DuckTheme { return this._theme }
  get filters(): Record<string, FilterValue> { return this._filters }
  get filterVersion(): number { return this._filterVersion }
  get inspector(): SchemaInspector | null { return this._inspector }
}
