export type FileFormat = 'parquet' | 'csv' | 'json' | 'arrow'

export interface CsvOptions {
  /** Column delimiter (default: auto-detect) */
  delimiter?: string
  /** Whether the file has a header row (default: true) */
  header?: boolean
  /** Quote character (default: '"') */
  quote?: string
}

export interface FileSourceConfig {
  type: 'file'
  /** Name to register this source as (becomes the table name) */
  name: string
  /** File data as ArrayBuffer, Uint8Array, or File */
  data: ArrayBuffer | Uint8Array | File
  /** File format */
  format: FileFormat
  /** Table name override (defaults to name) */
  tableName?: string
  /** Maximum rows to load (applies LIMIT during table creation) */
  maxRows?: number
  /** CSV-specific options (only used when format is 'csv') */
  csvOptions?: CsvOptions
}

export interface URLSourceConfig {
  type: 'url'
  /** Name to register this source as */
  name: string
  /** URL to fetch the file from */
  url: string
  /** File format (auto-detected from URL extension or Content-Type if not provided) */
  format?: FileFormat
  /** Table name override */
  tableName?: string
  /** Maximum rows to load (applies LIMIT during table creation) */
  maxRows?: number
  /** CSV-specific options (only used when format is 'csv') */
  csvOptions?: CsvOptions
}

/** Base interface for all gateway-like source configs */
export interface BaseGatewayConfig {
  name: string
  /** URL of the data gateway API endpoint */
  endpoint: string
  /** Query or command to send to the gateway */
  query?: string
  /** Expected response format (default: 'json') */
  format?: FileFormat
  /** Custom HTTP headers (e.g. Authorization) */
  headers?: Record<string, string>
  /** HTTP method (default: 'POST') */
  method?: 'GET' | 'POST'
  /** Table name override */
  tableName?: string
  /** Maximum rows to load */
  maxRows?: number
}

export interface GatewaySourceConfig extends BaseGatewayConfig {
  type: 'gateway'
}

export interface PostgresSourceConfig extends BaseGatewayConfig {
  type: 'postgres'
}

export interface MySQLSourceConfig extends BaseGatewayConfig {
  type: 'mysql'
}

export interface ClickHouseSourceConfig extends BaseGatewayConfig {
  type: 'clickhouse'
}

export interface BigQuerySourceConfig extends BaseGatewayConfig {
  type: 'bigquery'
}

export type SourceConfig =
  | FileSourceConfig
  | URLSourceConfig
  | GatewaySourceConfig
  | PostgresSourceConfig
  | MySQLSourceConfig
  | ClickHouseSourceConfig
  | BigQuerySourceConfig
