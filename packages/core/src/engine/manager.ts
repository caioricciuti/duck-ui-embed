import type * as duckdb from '@duckdb/duckdb-wasm'

export interface DuckDBManagerConfig {
  /** Memory limit in bytes. Default: 256MB */
  memoryLimit?: number
  /** Log warnings when memory exceeds this percentage. Default: 0.8 */
  memoryWarningThreshold?: number
}

export class DuckDBManager {
  private db: duckdb.AsyncDuckDB | null = null
  private worker: Worker | null = null
  private config: Required<DuckDBManagerConfig>

  constructor(config: DuckDBManagerConfig = {}) {
    this.config = {
      memoryLimit: config.memoryLimit ?? 256 * 1024 * 1024,
      memoryWarningThreshold: config.memoryWarningThreshold ?? 0.8,
    }
  }

  async initialize(): Promise<void> {
    const duckdb = await import('@duckdb/duckdb-wasm')

    // Select the best bundle based on browser capabilities
    const bundles = duckdb.getJsDelivrBundles()
    const bundle = await duckdb.selectBundle(bundles)

    const workerUrl = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker}");`], {
        type: 'text/javascript',
      })
    )

    this.worker = new Worker(workerUrl)
    const logger = new duckdb.ConsoleLogger()
    this.db = new duckdb.AsyncDuckDB(logger, this.worker)
    await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker)

    URL.revokeObjectURL(workerUrl)
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
