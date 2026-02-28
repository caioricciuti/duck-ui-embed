import { describe, it, expect } from 'vitest'

describe('type coercion', () => {
  // Mirror the coerceValue logic from query.ts for unit testing
  function coerceValue(value: unknown): unknown {
    if (value === null || value === undefined) return null
    if (typeof value === 'bigint') return Number(value)

    if (typeof value === 'object' && value !== null) {
      if (value instanceof Date) return value.toISOString()

      const obj = value as Record<string, unknown>

      if ('low' in obj && 'high' in obj) {
        const high = Number(obj.high ?? 0)
        const low = Number(obj.low ?? 0)
        return high * 4294967296 + (low >>> 0)
      }

      if ('unscaledValue' in obj && 'scale' in obj) {
        const unscaled = Number(obj.unscaledValue)
        const scale = Number(obj.scale)
        return unscaled / Math.pow(10, scale)
      }

      // Arrays before valueOf — arrays have valueOf too
      if (Array.isArray(value)) {
        return value.map(coerceValue)
      }

      if (typeof obj.valueOf === 'function') {
        const v = obj.valueOf()
        if (typeof v === 'number') return v
        if (typeof v === 'bigint') return Number(v)
        if (typeof v === 'string') return v
      }

      if (typeof obj.toString === 'function' && obj.toString !== Object.prototype.toString) {
        return obj.toString()
      }

      if (Object.getPrototypeOf(value) === Object.prototype) {
        const result: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(obj)) {
          result[k] = coerceValue(v)
        }
        return result
      }
    }

    return value
  }

  it('returns null for null', () => {
    expect(coerceValue(null)).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(coerceValue(undefined)).toBeNull()
  })

  it('converts BigInt to number', () => {
    expect(coerceValue(BigInt(42))).toBe(42)
    expect(coerceValue(BigInt(0))).toBe(0)
    expect(coerceValue(BigInt(-10))).toBe(-10)
  })

  it('converts Date to ISO string', () => {
    const d = new Date('2024-01-15T10:30:00.000Z')
    expect(coerceValue(d)).toBe('2024-01-15T10:30:00.000Z')
  })

  it('converts Arrow Int64 struct (low/high) to number', () => {
    expect(coerceValue({ low: 0, high: 1 })).toBe(4294967296)
    expect(coerceValue({ low: 100, high: 0 })).toBe(100)
    expect(coerceValue({ low: 5, high: 2 })).toBe(2 * 4294967296 + 5)
  })

  it('converts Decimal struct (unscaledValue/scale) to number', () => {
    expect(coerceValue({ unscaledValue: 12345, scale: 2 })).toBe(123.45)
    expect(coerceValue({ unscaledValue: 100, scale: 0 })).toBe(100)
    expect(coerceValue({ unscaledValue: 5, scale: 3 })).toBe(0.005)
  })

  it('uses valueOf() for wrapper types', () => {
    const numWrapper = { valueOf: () => 99.5 }
    expect(coerceValue(numWrapper)).toBe(99.5)

    const strWrapper = { valueOf: () => 'hello' }
    expect(coerceValue(strWrapper)).toBe('hello')

    const bigintWrapper = { valueOf: () => BigInt(7) }
    expect(coerceValue(bigintWrapper)).toBe(7)
  })

  it('uses custom toString() for opaque types like UUID', () => {
    class UUID {
      constructor(private val: string) {}
      toString() { return this.val }
    }
    expect(coerceValue(new UUID('abc-123'))).toBe('abc-123')
  })

  it('recursively coerces arrays', () => {
    expect(coerceValue([BigInt(1), BigInt(2), null])).toEqual([1, 2, null])
  })

  it('recursively coerces plain objects', () => {
    const result = coerceValue({ a: BigInt(1), b: 'str', c: null })
    expect(result).toEqual({ a: 1, b: 'str', c: null })
  })

  it('passes through primitive types unchanged', () => {
    expect(coerceValue(42)).toBe(42)
    expect(coerceValue(3.14)).toBe(3.14)
    expect(coerceValue('hello')).toBe('hello')
    expect(coerceValue(true)).toBe(true)
    expect(coerceValue(false)).toBe(false)
  })
})
