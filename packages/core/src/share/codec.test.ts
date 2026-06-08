import { describe, it, expect } from 'vitest'
import { encodeShare, decodeShare, extractShareParam, type SharePayload } from './codec'

describe('share codec', () => {
  it('round-trips a sql payload', async () => {
    const payload: SharePayload = {
      v: 1,
      type: 'sql',
      title: 'Weather',
      sql: "SELECT month, avg_high FROM read_parquet('https://x/y.parquet')",
      chartConfig: { type: 'line', xAxis: 'month', yAxis: 'avg_high' },
      autoRun: true,
    }
    const decoded = await decodeShare(await encodeShare(payload))
    expect(decoded).toEqual(payload)
  })

  it('produces a url-safe token (no +, /, =)', async () => {
    const token = await encodeShare({ v: 1, type: 'sql', title: 't', sql: 'SELECT 1' })
    expect(token).not.toMatch(/[+/=]/)
  })

  it('preserves unicode', async () => {
    const payload: SharePayload = { v: 1, type: 'sql', title: 'Café 数据', sql: "SELECT '数据'" }
    const decoded = await decodeShare(await encodeShare(payload))
    expect(decoded?.title).toBe('Café 数据')
  })

  it('returns null for garbage', async () => {
    expect(await decodeShare('not-valid')).toBeNull()
    expect(await decodeShare('')).toBeNull()
  })

  it('round-trips v2 params (interactive embed filters)', async () => {
    const payload: SharePayload = {
      v: 2,
      type: 'sql',
      title: 'Sales',
      sql: 'SELECT region, revenue FROM sales',
      params: [
        { column: 'region', type: 'select', label: 'Region' },
        { column: 'revenue', type: 'range' },
      ],
      autoRun: true,
    }
    const decoded = await decodeShare(await encodeShare(payload))
    expect(decoded?.params).toHaveLength(2)
    expect(decoded?.params?.[0]).toEqual({ column: 'region', type: 'select', label: 'Region' })
    expect(decoded?.params?.[1]).toEqual({ column: 'revenue', type: 'range' })
  })

  it('decodes a v1 payload without params (backward compatible)', async () => {
    const v1: SharePayload = { v: 1, type: 'sql', title: 'old', sql: 'SELECT 1' }
    const decoded = await decodeShare(await encodeShare(v1))
    expect(decoded?.v).toBe(1)
    expect(decoded?.params).toBeUndefined()
  })

  it('extracts the share param from urls and bare tokens', () => {
    expect(extractShareParam('ABC123')).toBe('ABC123')
    expect(extractShareParam('https://demo.duckui.com/embed#s=ABC123')).toBe('ABC123')
    expect(extractShareParam('https://duckui.com/a/?s=XYZ789')).toBe('XYZ789')
    expect(extractShareParam('https://duckui.com/no-param')).toBeNull()
  })
})
