export type FileFormat = 'parquet' | 'csv' | 'json' | 'arrow'

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
}

export interface URLSourceConfig {
  type: 'url'
  /** Name to register this source as */
  name: string
  /** URL to fetch the file from */
  url: string
  /** File format (auto-detected from URL extension if not provided) */
  format?: FileFormat
  /** Table name override */
  tableName?: string
}

export interface S3SourceConfig {
  type: 's3'
  name: string
  bucket: string
  key: string
  region: string
  format?: FileFormat
  tableName?: string
}

export interface DatabaseSourceConfig {
  type: 'database'
  name: string
  connectionString: string
  query: string
  tableName?: string
}

export type SourceConfig =
  | FileSourceConfig
  | URLSourceConfig
  | S3SourceConfig
  | DatabaseSourceConfig
