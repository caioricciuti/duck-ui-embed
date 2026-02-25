import { createContext } from 'react'
import type { QueryExecutor, QueryResult } from '../engine/query'
import type { SchemaInspector } from '../engine/schema'
import type { QueryCache } from '../engine/cache'
import type { FilterValue } from '../engine/filter-inject'
import type { DuckTheme } from '../charts/theme'

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
