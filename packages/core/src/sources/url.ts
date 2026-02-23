import type * as duckdb from '@duckdb/duckdb-wasm'
import type { URLSourceConfig, FileFormat } from './types'

export class URLSource {
  static async load(
    db: duckdb.AsyncDuckDB,
    conn: duckdb.AsyncDuckDBConnection,
    config: URLSourceConfig
  ): Promise<void> {
    const tableName = config.tableName ?? config.name
    const format = config.format ?? URLSource.detectFormat(config.url)

    // Fetch the file
    const response = await fetch(config.url)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${config.url}: ${response.statusText}`)
    }

    const buffer = new Uint8Array(await response.arrayBuffer())
    const fileName = `${config.name}.${format}`

    await db.registerFileBuffer(fileName, buffer)

    // Create table using appropriate reader
    const sql = URLSource.buildCreateSQL(tableName, fileName, format)
    await conn.query(sql)
  }

  private static detectFormat(url: string): FileFormat {
    const ext = url.split('.').pop()?.toLowerCase().split('?')[0]
    switch (ext) {
      case 'parquet':
        return 'parquet'
      case 'csv':
      case 'tsv':
        return 'csv'
      case 'json':
      case 'jsonl':
      case 'ndjson':
        return 'json'
      case 'arrow':
      case 'ipc':
        return 'arrow'
      default:
        return 'csv' // default fallback
    }
  }

  private static buildCreateSQL(
    tableName: string,
    fileName: string,
    format: FileFormat
  ): string {
    switch (format) {
      case 'parquet':
        return `CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM read_parquet('${fileName}')`
      case 'csv':
        return `CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM read_csv_auto('${fileName}')`
      case 'json':
        return `CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM read_json_auto('${fileName}')`
      case 'arrow':
        return `CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM read_arrow('${fileName}')`
    }
  }
}
