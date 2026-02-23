import type * as duckdb from '@duckdb/duckdb-wasm'
import type { FileSourceConfig, FileFormat } from './types'

export class FileSource {
  static async load(
    db: duckdb.AsyncDuckDB,
    conn: duckdb.AsyncDuckDBConnection,
    config: FileSourceConfig
  ): Promise<void> {
    const tableName = config.tableName ?? config.name
    const fileName = `${config.name}.${config.format}`

    // Register the file with DuckDB
    if (config.data instanceof File) {
      const buffer = await config.data.arrayBuffer()
      await db.registerFileBuffer(fileName, new Uint8Array(buffer))
    } else if (config.data instanceof ArrayBuffer) {
      await db.registerFileBuffer(fileName, new Uint8Array(config.data))
    } else {
      await db.registerFileBuffer(fileName, config.data)
    }

    // Create table from registered file
    const sql = FileSource.buildCreateSQL(tableName, fileName, config.format)
    await conn.query(sql)
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
