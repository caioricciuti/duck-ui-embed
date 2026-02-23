import { describe, it, expect, vi } from 'vitest'
import { ConnectionPool } from '../connection-pool'
import type { DuckDBManager } from '../manager'

function mockManager(): DuckDBManager {
  let id = 0
  return {
    createConnection: vi.fn(async () => ({ _id: ++id, close: vi.fn() })),
    initialize: vi.fn(),
    terminate: vi.fn(),
    getDatabase: vi.fn(),
    isInitialized: vi.fn(() => true),
  } as unknown as DuckDBManager
}

describe('ConnectionPool', () => {
  it('creates a new connection when pool is empty', async () => {
    const mgr = mockManager()
    const pool = new ConnectionPool(mgr, { maxSize: 2 })
    const conn = await pool.acquire()
    expect(conn).toBeDefined()
    expect(mgr.createConnection).toHaveBeenCalledOnce()
  })

  it('reuses released connections', async () => {
    const mgr = mockManager()
    const pool = new ConnectionPool(mgr, { maxSize: 2 })
    const conn1 = await pool.acquire()
    pool.release(conn1)
    const conn2 = await pool.acquire()
    expect(conn2).toBe(conn1)
    expect(mgr.createConnection).toHaveBeenCalledOnce()
  })

  it('queues waiters when pool is full and resolves on release', async () => {
    const mgr = mockManager()
    const pool = new ConnectionPool(mgr, { maxSize: 1 })
    const conn1 = await pool.acquire()
    const promise = pool.acquire()
    setTimeout(() => pool.release(conn1), 10)
    const conn2 = await promise
    expect(conn2).toBe(conn1)
  })

  it('times out if no connection is released', async () => {
    const mgr = mockManager()
    const pool = new ConnectionPool(mgr, { maxSize: 1, acquireTimeoutMs: 50 })
    await pool.acquire()
    await expect(pool.acquire()).rejects.toThrow('Timed out')
  })

  it('drain closes all connections and rejects waiters', async () => {
    const mgr = mockManager()
    const pool = new ConnectionPool(mgr, { maxSize: 1, acquireTimeoutMs: 5000 })
    await pool.acquire()
    const waitPromise = pool.acquire()
    await pool.drain()
    await expect(waitPromise).rejects.toThrow('draining')
  })
})
