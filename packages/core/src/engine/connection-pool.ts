import type * as duckdb from '@duckdb/duckdb-wasm'
import type { DuckDBManager } from './manager'
import { ConnectionError } from '../errors'

export interface ConnectionPoolConfig {
  maxSize?: number
  acquireTimeoutMs?: number
}

export class ConnectionPool {
  private pool: duckdb.AsyncDuckDBConnection[] = []
  private inUse = new Set<duckdb.AsyncDuckDBConnection>()
  private waiters: Array<{
    resolve: (conn: duckdb.AsyncDuckDBConnection) => void
    reject: (err: Error) => void
    timer: ReturnType<typeof setTimeout>
  }> = []
  private maxSize: number
  private acquireTimeoutMs: number

  constructor(
    private manager: DuckDBManager,
    config: ConnectionPoolConfig = {}
  ) {
    this.maxSize = config.maxSize ?? 4
    this.acquireTimeoutMs = config.acquireTimeoutMs ?? 30_000
  }

  async acquire(): Promise<duckdb.AsyncDuckDBConnection> {
    // Reuse idle connection
    const idle = this.pool.pop()
    if (idle) {
      this.inUse.add(idle)
      return idle
    }

    // Create new if under limit
    if (this.inUse.size < this.maxSize) {
      const conn = await this.manager.createConnection()
      this.inUse.add(conn)
      return conn
    }

    // Wait for one to be released, with timeout
    return new Promise<duckdb.AsyncDuckDBConnection>((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.waiters.findIndex((w) => w.resolve === resolve)
        if (idx !== -1) this.waiters.splice(idx, 1)
        reject(
          new ConnectionError(
            `Timed out waiting for connection after ${this.acquireTimeoutMs}ms`
          )
        )
      }, this.acquireTimeoutMs)

      this.waiters.push({ resolve, reject, timer })
    })
  }

  release(conn: duckdb.AsyncDuckDBConnection): void {
    this.inUse.delete(conn)

    // Hand directly to a waiter if one is waiting
    const waiter = this.waiters.shift()
    if (waiter) {
      clearTimeout(waiter.timer)
      this.inUse.add(conn)
      waiter.resolve(conn)
    } else {
      this.pool.push(conn)
    }
  }

  async drain(): Promise<void> {
    // Reject all pending waiters
    for (const waiter of this.waiters) {
      clearTimeout(waiter.timer)
      waiter.reject(new ConnectionError('Connection pool is draining'))
    }
    this.waiters = []

    for (const conn of this.pool) {
      await conn.close()
    }
    for (const conn of this.inUse) {
      await conn.close()
    }
    this.pool = []
    this.inUse.clear()
  }
}
