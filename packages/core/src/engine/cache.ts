function normalizeKey(key: string): string {
  return key.replace(/\s+/g, ' ').trim()
}

export interface CacheStats {
  size: number
  maxSize: number
  ttl: number
  hits: number
  misses: number
}

export class QueryCache {
  private cache = new Map<string, { result: unknown; timestamp: number }>()
  private maxSize: number
  private ttl: number
  private _hits = 0
  private _misses = 0

  constructor(maxSize = 100, ttlMs = 5 * 60 * 1000) {
    this.maxSize = maxSize
    this.ttl = ttlMs
  }

  get<T>(key: string): T | undefined {
    const normalized = normalizeKey(key)
    const entry = this.cache.get(normalized)
    if (!entry) {
      this._misses++
      return undefined
    }

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(normalized)
      this._misses++
      return undefined
    }

    // LRU promotion: delete and re-insert to move to end
    this.cache.delete(normalized)
    this.cache.set(normalized, entry)
    this._hits++

    return entry.result as T
  }

  set(key: string, result: unknown): void {
    const normalized = normalizeKey(key)

    // If key exists, delete first so re-insert goes to end
    if (this.cache.has(normalized)) {
      this.cache.delete(normalized)
    }

    if (this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value
      if (oldest !== undefined) {
        this.cache.delete(oldest)
      }
    }

    this.cache.set(normalized, { result, timestamp: Date.now() })
  }

  invalidate(key?: string): void {
    if (key) {
      this.cache.delete(normalizeKey(key))
    } else {
      this.cache.clear()
    }
  }

  get size(): number {
    return this.cache.size
  }

  stats(): CacheStats {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
      hits: this._hits,
      misses: this._misses,
    }
  }
}
