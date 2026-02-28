import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryCache } from './cache'

describe('QueryCache', () => {
  let cache: QueryCache

  beforeEach(() => {
    cache = new QueryCache(3, 1000) // max 3 entries, 1s TTL
  })

  it('returns undefined for missing keys', () => {
    expect(cache.get('missing')).toBeUndefined()
  })

  it('stores and retrieves values', () => {
    cache.set('key1', { rows: [] })
    expect(cache.get('key1')).toEqual({ rows: [] })
  })

  it('evicts oldest entry when max size exceeded', () => {
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)
    expect(cache.size).toBe(3)

    cache.set('d', 4) // should evict 'a'
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBe(2)
    expect(cache.get('d')).toBe(4)
    expect(cache.size).toBe(3)
  })

  it('expires entries after TTL', () => {
    vi.useFakeTimers()
    cache.set('key', 'value')
    expect(cache.get('key')).toBe('value')

    vi.advanceTimersByTime(1001) // past TTL
    expect(cache.get('key')).toBeUndefined()
    vi.useRealTimers()
  })

  it('invalidate() clears a specific key', () => {
    cache.set('a', 1)
    cache.set('b', 2)
    cache.invalidate('a')
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBe(2)
  })

  it('invalidate() without key clears all', () => {
    cache.set('a', 1)
    cache.set('b', 2)
    cache.invalidate()
    expect(cache.size).toBe(0)
  })

  it('returns typed values via generics', () => {
    interface Result { rows: string[] }
    cache.set('q', { rows: ['a', 'b'] })
    const result = cache.get<Result>('q')
    expect(result?.rows).toEqual(['a', 'b'])
  })
})
