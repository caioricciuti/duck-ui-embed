import { describe, it, expect } from 'vitest'
import { FilterInjector } from '../filter-injector'

describe('FilterInjector', () => {
  it('returns original SQL when no filters', () => {
    const sql = 'SELECT * FROM sales'
    expect(FilterInjector.inject(sql, {}, 'sales')).toBe(sql)
  })

  it('injects string equality filter', () => {
    const result = FilterInjector.inject(
      'SELECT * FROM sales',
      { country: 'Spain' },
      'sales'
    )
    expect(result).toContain('"country" = \'Spain\'')
    expect(result).toContain('_filtered')
  })

  it('injects array IN filter', () => {
    const result = FilterInjector.inject(
      'SELECT * FROM sales',
      { country: ['Spain', 'France'] },
      'sales'
    )
    expect(result).toContain('"country" IN (\'Spain\', \'France\')')
  })

  it('injects numeric range filter', () => {
    const result = FilterInjector.inject(
      'SELECT * FROM sales',
      { amount: { min: 10, max: 100 } },
      'sales'
    )
    expect(result).toContain('"amount" >= 10 AND "amount" <= 100')
  })

  it('injects date range filter', () => {
    const result = FilterInjector.inject(
      'SELECT * FROM sales',
      { order_date: { start: '2024-01-01', end: '2024-12-31' } },
      'sales'
    )
    expect(result).toContain('"order_date" BETWEEN \'2024-01-01\' AND \'2024-12-31\'')
  })

  it('escapes single quotes in string values', () => {
    const result = FilterInjector.inject(
      'SELECT * FROM sales',
      { name: "O'Brien" },
      'sales'
    )
    expect(result).toContain("O''Brien")
  })

  it('skips null and empty array filters', () => {
    const result = FilterInjector.inject(
      'SELECT * FROM sales',
      { a: null, b: [] },
      'sales'
    )
    expect(result).toBe('SELECT * FROM sales')
  })

  it('handles boolean filters', () => {
    const result = FilterInjector.inject(
      'SELECT * FROM items',
      { active: true },
      'items'
    )
    expect(result).toContain('"active" = true')
  })

  it('handles numeric equality filter', () => {
    const result = FilterInjector.inject(
      'SELECT * FROM items',
      { quantity: 5 },
      'items'
    )
    expect(result).toContain('"quantity" = 5')
  })

  it('returns original SQL for empty filters object', () => {
    const sql = 'SELECT category, SUM(amount) FROM sales GROUP BY 1'
    expect(FilterInjector.inject(sql, {}, 'sales')).toBe(sql)
  })

  it('returns original SQL when all filter values are null', () => {
    const sql = 'SELECT * FROM sales ORDER BY date'
    const result = FilterInjector.inject(
      sql,
      { region: null, category: null },
      'sales'
    )
    expect(result).toBe(sql)
  })

  it('replaces table name in JOIN queries', () => {
    const sql = 'SELECT s.*, c.name FROM sales s JOIN customers c ON s.customer_id = c.id'
    const result = FilterInjector.inject(
      sql,
      { region: 'North' },
      'sales'
    )
    expect(result).toContain('_filtered')
    expect(result).toContain('"region" = \'North\'')
  })

  it('combines multiple filter types', () => {
    const result = FilterInjector.inject(
      'SELECT * FROM sales',
      {
        category: 'Electronics',
        amount: { min: 100, max: 500 },
        date: { start: '2024-01-01', end: '2024-06-30' },
      },
      'sales'
    )
    expect(result).toContain('"category" = \'Electronics\'')
    expect(result).toContain('"amount" >= 100 AND "amount" <= 500')
    expect(result).toContain('"date" BETWEEN \'2024-01-01\' AND \'2024-06-30\'')
  })

  it('escapes double quotes in column names', () => {
    const result = FilterInjector.inject(
      'SELECT * FROM sales',
      { 'col"name': 'value' },
      'sales'
    )
    expect(result).toContain('"col""name"')
  })

  it('escapes single quotes in date range values', () => {
    const result = FilterInjector.inject(
      'SELECT * FROM sales',
      { date: { start: "2024-01-01' OR 1=1--", end: '2024-12-31' } },
      'sales'
    )
    expect(result).toContain("2024-01-01'' OR 1=1--")
  })
})
