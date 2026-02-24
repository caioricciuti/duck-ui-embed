import type * as duckdb from '@duckdb/duckdb-wasm'
import type { FileSourceConfig, FileFormat, CsvOptions } from './types'

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
    const sql = FileSource.buildCreateSQL(
      tableName,
      fileName,
      config.format,
      config.maxRows,
      config.csvOptions,
    )
    await conn.query(sql)
  }

  static buildCreateSQL(
    tableName: string,
    fileName: string,
    format: FileFormat,
    maxRows?: number,
    csvOptions?: CsvOptions,
  ): string {
    const limit = maxRows != null ? ` LIMIT ${maxRows}` : ''
    const reader = FileSource.getReader(fileName, format, csvOptions)
    return `CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM ${reader}${limit}`
  }

  private static getReader(
    fileName: string,
    format: FileFormat,
    csvOptions?: CsvOptions,
  ): string {
    switch (format) {
      case 'parquet':
        return `read_parquet('${fileName}')`
      case 'csv': {
        if (csvOptions && (csvOptions.delimiter || csvOptions.header !== undefined || csvOptions.quote)) {
          const opts: string[] = []
          if (csvOptions.delimiter) opts.push(`delim='${csvOptions.delimiter}'`)
          if (csvOptions.header !== undefined) opts.push(`header=${csvOptions.header}`)
          if (csvOptions.quote) opts.push(`quote='${csvOptions.quote}'`)
          return `read_csv('${fileName}', ${opts.join(', ')})`
        }
        return `read_csv_auto('${fileName}')`
      }
      case 'json':
        return `read_json_auto('${fileName}')`
      case 'arrow':
        return `read_arrow('${fileName}')`
    }
  }
}
