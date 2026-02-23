import type { FileFormat } from '../sources/types'

export class SchemaInference {
  /**
   * Detect file format from file name or MIME type
   */
  static detectFormat(fileName: string, mimeType?: string): FileFormat | null {
    const ext = fileName.split('.').pop()?.toLowerCase()

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
    }

    if (mimeType) {
      if (mimeType.includes('parquet')) return 'parquet'
      if (mimeType.includes('csv') || mimeType.includes('tab-separated')) return 'csv'
      if (mimeType.includes('json')) return 'json'
      if (mimeType.includes('arrow')) return 'arrow'
    }

    return null
  }

  /**
   * Suggest a table name from a file name
   */
  static suggestTableName(fileName: string): string {
    return fileName
      .replace(/\.[^.]+$/, '') // remove extension
      .replace(/[^a-zA-Z0-9_]/g, '_') // replace non-alphanumeric
      .replace(/^_+|_+$/g, '') // trim underscores
      .toLowerCase()
  }
}
