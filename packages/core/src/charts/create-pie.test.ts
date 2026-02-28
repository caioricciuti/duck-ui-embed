import { describe, it, expect } from 'vitest'
import { pieHitTest } from './create-pie'

describe('pieHitTest', () => {
  it('returns first slice index for angle near top', () => {
    // Equal slices: 4 values = 4 × 90°
    const values = [25, 25, 25, 25]
    const size = 200

    // Click slightly to the right of top-center → should be slice 0
    const result = pieHitTest(105, 90, values, size)
    expect(result).toBe(0)
  })

  it('returns correct slice for different angles', () => {
    // Two slices: first is 75%, second is 25%
    const values = [75, 25]
    const size = 200

    // Click at center-right → should be first slice (it covers 270°)
    const result = pieHitTest(190, 100, values, size)
    expect(result).toBe(0)
  })

  it('returns null for empty values', () => {
    const result = pieHitTest(100, 100, [], 200)
    expect(result).toBeNull()
  })

  it('handles single slice', () => {
    const result = pieHitTest(150, 100, [100], 200)
    expect(result).toBe(0)
  })
})
