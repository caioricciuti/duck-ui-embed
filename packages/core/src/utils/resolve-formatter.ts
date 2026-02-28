export type FormatPreset = 'currency' | 'percent' | 'number' | 'compact'

/**
 * Resolve a format preset name or custom function into a value formatter.
 */
export function resolveFormatter(
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
