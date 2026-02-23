export type FilterValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | { min: number; max: number }
  | { start: string; end: string }
  | null

export interface FilterState {
  [column: string]: FilterValue
}

function quoteIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`
}

function escapeString(value: string): string {
  return value.replace(/'/g, "''")
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export class FilterInjector {
  /**
   * Wraps the original SQL with a filtered subquery.
   * Original SQL is never modified — the table reference is replaced
   * with a filtered subquery.
   */
  static inject(sql: string, filters: FilterState, tableName: string): string {
    const conditions = FilterInjector.buildConditions(filters)
    if (conditions.length === 0) return sql

    const whereClause = conditions.join(' AND ')
    const quotedTable = quoteIdentifier(tableName)

    return `SELECT * FROM (${sql.replace(
      new RegExp(`\\b${escapeRegExp(tableName)}\\b`, 'gi'),
      `(SELECT * FROM ${quotedTable} WHERE ${whereClause}) AS _filtered`
    )}) AS _result`
  }

  static buildConditions(filters: FilterState): string[] {
    const conditions: string[] = []

    for (const [column, value] of Object.entries(filters)) {
      if (value === null || value === undefined) continue

      const col = quoteIdentifier(column)

      if (Array.isArray(value)) {
        if (value.length === 0) continue
        const escaped = value.map((v) =>
          typeof v === 'string' ? `'${escapeString(v)}'` : v
        )
        conditions.push(`${col} IN (${escaped.join(', ')})`)
      } else if (typeof value === 'object' && 'min' in value && 'max' in value) {
        conditions.push(`${col} >= ${value.min} AND ${col} <= ${value.max}`)
      } else if (typeof value === 'object' && 'start' in value && 'end' in value) {
        conditions.push(
          `${col} BETWEEN '${escapeString(value.start)}' AND '${escapeString(value.end)}'`
        )
      } else if (typeof value === 'string') {
        conditions.push(`${col} = '${escapeString(value)}'`)
      } else if (typeof value === 'number') {
        conditions.push(`${col} = ${value}`)
      } else if (typeof value === 'boolean') {
        conditions.push(`${col} = ${value}`)
      }
    }

    return conditions
  }
}
