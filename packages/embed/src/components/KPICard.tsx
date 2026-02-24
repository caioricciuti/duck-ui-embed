import { useQuery, useDuckInternal, type UseQueryOptions } from '../provider/hooks'
import { Sparkline } from '../charts/Sparkline'
import { Loading } from './shared/Loading'
import { ErrorDisplay } from './shared/Error'

type FormatPreset = 'currency' | 'percent' | 'number' | 'compact'

export interface KPICardProps {
  /** SQL query that returns a single value (first column, first row) */
  sql: string
  /** Label */
  label: string
  /** Format function or preset name */
  format?: FormatPreset | ((value: number) => string)
  /** Currency code (shorthand — used when format='currency') */
  currency?: string
  /** Comparison SQL (returns previous period value) */
  compareSql?: string
  /** Label for comparison (e.g. "vs 2024") */
  compareLabel?: string
  /** Sparkline SQL (returns time series for trend) */
  sparklineSql?: string
  /** Custom className */
  className?: string
  /** Table name for filter injection */
  tableName?: string
}

function resolveFormatter(
  format: FormatPreset | ((value: number) => string) | undefined,
  currency?: string,
): (value: number) => string {
  if (typeof format === 'function') return format
  if (!format) return (v) => v.toLocaleString()

  switch (format) {
    case 'currency':
      return (v) =>
        new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: currency ?? 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(v)

    case 'percent':
      return (v) =>
        new Intl.NumberFormat(undefined, {
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(v / 100)

    case 'number':
      return (v) =>
        new Intl.NumberFormat(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(v)

    case 'compact':
      return (v) =>
        new Intl.NumberFormat(undefined, {
          notation: 'compact',
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(v)

    default:
      return (v) => v.toLocaleString()
  }
}

export function KPICard({
  sql,
  label,
  format,
  currency,
  compareSql,
  compareLabel,
  sparklineSql,
  className,
  tableName,
}: KPICardProps) {
  const { theme } = useDuckInternal()
  const formatter = resolveFormatter(format, currency)
  const queryOpts: UseQueryOptions | undefined = tableName ? { tableName } : undefined
  const { data, loading, error } = useQuery(sql, queryOpts)
  const comparison = useQuery(compareSql ?? 'SELECT NULL', queryOpts)
  const sparkline = useQuery(sparklineSql ?? 'SELECT NULL', queryOpts)

  if (loading) return <Loading />
  if (error) return <ErrorDisplay error={error} />

  const value = data?.rows[0] ? (Object.values(data.rows[0])[0] as number) : 0
  const prevValue = comparison.data?.rows[0]
    ? (Object.values(comparison.data.rows[0])[0] as number)
    : null

  const changePercent =
    prevValue !== null && prevValue !== 0 ? ((value - prevValue) / prevValue) * 100 : null

  const sparklineData =
    sparkline.data?.rows.map((row) => Object.values(row)[0] as number) ?? []

  return (
    <div
      className={className}
      style={{
        padding: 20,
        fontFamily: theme.fontFamily,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: theme.mutedTextColor,
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: theme.textColor,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
        }}
      >
        {formatter(value)}
      </div>
      {changePercent !== null && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            marginTop: 8,
            padding: '2px 8px',
            fontSize: 13,
            fontWeight: 600,
            color: changePercent >= 0 ? theme.successColor : theme.dangerColor,
            background: changePercent >= 0 ? theme.successBgColor : theme.dangerBgColor,
            borderRadius: 12,
          }}
        >
          <span>{changePercent >= 0 ? '\u2191' : '\u2193'}</span>
          {Math.abs(changePercent).toFixed(1)}%
          {compareLabel && (
            <span style={{ fontWeight: 400, color: theme.mutedTextColor, marginLeft: 2 }}>
              {compareLabel}
            </span>
          )}
        </div>
      )}
      {sparklineData.length > 1 && (
        <div style={{ marginTop: 12 }}>
          <Sparkline data={sparklineData} width={140} height={28} color={theme.primaryColor} fill />
        </div>
      )}
    </div>
  )
}
