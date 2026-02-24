import type * as duckdb from '@duckdb/duckdb-wasm'
import type { SourceConfig } from './types'
import { FileSource } from './file'
import { URLSource } from './url'
import { GatewaySource } from './gateway'
import { SourceLoadError } from '../errors'

export class SourceLoader {
  static async load(
    db: duckdb.AsyncDuckDB,
    conn: duckdb.AsyncDuckDBConnection,
    source: SourceConfig
  ): Promise<void> {
    try {
      switch (source.type) {
        case 'file':
          await FileSource.load(db, conn, source)
          break
        case 'url':
          await URLSource.load(db, conn, source)
          break
        case 'gateway':
        case 'postgres':
        case 'mysql':
        case 'clickhouse':
        case 'bigquery':
          await GatewaySource.load(db, conn, source)
          break
        default:
          throw new Error(`Unknown source type: ${(source as SourceConfig).type}`)
      }
    } catch (err) {
      if (err instanceof SourceLoadError) throw err
      throw new SourceLoadError(
        source.name,
        err instanceof Error ? err.message : String(err)
      )
    }
  }
}
