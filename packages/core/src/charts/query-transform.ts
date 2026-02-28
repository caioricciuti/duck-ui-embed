import type { QueryResult } from '../engine/query'

export interface ChartDataResult {
  data: [number[], ...number[][]]
  xLabels?: string[]
}

/**
 * Transform a QueryResult into uPlot-ready chart data.
 * First column → x-axis, remaining columns → y-series.
 */
export function queryResultToChartData(result: QueryResult): ChartDataResult {
  const columns = result.columns
  if (columns.length < 2) return { data: [[]] }

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

  const series = columns.slice(1).map((col) =>
    result.rows.map((row) => {
      const val = row[col.name]
      return typeof val === 'number' ? val : 0
    })
  )

  return {
    data: [xValues, ...series] as [number[], ...number[][]],
    xLabels,
  }
}
