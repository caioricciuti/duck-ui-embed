import { describe, it, expect } from 'vitest'
import { FilterInjector, type FilterState } from './filter-inject'

describe('FilterInjector', () => {
  describe('buildConditions', () => {
    it('returns empty array for no filters', () => {
      expect(FilterInjector.buildConditions({})).toEqual([])
    })

    it('skips null and undefined values', () => {
      const filters: FilterState = { a: null, b: undefined as unknown as null }
      expect(FilterInjector.buildConditions(filters)).toEqual([])
    })

    it('builds string equality condition', () => {
      const conditions = FilterInjector.buildConditions({ status: 'active' })
      expect(conditions).toEqual([`"status" = 'active'`])
    })

    it('escapes single quotes in string values', () => {
      const conditions = FilterInjector.buildConditions({ name: "O'Brien" })
      expect(conditions).toEqual([`"name" = 'O''Brien'`])
    })

    it('builds number equality condition', () => {
      const conditions = FilterInjector.buildConditions({ count: 42 })
      expect(conditions).toEqual(['"count" = 42'])
    })

    it('builds boolean condition', () => {
      const conditions = FilterInjector.buildConditions({ active: true })
      expect(conditions).toEqual(['"active" = true'])
    })

    it('builds IN condition for string array', () => {
      const conditions = FilterInjector.buildConditions({ status: ['a', 'b'] })
      expect(conditions).toEqual([`"status" IN ('a', 'b')`])
    })

    it('builds IN condition for number array', () => {
      const conditions = FilterInjector.buildConditions({ id: [1, 2, 3] })
      expect(conditions).toEqual(['"id" IN (1, 2, 3)'])
    })

    it('skips empty arrays', () => {
      const conditions = FilterInjector.buildConditions({ tags: [] })
      expect(conditions).toEqual([])
    })

    it('builds range condition', () => {
      const conditions = FilterInjector.buildConditions({
        price: { min: 10, max: 100 },
      })
      expect(conditions).toEqual(['"price" >= 10 AND "price" <= 100'])
    })

    it('builds date range condition', () => {
      const conditions = FilterInjector.buildConditions({
        created: { start: '2024-01-01', end: '2024-12-31' },
      })
      expect(conditions).toEqual([
        `"created" BETWEEN '2024-01-01' AND '2024-12-31'`,
      ])
    })

    it('escapes column names with quotes', () => {
      const conditions = FilterInjector.buildConditions({
        'my"col': 'test',
      })
      expect(conditions).toEqual([`"my""col" = 'test'`])
    })

    it('builds multiple conditions', () => {
      const conditions = FilterInjector.buildConditions({
        status: 'active',
        count: 5,
      })
      expect(conditions).toHaveLength(2)
    })
  })

  describe('inject', () => {
    it('returns original SQL when no filters active', () => {
      const sql = 'SELECT * FROM orders'
      expect(FilterInjector.inject(sql, {}, 'orders')).toBe(sql)
    })

    it('wraps SQL with filter conditions', () => {
      const sql = 'SELECT * FROM orders'
      const filters: FilterState = { status: 'shipped' }
      const result = FilterInjector.inject(sql, filters, 'orders')

      expect(result).toContain('WHERE')
      expect(result).toContain("'shipped'")
      expect(result).toContain('_filtered')
    })

    it('replaces table name references in SQL', () => {
      const sql = 'SELECT count(*) FROM orders WHERE total > 0'
      const filters: FilterState = { status: 'active' }
      const result = FilterInjector.inject(sql, filters, 'orders')

      // Should not have a bare 'orders' reference anymore
      expect(result).toContain('_filtered')
    })
  })
})
