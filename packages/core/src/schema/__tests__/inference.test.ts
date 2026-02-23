import { describe, it, expect } from 'vitest'
import { SchemaInference } from '../inference'

describe('SchemaInference', () => {
  describe('detectFormat', () => {
    it('detects parquet format', () => {
      expect(SchemaInference.detectFormat('data.parquet')).toBe('parquet')
    })

    it('detects csv format', () => {
      expect(SchemaInference.detectFormat('data.csv')).toBe('csv')
      expect(SchemaInference.detectFormat('data.tsv')).toBe('csv')
    })

    it('detects json format', () => {
      expect(SchemaInference.detectFormat('data.json')).toBe('json')
      expect(SchemaInference.detectFormat('data.ndjson')).toBe('json')
      expect(SchemaInference.detectFormat('data.jsonl')).toBe('json')
    })

    it('detects arrow format', () => {
      expect(SchemaInference.detectFormat('data.arrow')).toBe('arrow')
      expect(SchemaInference.detectFormat('data.ipc')).toBe('arrow')
    })

    it('falls back to mime type', () => {
      expect(SchemaInference.detectFormat('data.bin', 'application/parquet')).toBe('parquet')
      expect(SchemaInference.detectFormat('data.bin', 'text/csv')).toBe('csv')
      expect(SchemaInference.detectFormat('data.bin', 'application/json')).toBe('json')
    })

    it('returns null for unknown format', () => {
      expect(SchemaInference.detectFormat('data.xyz')).toBeNull()
    })
  })

  describe('suggestTableName', () => {
    it('removes extension and sanitizes', () => {
      expect(SchemaInference.suggestTableName('my-data.csv')).toBe('my_data')
      expect(SchemaInference.suggestTableName('Sales Report.parquet')).toBe('sales_report')
    })

    it('handles already clean names', () => {
      expect(SchemaInference.suggestTableName('orders.json')).toBe('orders')
    })
  })
})
