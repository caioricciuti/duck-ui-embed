import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock DuckDB types for testing
interface MockConnection {
  query: ReturnType<typeof vi.fn>
}

interface MockDB {
  registerFileBuffer: ReturnType<typeof vi.fn>
  registerFileURL: ReturnType<typeof vi.fn>
}

// We test the helper functions and loadData flow by mocking DuckDB

describe('data-loader', () => {
  let mockDb: MockDB
  let mockConn: MockConnection

  beforeEach(() => {
    mockDb = {
      registerFileBuffer: vi.fn(),
      registerFileURL: vi.fn(),
    }
    mockConn = {
      query: vi.fn(),
    }
  })

  describe('loadData', () => {
    it('loads array data as JSON buffer', async () => {
      const { loadData } = await import('./data-loader')
      const data = [
        { id: 1, name: 'Widget' },
        { id: 2, name: 'Gadget' },
      ]

      await loadData(
        mockDb as unknown as import('@duckdb/duckdb-wasm').AsyncDuckDB,
        mockConn as unknown as import('@duckdb/duckdb-wasm').AsyncDuckDBConnection,
        { products: data }
      )

      expect(mockDb.registerFileBuffer).toHaveBeenCalledTimes(1)
      const [fileName, buffer] = mockDb.registerFileBuffer.mock.calls[0]
      expect(fileName).toContain('products')
      expect(fileName).toMatch(/\.json$/)
      // Verify the buffer contains the JSON data
      const decoded = new TextDecoder().decode(buffer)
      expect(JSON.parse(decoded)).toEqual(data)

      expect(mockConn.query).toHaveBeenCalledTimes(1)
      const sql = mockConn.query.mock.calls[0][0] as string
      expect(sql).toContain('CREATE OR REPLACE TABLE "products"')
      expect(sql).toContain('read_json_auto')
    })

    it('handles empty array by creating empty table', async () => {
      const { loadData } = await import('./data-loader')

      await loadData(
        mockDb as unknown as import('@duckdb/duckdb-wasm').AsyncDuckDB,
        mockConn as unknown as import('@duckdb/duckdb-wasm').AsyncDuckDBConnection,
        { empty: [] }
      )

      // Should create table + delete, no file buffer registration
      expect(mockDb.registerFileBuffer).not.toHaveBeenCalled()
      expect(mockConn.query).toHaveBeenCalledTimes(2)
      const createSql = mockConn.query.mock.calls[0][0] as string
      expect(createSql).toContain('CREATE OR REPLACE TABLE "empty"')
      const deleteSql = mockConn.query.mock.calls[1][0] as string
      expect(deleteSql).toContain('DELETE FROM "empty"')
    })

    it('calls fetch callback and loads result', async () => {
      const { loadData } = await import('./data-loader')
      const fetchFn = vi.fn().mockResolvedValue([{ id: 1 }])

      await loadData(
        mockDb as unknown as import('@duckdb/duckdb-wasm').AsyncDuckDB,
        mockConn as unknown as import('@duckdb/duckdb-wasm').AsyncDuckDBConnection,
        { fetched: { fetch: fetchFn } }
      )

      expect(fetchFn).toHaveBeenCalledTimes(1)
      expect(mockDb.registerFileBuffer).toHaveBeenCalledTimes(1)
    })

    it('throws DataLoadError on failure', async () => {
      const { loadData } = await import('./data-loader')
      mockConn.query.mockRejectedValueOnce(new Error('SQL error'))

      await expect(
        loadData(
          mockDb as unknown as import('@duckdb/duckdb-wasm').AsyncDuckDB,
          mockConn as unknown as import('@duckdb/duckdb-wasm').AsyncDuckDBConnection,
          { bad: [{ id: 1 }] }
        )
      ).rejects.toThrow('Failed to load data for table "bad"')
    })

    it('escapes table names with double quotes', async () => {
      const { loadData } = await import('./data-loader')

      await loadData(
        mockDb as unknown as import('@duckdb/duckdb-wasm').AsyncDuckDB,
        mockConn as unknown as import('@duckdb/duckdb-wasm').AsyncDuckDBConnection,
        { 'my"table': [{ id: 1 }] }
      )

      const sql = mockConn.query.mock.calls[0][0] as string
      expect(sql).toContain('"my""table"')
    })

    it('uses unique file names to avoid collisions', async () => {
      const { loadData } = await import('./data-loader')

      await loadData(
        mockDb as unknown as import('@duckdb/duckdb-wasm').AsyncDuckDB,
        mockConn as unknown as import('@duckdb/duckdb-wasm').AsyncDuckDBConnection,
        {
          table1: [{ id: 1 }],
          table2: [{ id: 2 }],
        }
      )

      const name1 = mockDb.registerFileBuffer.mock.calls[0][0]
      const name2 = mockDb.registerFileBuffer.mock.calls[1][0]
      expect(name1).not.toBe(name2)
    })
  })

  describe('dropTables', () => {
    it('drops specified tables', async () => {
      const { dropTables } = await import('./data-loader')

      await dropTables(
        mockConn as unknown as import('@duckdb/duckdb-wasm').AsyncDuckDBConnection,
        ['orders', 'products']
      )

      expect(mockConn.query).toHaveBeenCalledTimes(2)
      expect(mockConn.query.mock.calls[0][0]).toContain('DROP TABLE IF EXISTS "orders"')
      expect(mockConn.query.mock.calls[1][0]).toContain('DROP TABLE IF EXISTS "products"')
    })
  })
})
