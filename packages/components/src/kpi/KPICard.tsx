import { useQuery } from '../provider/hooks'
import type { UseQueryOptions } from '../provider/hooks'
import { Sparkline } from '@duck_ui/charts'
import { Loading } from '../shared/Loading'
import { ErrorDisplay } from '../shared/Error'

type FormatPreset = 'currency' | 'percent' | 'number' | 'compact'

export interface KPIFormatOptions {
  /** Currency code (default: 'USD') */
  currency?: string
  /** Locale (default: navigator.language) */
  locale?: string
  /** Decimal places */
  decimals?: number
}

export interface KPICardProps {
  /** SQL query that returns a single value (first column, first row) */
  sql: string
  /** Label */
  label: string
  /** Format function or preset name */
  format?: FormatPreset | ((value: number) => string)
  /** Options for format presets */
  formatOptions?: KPIFormatOptions
  /** Comparison SQL (returns previous period value) */
  comparisonSql?: string
  /** Sparkline SQL (returns time series for trend) */
  sparklineSql?: string
  /** Custom className */
  className?: string
  /** Table name for filter injection */
  tableName?: string
}

function resolveFormatter(
  format: FormatPreset | ((value: number) => string) | undefined,
  options?: KPIFormatOptions,
): (value: number) => string {
  if (typeof format === 'function') return format
  if (!format) return (v) => v.toLocaleString()

  const locale = options?.locale ?? undefined // undefined = browser default
  const currency = options?.currency ?? 'USD'

  switch (format) {
    case 'currency':
      return (v) =>
        new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
          minimumFractionDigits: options?.decimals ?? 0,
          maximumFractionDigits: options?.decimals ?? 0,
        }).format(v)

    case 'percent':
      return (v) =>
        new Intl.NumberFormat(locale, {
          style: 'percent',
          minimumFractionDigits: options?.decimals ?? 1,
          maximumFractionDigits: options?.decimals ?? 1,
        }).format(v / 100)

    case 'number':
      return (v) =>
        new Intl.NumberFormat(locale, {
          minimumFractionDigits: options?.decimals ?? 0,
          maximumFractionDigits: options?.decimals ?? 0,
        }).format(v)

    case 'compact':
      return (v) =>
        new Intl.NumberFormat(locale, {
          notation: 'compact',
          minimumFractionDigits: options?.decimals ?? 1,
          maximumFractionDigits: options?.decimals ?? 1,
        }).format(v)

    default:
      return (v) => v.toLocaleString()
  }
}

export function KPICard({
  sql,
  label,
  format,
  formatOptions,
  comparisonSql,
  sparklineSql,
  className,
  tableName,
}: KPICardProps) {
  const formatter = resolveFormatter(format, formatOptions)
  const queryOpts: UseQueryOptions | undefined = tableName ? { tableName } : undefined
  const { data, loading, error } = useQuery(sql, queryOpts)
  const comparison = useQuery(comparisonSql ?? 'SELECT NULL', queryOpts)
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
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: '#6b7280',
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
          color: '#111827',
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
            color: changePercent >= 0 ? '#059669' : '#dc2626',
            background: changePercent >= 0 ? '#ecfdf5' : '#fef2f2',
            borderRadius: 12,
          }}
        >
          <span>{changePercent >= 0 ? '\u2191' : '\u2193'}</span>
          {Math.abs(changePercent).toFixed(1)}%
        </div>
      )}
      {sparklineData.length > 1 && (
        <div style={{ marginTop: 12 }}>
          <Sparkline data={sparklineData} width={140} height={28} color="#2563eb" fill />
        </div>
      )}
    </div>
  )
}
