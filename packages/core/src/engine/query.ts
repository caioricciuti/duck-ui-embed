import type * as duckdb from '@duckdb/duckdb-wasm'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
}

export interface QueryResult {
  rows: Record<string, unknown>[]
  columns: ColumnInfo[]
  rowCount: number
  executionTime: number
}

export interface ConnectionHandle {
  acquire: () => Promise<duckdb.AsyncDuckDBConnection>
  release: (conn: duckdb.AsyncDuckDBConnection) => void
}

// ---------------------------------------------------------------------------
// Type coercion — handles all DuckDB Arrow types
// ---------------------------------------------------------------------------

function coerceValue(value: unknown): unknown {
  if (value === null || value === undefined) return null

  // BigInt → number
  if (typeof value === 'bigint') return Number(value)

  if (typeof value === 'object' && value !== null) {
    // Date objects (Timestamp, Date types)
    if (value instanceof Date) return value.toISOString()

    const obj = value as Record<string, unknown>

    // Arrow Int64/UInt64 struct with low/high fields
    if ('low' in obj && 'high' in obj) {
      const high = Number(obj.high ?? 0)
      const low = Number(obj.low ?? 0)
      return high * 4294967296 + (low >>> 0)
    }

    // Arrow Decimal type — stored as { unscaledValue, scale } or similar struct
    if ('unscaledValue' in obj && 'scale' in obj) {
      const unscaled = Number(obj.unscaledValue)
      const scale = Number(obj.scale)
      return unscaled / Math.pow(10, scale)
    }

    // Arrays (LIST type) — must check before valueOf/toString
    if (Array.isArray(value)) {
      return value.map(coerceValue)
    }

    // Arrow Time type — microseconds since midnight
    if ('getTime' in obj && typeof (obj as Record<string, unknown>).getTime === 'function') {
      return (obj as unknown as Date).toISOString()
    }

    // valueOf() — covers Decimal128, Timestamp, and other Arrow wrapper types
    if (typeof obj.valueOf === 'function') {
      const v = obj.valueOf()
      if (typeof v === 'number') return v
      if (typeof v === 'bigint') return Number(v)
      if (typeof v === 'string') return v
    }

    // toString() for UUID, Interval, and other opaque types
    if (typeof obj.toString === 'function' && obj.toString !== Object.prototype.toString) {
      return obj.toString()
    }

    // Struct/Map — recurse into properties
    if (Object.getPrototypeOf(value) === Object.prototype) {
      const result: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(obj)) {
        result[k] = coerceValue(v)
      }
      return result
    }
  }

  return value
}

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

export class QueryExecutor {
  private acquire: () => Promise<duckdb.AsyncDuckDBConnection>
  private release: (conn: duckdb.AsyncDuckDBConnection) => void

  constructor(handle: ConnectionHandle) {
    this.acquire = handle.acquire
    this.release = handle.release
  }

  async execute(sql: string): Promise<QueryResult> {
    const start = performance.now()
    const conn = await this.acquire()

    try {
      const result = await conn.query(sql)
      const executionTime = performance.now() - start

      const columns: ColumnInfo[] = result.schema.fields.map((field) => ({
        name: field.name,
        type: field.type.toString(),
        nullable: field.nullable,
      }))

      const rows: Record<string, unknown>[] = result.toArray().map((row) => {
        const obj: Record<string, unknown> = {}
        for (const col of columns) {
          obj[col.name] = coerceValue(row[col.name])
        }
        return obj
      })

      return {
        rows,
        columns,
        rowCount: rows.length,
        executionTime,
      }
    } finally {
      this.release(conn)
    }
  }
}
