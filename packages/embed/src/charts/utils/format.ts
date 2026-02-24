import type { AxisOptions } from '../types'

export function formatNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toFixed(0)
}

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString()
}

export function buildAxisFormatter(
  format: AxisOptions['format']
): (self: unknown, ticks: number[]) => string[] {
  return (_self, ticks) => {
    if (typeof format === 'function') return ticks.map(format)

    switch (format) {
      case 'currency':
        return ticks.map((v) => formatCurrency(v))
      case 'percent':
        return ticks.map((v) => formatPercent(v))
      case 'date':
        return ticks.map((v) => formatDate(v))
      case 'number':
      default:
        return ticks.map((v) => formatNumber(v))
    }
  }
}
