import { describe, it, expect, vi } from 'vitest'
import { QueryCache } from '../cache'

describe('QueryCache', () => {
  it('stores and retrieves values', () => {
    const cache = new QueryCache()
    cache.set('q1', { rows: [] })
    expect(cache.get('q1')).toEqual({ rows: [] })
  })

  it('returns undefined for missing keys', () => {
    const cache = new QueryCache()
    expect(cache.get('nope')).toBeUndefined()
  })

  it('evicts oldest entry when at capacity', () => {
    const cache = new QueryCache(2)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBe(2)
    expect(cache.get('c')).toBe(3)
  })

  it('expires entries after TTL', () => {
    vi.useFakeTimers()
    const cache = new QueryCache(100, 1000)
    cache.set('x', 'val')
    expect(cache.get('x')).toBe('val')
    vi.advanceTimersByTime(1001)
    expect(cache.get('x')).toBeUndefined()
    vi.useRealTimers()
  })

  it('invalidate clears specific or all entries', () => {
    const cache = new QueryCache()
    cache.set('a', 1)
    cache.set('b', 2)
    cache.invalidate('a')
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBe(2)
    cache.invalidate()
    expect(cache.size).toBe(0)
  })
})
