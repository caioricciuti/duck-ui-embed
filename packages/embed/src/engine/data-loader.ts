import type * as duckdb from '@duckdb/duckdb-wasm'
import { DataLoadError } from './errors'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** A single data input — the value side of the `data` prop. */
export type DataInput =
  | Record<string, unknown>[] // array of objects → table
  | { url: string; format?: 'csv' | 'json' | 'parquet' } // remote file
  | { fetch: () => Promise<Record<string, unknown>[]> } // async callback
  | File // browser File object

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FETCH_TIMEOUT_MS = 30_000

// ---------------------------------------------------------------------------
// Format detection
// ---------------------------------------------------------------------------

const EXT_MAP: Record<string, string> = {
  parquet: 'parquet',
  csv: 'csv',
  tsv: 'csv',
  json: 'json',
  jsonl: 'json',
  ndjson: 'json',
  arrow: 'arrow',
  ipc: 'arrow',
}

function detectFormat(name: string): string | null {
  const ext = name.split('.').pop()?.toLowerCase()
  return ext ? EXT_MAP[ext] ?? null : null
}

/** Escape a file name for use in SQL string literals (single quotes). */
function escapeFileName(name: string): string {
  return name.replace(/\\/g, '\\\\').replace(/'/g, "''")
}

function reader(fileName: string, format: string): string {
  const escaped = escapeFileName(fileName)
  switch (format) {
    case 'parquet':
      return `read_parquet('${escaped}')`
    case 'json':
      return `read_json_auto('${escaped}')`
    case 'arrow':
      return `read_arrow('${escaped}')`
    case 'csv':
    default:
      return `read_csv_auto('${escaped}')`
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isUrlInput(input: DataInput): input is { url: string; format?: 'csv' | 'json' | 'parquet' } {
  return typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof File) && 'url' in input
}

function isFetchInput(input: DataInput): input is { fetch: () => Promise<Record<string, unknown>[]> } {
  return typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof File) && 'fetch' in input
}

function escapeTableName(name: string): string {
  return name.replace(/"/g, '""')
}

let fileCounter = 0
function uniqueFileName(base: string, ext: string): string {
  return `_duck_${base}_${++fileCounter}_${Date.now()}.${ext}`
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const resp = await fetch(url, { signal: controller.signal })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`)
    return resp
  } finally {
    clearTimeout(timer)
  }
}

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

export async function loadData(
  db: duckdb.AsyncDuckDB,
  conn: duckdb.AsyncDuckDBConnection,
  tables: Record<string, DataInput>
): Promise<void> {
  for (const [name, input] of Object.entries(tables)) {
    try {
      if (Array.isArray(input)) {
        await loadArray(db, conn, name, input)
      } else if (input instanceof File) {
        await loadFile(db, conn, name, input)
      } else if (isUrlInput(input)) {
        await loadUrl(db, conn, name, input)
      } else if (isFetchInput(input)) {
        const data = await input.fetch()
        await loadArray(db, conn, name, data)
      }
    } catch (err) {
      throw new DataLoadError(name, err instanceof Error ? err.message : String(err))
    }
  }
}

export async function dropTables(
  conn: duckdb.AsyncDuckDBConnection,
  tableNames: string[]
): Promise<void> {
  for (const name of tableNames) {
    await conn.query(`DROP TABLE IF EXISTS "${escapeTableName(name)}"`)
  }
}

async function loadArray(
  db: duckdb.AsyncDuckDB,
  conn: duckdb.AsyncDuckDBConnection,
  name: string,
  data: Record<string, unknown>[]
): Promise<void> {
  if (data.length === 0) {
    // Create a truly empty table — single column so the table is valid
    await conn.query(`CREATE OR REPLACE TABLE "${escapeTableName(name)}" (_empty BOOLEAN)`)
    // Immediately delete the sentinel row so the table is empty
    await conn.query(`DELETE FROM "${escapeTableName(name)}"`)
    return
  }

  const json = JSON.stringify(data)
  const buffer = new TextEncoder().encode(json)
  const fileName = uniqueFileName(name, 'json')
  await db.registerFileBuffer(fileName, buffer)
  await conn.query(
    `CREATE OR REPLACE TABLE "${escapeTableName(name)}" AS SELECT * FROM ${reader(fileName, 'json')}`
  )
}

async function loadFile(
  db: duckdb.AsyncDuckDB,
  conn: duckdb.AsyncDuckDBConnection,
  name: string,
  file: File
): Promise<void> {
  const format = detectFormat(file.name) ?? 'csv'
  const buffer = new Uint8Array(await file.arrayBuffer())
  const fileName = uniqueFileName(name, format)
  await db.registerFileBuffer(fileName, buffer)
  await conn.query(
    `CREATE OR REPLACE TABLE "${escapeTableName(name)}" AS SELECT * FROM ${reader(fileName, format)}`
  )
}

async function loadUrl(
  db: duckdb.AsyncDuckDB,
  conn: duckdb.AsyncDuckDBConnection,
  name: string,
  input: { url: string; format?: 'csv' | 'json' | 'parquet' }
): Promise<void> {
  const format = input.format ?? detectFormat(input.url) ?? 'csv'
  const fileName = uniqueFileName(name, format)

  if (format === 'parquet') {
    // HTTP range requests — DuckDB only fetches needed row groups
    const duckdb = await import('@duckdb/duckdb-wasm')
    await db.registerFileURL(fileName, input.url, duckdb.DuckDBDataProtocol.HTTP, false)
  } else {
    const resp = await fetchWithTimeout(input.url, FETCH_TIMEOUT_MS)
    const buffer = new Uint8Array(await resp.arrayBuffer())
    await db.registerFileBuffer(fileName, buffer)
  }

  await conn.query(
    `CREATE OR REPLACE TABLE "${escapeTableName(name)}" AS SELECT * FROM ${reader(fileName, format)}`
  )
}
