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

  // New tests for LRU, key normalization, stats

  it('promotes accessed entries (LRU behavior)', () => {
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)

    // Access 'a' to promote it
    cache.get('a')

    // Insert new entry — should evict 'b' (oldest not-recently-used), not 'a'
    cache.set('d', 4)
    expect(cache.get('a')).toBe(1)
    expect(cache.get('b')).toBeUndefined()
    expect(cache.get('c')).toBe(3)
    expect(cache.get('d')).toBe(4)
  })

  it('normalizes keys (whitespace collapse)', () => {
    cache.set('SELECT  *  FROM  x', 'result1')
    expect(cache.get('SELECT * FROM x')).toBe('result1')
  })

  it('normalizes keys (trim)', () => {
    cache.set('  SELECT * FROM x  ', 'result1')
    expect(cache.get('SELECT * FROM x')).toBe('result1')
  })

  it('invalidate normalizes the key too', () => {
    cache.set('SELECT * FROM x', 'val')
    cache.invalidate('  SELECT  *  FROM  x  ')
    expect(cache.get('SELECT * FROM x')).toBeUndefined()
  })

  it('stats() returns hit/miss counts', () => {
    cache.set('a', 1)
    cache.get('a') // hit
    cache.get('b') // miss

    const s = cache.stats()
    expect(s.hits).toBe(1)
    expect(s.misses).toBe(1)
    expect(s.size).toBe(1)
    expect(s.maxSize).toBe(3)
    expect(s.ttl).toBe(1000)
  })
})
