import { useMemo } from 'react'
import { queryResultToChartData } from '@duck_ui/core'
import type { QueryResult } from '@duck_ui/core'
import { useQuery, useDuckInternal, type UseQueryOptions } from '../provider/hooks'
import { UChart, type UChartProps } from '../charts/UChart'
import { Loading } from './shared/Loading'
import { ErrorDisplay } from './shared/Error'
import { EmptyState } from './shared/EmptyState'

export interface ChartProps extends Omit<UChartProps, 'data' | 'labels' | 'xLabels'> {
  /** SQL query to execute */
  sql: string
  /** Custom className */
  className?: string
  /** Table name for filter injection */
  tableName?: string
}

export function Chart({ sql, className, tableName, ...chartOptions }: ChartProps) {
  const { theme } = useDuckInternal()
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
        theme={theme}
        {...chartOptions}
      />
    </div>
  )
}
