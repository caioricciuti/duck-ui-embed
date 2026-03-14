import type { QueryResult } from '../engine/query'

export interface ChartDataResult {
  data: [number[], ...(number | null)[][]]
  xLabels?: string[]
  warnings: string[]
}

/**
 * Transform a QueryResult into uPlot-ready chart data.
 * First column -> x-axis, remaining columns -> y-series.
 * Non-numeric Y values become `null` (uPlot renders gaps natively).
 */
export function queryResultToChartData(result: QueryResult): ChartDataResult {
  const columns = result.columns
  const warnings: string[] = []
  if (columns.length < 2) return { data: [[]], warnings }

  const firstColValues = result.rows.map((row) => row[columns[0].name])
  const isCategorical = firstColValues.some((v) => typeof v === 'string')

  let xValues: number[]
  let xLabels: string[] | undefined

  if (isCategorical) {
    xLabels = firstColValues.map((v) => String(v ?? ''))
    xValues = firstColValues.map((_, i) => i)
  } else {
    xValues = firstColValues.map((v) => (typeof v === 'number' ? v : 0))
  }

  const series = columns.slice(1).map((col) => {
    let nonNumericCount = 0
    const values = result.rows.map((row) => {
      const val = row[col.name]
      if (typeof val === 'number') return val
      if (val === null || val === undefined) return null
      nonNumericCount++
      return null
    })
    if (nonNumericCount > 0) {
      warnings.push(
        `Column "${col.name}" has ${nonNumericCount} non-numeric value${nonNumericCount > 1 ? 's' : ''} rendered as gaps.`
      )
    }
    return values
  })

  return {
    data: [xValues, ...series] as [number[], ...(number | null)[][]],
    xLabels,
    warnings,
  }
}
