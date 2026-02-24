import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConnectionPool } from './pool'
import type { DuckDBManager } from './init'

function createMockManager() {
  let connectionId = 0
  return {
    createConnection: vi.fn(() => Promise.resolve({ id: ++connectionId, close: vi.fn() })),
    getDatabase: vi.fn(),
  } as unknown as DuckDBManager
}

describe('ConnectionPool', () => {
  let manager: DuckDBManager
  let pool: ConnectionPool

  beforeEach(() => {
    manager = createMockManager()
    pool = new ConnectionPool(manager, { maxSize: 2, acquireTimeoutMs: 100 })
  })

  it('creates a new connection when pool is empty', async () => {
    const conn = await pool.acquire()
    expect(conn).toBeTruthy()
    expect(manager.createConnection).toHaveBeenCalledTimes(1)
  })

  it('reuses released connections', async () => {
    const conn1 = await pool.acquire()
    pool.release(conn1)

    const conn2 = await pool.acquire()
    expect(conn2).toBe(conn1)
    expect(manager.createConnection).toHaveBeenCalledTimes(1)
  })

  it('creates multiple connections up to max size', async () => {
    const conn1 = await pool.acquire()
    const conn2 = await pool.acquire()
    expect(conn1).not.toBe(conn2)
    expect(manager.createConnection).toHaveBeenCalledTimes(2)
  })

  it('resolves waiters when connection is released', async () => {
    const conn1 = await pool.acquire()
    const conn2 = await pool.acquire()

    // Pool is full, third acquire will wait
    let resolvedConn: unknown = null
    const waitPromise = pool.acquire().then((c) => {
      resolvedConn = c
      return c
    })

    // Not resolved yet
    await new Promise((r) => setTimeout(r, 10))
    expect(resolvedConn).toBeNull()

    // Release a connection — waiter should get it
    pool.release(conn1)
    const result = await waitPromise
    expect(result).toBe(conn1)

    // Clean up
    pool.release(conn2)
    pool.release(result)
  })

  it('times out waiters', async () => {
    await pool.acquire()
    await pool.acquire()

    await expect(pool.acquire()).rejects.toThrow('Timed out')
  })

  it('drain closes all connections and rejects waiters', async () => {
    const conn1 = await pool.acquire()
    pool.release(conn1)

    await pool.drain()

    expect((conn1 as unknown as { close: ReturnType<typeof vi.fn> }).close).toHaveBeenCalled()
  })

  it('prevents race condition with pending counter', async () => {
    const pool2 = new ConnectionPool(manager, { maxSize: 2 })

    const [c1, c2] = await Promise.all([
      pool2.acquire(),
      pool2.acquire(),
    ])

    expect(c1).toBeTruthy()
    expect(c2).toBeTruthy()
    expect(manager.createConnection).toHaveBeenCalledTimes(2)

    pool2.release(c1)
    pool2.release(c2)
  })
})
