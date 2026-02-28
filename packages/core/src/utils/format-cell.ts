/**
 * Format a cell value for display in tables and exports.
 */
export function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '\u2014'
  if (typeof value === 'number') {
    return value.toLocaleString(undefined, { maximumFractionDigits: 6 })
  }
  if (value instanceof Date) {
    return value.toLocaleDateString()
  }
  return String(value)
}
