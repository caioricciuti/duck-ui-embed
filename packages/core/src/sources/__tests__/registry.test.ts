import { describe, it, expect } from 'vitest'
import { DataSourceRegistry } from '../registry'
import type { FileSourceConfig } from '../types'

const testSource: FileSourceConfig = {
  type: 'file',
  name: 'test',
  data: new ArrayBuffer(0),
  format: 'csv',
}

describe('DataSourceRegistry', () => {
  it('registers and retrieves sources', () => {
    const reg = new DataSourceRegistry()
    reg.register(testSource)
    expect(reg.get('test')).toBe(testSource)
    expect(reg.has('test')).toBe(true)
  })

  it('lists all sources', () => {
    const reg = new DataSourceRegistry()
    reg.register(testSource)
    expect(reg.list()).toHaveLength(1)
  })

  it('removes sources', () => {
    const reg = new DataSourceRegistry()
    reg.register(testSource)
    expect(reg.remove('test')).toBe(true)
    expect(reg.has('test')).toBe(false)
  })

  it('returns false when removing non-existent source', () => {
    const reg = new DataSourceRegistry()
    expect(reg.remove('nope')).toBe(false)
  })

  it('clears all sources', () => {
    const reg = new DataSourceRegistry()
    reg.register(testSource)
    reg.clear()
    expect(reg.list()).toHaveLength(0)
  })
})
