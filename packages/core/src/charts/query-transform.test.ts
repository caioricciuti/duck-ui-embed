import { describe, it, expect } from 'vitest'
import { queryResultToChartData } from './query-transform'
import type { QueryResult } from '../engine/query'

describe('queryResultToChartData', () => {
  it('returns empty data for single-column result', () => {
    const result: QueryResult = {
      rows: [{ x: 1 }],
      columns: [{ name: 'x', type: 'INTEGER', nullable: false }],
      rowCount: 1,
      executionTime: 0,
    }
    const out = queryResultToChartData(result)
    expect(out.data).toEqual([[]])
    expect(out.warnings).toEqual([])
  })

  it('transforms numeric x-axis data', () => {
    const result: QueryResult = {
      rows: [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
        { x: 3, y: 30 },
      ],
      columns: [
        { name: 'x', type: 'INTEGER', nullable: false },
        { name: 'y', type: 'INTEGER', nullable: false },
      ],
      rowCount: 3,
      executionTime: 0,
    }

    const result2 = queryResultToChartData(result)
    expect(result2.data).toEqual([[1, 2, 3], [10, 20, 30]])
    expect(result2.xLabels).toBeUndefined()
    expect(result2.warnings).toEqual([])
  })

  it('transforms categorical x-axis data', () => {
    const result: QueryResult = {
      rows: [
        { country: 'USA', revenue: 100 },
        { country: 'UK', revenue: 80 },
      ],
      columns: [
        { name: 'country', type: 'VARCHAR', nullable: false },
        { name: 'revenue', type: 'DOUBLE', nullable: false },
      ],
      rowCount: 2,
      executionTime: 0,
    }

    const result2 = queryResultToChartData(result)
    expect(result2.data).toEqual([[0, 1], [100, 80]])
    expect(result2.xLabels).toEqual(['USA', 'UK'])
  })

  it('handles multiple y-series', () => {
    const result: QueryResult = {
      rows: [
        { month: 'Jan', sales: 10, costs: 5 },
        { month: 'Feb', sales: 20, costs: 8 },
      ],
      columns: [
        { name: 'month', type: 'VARCHAR', nullable: false },
        { name: 'sales', type: 'INTEGER', nullable: false },
        { name: 'costs', type: 'INTEGER', nullable: false },
      ],
      rowCount: 2,
      executionTime: 0,
    }

    const result2 = queryResultToChartData(result)
    expect(result2.data).toEqual([[0, 1], [10, 20], [5, 8]])
    expect(result2.xLabels).toEqual(['Jan', 'Feb'])
  })

  it('returns null for non-numeric y values (not 0)', () => {
    const result: QueryResult = {
      rows: [
        { x: 1, y: null },
        { x: 2, y: 'abc' },
      ],
      columns: [
        { name: 'x', type: 'INTEGER', nullable: false },
        { name: 'y', type: 'VARCHAR', nullable: true },
      ],
      rowCount: 2,
      executionTime: 0,
    }

    const result2 = queryResultToChartData(result)
    expect(result2.data[1]).toEqual([null, null])
  })

  it('populates warnings for non-numeric y values', () => {
    const result: QueryResult = {
      rows: [
        { x: 1, y: 'abc' },
        { x: 2, y: 'def' },
      ],
      columns: [
        { name: 'x', type: 'INTEGER', nullable: false },
        { name: 'y', type: 'VARCHAR', nullable: false },
      ],
      rowCount: 2,
      executionTime: 0,
    }

    const result2 = queryResultToChartData(result)
    expect(result2.warnings).toHaveLength(1)
    expect(result2.warnings[0]).toContain('Column "y"')
    expect(result2.warnings[0]).toContain('2 non-numeric values')
  })

  it('does not warn for null values (only non-numeric non-null)', () => {
    const result: QueryResult = {
      rows: [
        { x: 1, y: null },
        { x: 2, y: 10 },
      ],
      columns: [
        { name: 'x', type: 'INTEGER', nullable: false },
        { name: 'y', type: 'INTEGER', nullable: true },
      ],
      rowCount: 2,
      executionTime: 0,
    }

    const result2 = queryResultToChartData(result)
    expect(result2.data[1]).toEqual([null, 10])
    expect(result2.warnings).toEqual([])
  })
})
