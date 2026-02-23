export class QueryCache {
  private cache = new Map<string, { result: unknown; timestamp: number }>()
  private maxSize: number
  private ttl: number

  constructor(maxSize = 100, ttlMs = 5 * 60 * 1000) {
    this.maxSize = maxSize
    this.ttl = ttlMs
  }

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return undefined
    }

    return entry.result as T
  }

  set(key: string, result: unknown): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value
      if (oldest !== undefined) {
        this.cache.delete(oldest)
      }
    }

    this.cache.set(key, { result, timestamp: Date.now() })
  }

  invalidate(key?: string): void {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  get size(): number {
    return this.cache.size
  }
}
