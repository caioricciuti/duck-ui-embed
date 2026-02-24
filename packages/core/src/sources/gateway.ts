import type * as duckdb from '@duckdb/duckdb-wasm'
import type { BaseGatewayConfig, FileFormat } from './types'
import { FileSource } from './file'

export class GatewaySource {
  static async load(
    db: duckdb.AsyncDuckDB,
    conn: duckdb.AsyncDuckDBConnection,
    config: BaseGatewayConfig
  ): Promise<void> {
    const tableName = config.tableName ?? config.name
    const method = config.method ?? 'POST'

    const headers: Record<string, string> = {
      'Accept': 'application/json, text/csv, application/octet-stream',
      ...config.headers,
    }

    const fetchOptions: RequestInit = { method, headers }

    if (method === 'POST') {
      headers['Content-Type'] = headers['Content-Type'] ?? 'application/json'
      fetchOptions.body = JSON.stringify({ query: config.query })
    }

    const response = await fetch(config.endpoint, fetchOptions)
    if (!response.ok) {
      throw new Error(
        `Gateway request failed: ${response.status} ${response.statusText}`
      )
    }

    // Detect format from config or response Content-Type
    const format =
      config.format ??
      GatewaySource.detectFormatFromContentType(
        response.headers.get('content-type'),
      ) ??
      'json'

    const buffer = new Uint8Array(await response.arrayBuffer())
    const fileName = `${config.name}.${format}`

    await db.registerFileBuffer(fileName, buffer)

    const sql = FileSource.buildCreateSQL(
      tableName,
      fileName,
      format,
      config.maxRows,
    )
    await conn.query(sql)
  }

  private static detectFormatFromContentType(
    contentType: string | null,
  ): FileFormat | null {
    if (!contentType) return null
    const ct = contentType.toLowerCase()
    if (ct.includes('text/csv') || ct.includes('text/tab-separated')) return 'csv'
    if (ct.includes('application/json')) return 'json'
    if (ct.includes('parquet') || ct.includes('application/vnd.apache.parquet'))
      return 'parquet'
    if (ct.includes('arrow') || ct.includes('application/vnd.apache.arrow'))
      return 'arrow'
    return null
  }
}
