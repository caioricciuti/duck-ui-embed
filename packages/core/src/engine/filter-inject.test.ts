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

    it('builds LIKE condition', () => {
      const conditions = FilterInjector.buildConditions({
        name: { like: '%smith%' },
      })
      expect(conditions).toEqual([`"name" LIKE '%smith%'`])
    })

    it('builds ILIKE condition', () => {
      const conditions = FilterInjector.buildConditions({
        name: { ilike: '%SMITH%' },
      })
      expect(conditions).toEqual([`"name" ILIKE '%SMITH%'`])
    })

    it('escapes single quotes in LIKE values', () => {
      const conditions = FilterInjector.buildConditions({
        name: { like: "%O'Brien%" },
      })
      expect(conditions).toEqual([`"name" LIKE '%O''Brien%'`])
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

  describe('injectAsSubquery', () => {
    it('returns original SQL when no filters active', () => {
      const sql = 'SELECT * FROM orders'
      expect(FilterInjector.injectAsSubquery(sql, {})).toBe(sql)
    })

    it('wraps entire SQL as subquery with filters', () => {
      const sql = 'SELECT * FROM orders'
      const filters: FilterState = { status: 'shipped' }
      const result = FilterInjector.injectAsSubquery(sql, filters)

      expect(result).toBe(`SELECT * FROM (SELECT * FROM orders) AS _duck_sub WHERE "status" = 'shipped'`)
    })

    it('works with JOINs', () => {
      const sql = 'SELECT o.*, c.name FROM orders o JOIN customers c ON o.cid = c.id'
      const filters: FilterState = { status: 'active' }
      const result = FilterInjector.injectAsSubquery(sql, filters)

      expect(result).toContain('_duck_sub')
      expect(result).toContain('JOIN')
      expect(result).toContain("'active'")
    })

    it('works with CTEs', () => {
      const sql = 'WITH top AS (SELECT * FROM orders LIMIT 10) SELECT * FROM top'
      const filters: FilterState = { total: { min: 0, max: 100 } }
      const result = FilterInjector.injectAsSubquery(sql, filters)

      expect(result).toContain('_duck_sub')
      expect(result).toContain('WITH top AS')
      expect(result).toContain('"total" >= 0 AND "total" <= 100')
    })

    it('skips null and undefined filter values', () => {
      const sql = 'SELECT * FROM orders'
      const filters: FilterState = { status: null, name: undefined as unknown as null }
      expect(FilterInjector.injectAsSubquery(sql, filters)).toBe(sql)
    })

    it('combines multiple filters with AND', () => {
      const sql = 'SELECT * FROM orders'
      const filters: FilterState = { status: 'active', total: { min: 10, max: 100 } }
      const result = FilterInjector.injectAsSubquery(sql, filters)

      expect(result).toContain('AND')
      expect(result).toContain("'active'")
      expect(result).toContain('"total" >= 10')
    })
  })
})
