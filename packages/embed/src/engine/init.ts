import type * as duckdb from '@duckdb/duckdb-wasm'

export interface DuckDBManagerConfig {
  /** Memory limit in bytes. Default: 256MB */
  memoryLimit?: number
}

export class DuckDBManager {
  private db: duckdb.AsyncDuckDB | null = null
  private worker: Worker | null = null
  private config: Required<DuckDBManagerConfig>
  private initializing = false

  constructor(config: DuckDBManagerConfig = {}) {
    this.config = {
      memoryLimit: config.memoryLimit ?? 256 * 1024 * 1024,
    }
  }

  async initialize(): Promise<void> {
    if (this.db) return
    if (this.initializing) throw new Error('DuckDB initialization already in progress')
    this.initializing = true

    let workerUrl: string | null = null
    try {
      const duckdb = await import('@duckdb/duckdb-wasm')

      const bundles = duckdb.getJsDelivrBundles()
      const bundle = await duckdb.selectBundle(bundles)

      workerUrl = URL.createObjectURL(
        new Blob([`importScripts("${bundle.mainWorker}");`], {
          type: 'text/javascript',
        })
      )

      this.worker = new Worker(workerUrl)
      const logger = new duckdb.ConsoleLogger()
      this.db = new duckdb.AsyncDuckDB(logger, this.worker)
      await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker)

      // Apply memory limit
      const conn = await this.db.connect()
      try {
        await conn.query(`SET memory_limit = '${Math.floor(this.config.memoryLimit / (1024 * 1024))}MB'`)
      } finally {
        await conn.close()
      }
    } catch (err) {
      // Clean up on failure
      if (this.db) {
        try { await this.db.terminate() } catch { /* ignore */ }
        this.db = null
      }
      if (this.worker) {
        this.worker.terminate()
        this.worker = null
      }
      throw err
    } finally {
      if (workerUrl) URL.revokeObjectURL(workerUrl)
      this.initializing = false
    }
  }

  getDatabase(): duckdb.AsyncDuckDB {
    if (!this.db) {
      throw new Error('DuckDB not initialized. Call initialize() first.')
    }
    return this.db
  }

  async createConnection(): Promise<duckdb.AsyncDuckDBConnection> {
    return this.getDatabase().connect()
  }

  async terminate(): Promise<void> {
    if (this.db) {
      await this.db.terminate()
      this.db = null
    }
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
  }

  isInitialized(): boolean {
    return this.db !== null
  }
}
