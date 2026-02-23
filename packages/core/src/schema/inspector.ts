import type * as duckdb from '@duckdb/duckdb-wasm'
import type { ConnectionHandle } from '../query/executor'

export interface TableSchema {
  name: string
  columns: ColumnSchema[]
}

export interface ColumnSchema {
  name: string
  type: string
  nullable: boolean
}

function quoteIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`
}

function escapeString(value: string): string {
  return value.replace(/'/g, "''")
}

export class SchemaInspector {
  private acquire: () => Promise<duckdb.AsyncDuckDBConnection>
  private release: (conn: duckdb.AsyncDuckDBConnection) => void

  constructor(handle: ConnectionHandle) {
    this.acquire = handle.acquire
    this.release = handle.release
  }

  async getTables(): Promise<string[]> {
    const conn = await this.acquire()
    try {
      const result = await conn.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'main'"
      )
      return result.toArray().map((row) => row.table_name as string)
    } finally {
      this.release(conn)
    }
  }

  async getTableSchema(tableName: string): Promise<TableSchema> {
    const conn = await this.acquire()
    try {
      const result = await conn.query(
        `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '${escapeString(tableName)}' AND table_schema = 'main'`
      )

      const columns: ColumnSchema[] = result.toArray().map((row) => ({
        name: row.column_name as string,
        type: row.data_type as string,
        nullable: row.is_nullable === 'YES',
      }))

      return { name: tableName, columns }
    } finally {
      this.release(conn)
    }
  }

  async getColumnStats(
    tableName: string,
    columnName: string
  ): Promise<Record<string, unknown>> {
    const conn = await this.acquire()
    try {
      const tbl = quoteIdentifier(tableName)
      const col = quoteIdentifier(columnName)
      const result = await conn.query(
        `SELECT COUNT(*) as count, COUNT(DISTINCT ${col}) as distinct_count, MIN(${col}) as min_val, MAX(${col}) as max_val FROM ${tbl}`
      )
      const row = result.toArray()[0]
      return {
        count: row.count,
        distinctCount: row.distinct_count,
        min: row.min_val,
        max: row.max_val,
      }
    } finally {
      this.release(conn)
    }
  }
}
