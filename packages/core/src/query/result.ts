export interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
}

export interface QueryResult {
  /** Rows as array of objects with column names as keys */
  rows: Record<string, unknown>[]
  /** Column metadata */
  columns: ColumnInfo[]
  /** Number of rows returned */
  rowCount: number
  /** Execution time in milliseconds */
  executionTime: number
}
