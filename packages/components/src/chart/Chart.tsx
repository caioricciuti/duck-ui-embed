import { useMemo } from 'react'
import { useQuery } from '../provider/hooks'
import type { UseQueryOptions } from '../provider/hooks'
import { UChart, type UChartProps } from '@duck_ui/charts'
import { Loading } from '../shared/Loading'
import { ErrorDisplay } from '../shared/Error'
import { EmptyState } from '../shared/EmptyState'
import type { QueryResult } from '@duck_ui/core'

export interface ChartProps extends Omit<UChartProps, 'data' | 'labels' | 'xLabels'> {
  /** SQL query to execute */
  sql: string
  /** Custom className */
  className?: string
  /** Table name for filter injection */
  tableName?: string
}

interface ChartDataResult {
  data: [number[], ...number[][]]
  xLabels?: string[]
}

function queryResultToChartData(result: QueryResult): ChartDataResult {
  const columns = result.columns
  if (columns.length < 2) return { data: [[]] }

  const firstColValues = result.rows.map((row) => row[columns[0].name])
  const isCategorical = firstColValues.some((v) => typeof v === 'string')

  let xValues: number[]
  let xLabels: string[] | undefined

  if (isCategorical) {
    // Categorical x-axis: use indices, store original strings as labels
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

export function Chart({ sql, className, tableName, ...chartOptions }: ChartProps) {
  const queryOpts: UseQueryOptions | undefined = tableName ? { tableName } : undefined
  const { data, loading, error } = useQuery(sql, queryOpts)

  const chartResult = useMemo(() => {
    if (!data || data.rowCount === 0) return null
    return queryResultToChartData(data)
  }, [data])

  const labels = useMemo(() => {
    if (!data) return undefined
    return data.columns.map((c) => c.name)
  }, [data])

  if (loading) return <Loading />
  if (error) return <ErrorDisplay error={error} />
  if (!chartResult) return <EmptyState />

  return (
    <div className={className}>
      <UChart
        data={chartResult.data}
        labels={labels}
        xLabels={chartResult.xLabels}
        {...chartOptions}
      />
    </div>
  )
}
