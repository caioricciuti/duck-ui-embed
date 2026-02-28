import type { ColumnSchema } from '../engine/schema'

export type FilterType = 'select' | 'multiselect' | 'range' | 'daterange' | 'text'

/**
 * Auto-detect the appropriate filter type from a column's schema type.
 */
export function detectFilterType(column: ColumnSchema): FilterType {
  const type = column.type.toLowerCase()

  if (type.includes('date') || type.includes('timestamp')) return 'daterange'
  if (type.includes('int') || type.includes('float') || type.includes('double') || type.includes('decimal') || type.includes('numeric')) return 'range'
  if (type.includes('bool')) return 'select'
  if (type.includes('varchar') || type.includes('text') || type.includes('string')) return 'select'

  return 'text'
}
