import { createContext } from 'react'
import type { QueryExecutor, QueryResult, SchemaInspector, QueryCache, FilterValue, DuckTheme } from '@duck_ui/core'

export interface DuckUIContextValue {
  /** Execute a SQL query and get results */
  query: (sql: string) => Promise<QueryResult>
  /** Internal executor (used by hooks) */
  executor: QueryExecutor | null
  /** Internal schema inspector (used by hooks) */
  inspector: SchemaInspector | null
  /** Internal cache (used by hooks) */
  cache: QueryCache | null
  /** Engine status */
  status: 'idle' | 'loading' | 'ready' | 'error'
  /** Error if status is 'error' */
  error: Error | null
  /** Active filters */
  filters: Record<string, FilterValue>
  /** Set a filter value */
  setFilter: (column: string, value: FilterValue) => void
  /** Clear all filters */
  clearFilters: () => void
  /** Filter change counter (for re-execution) */
  filterVersion: number
  /** Table names loaded from the data prop */
  tableNames: string[]
  /** Merged theme (defaults + user overrides) */
  theme: DuckTheme
}

export const DuckUIContext = createContext<DuckUIContextValue | null>(null)
