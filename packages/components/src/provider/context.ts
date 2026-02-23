import { createContext } from 'react'
import type {
  DuckDBManager,
  QueryExecutor,
  SchemaInspector,
  DataSourceRegistry,
  QueryCache,
} from '@duck_ui/core'
import type { FilterValue } from '@duck_ui/core'

export interface DuckContextValue {
  engine: DuckDBManager | null
  executor: QueryExecutor | null
  inspector: SchemaInspector | null
  registry: DataSourceRegistry | null
  cache: QueryCache | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: Error | null
  filters: Record<string, FilterValue>
  setFilter: (column: string, value: FilterValue) => void
  clearFilters: () => void
  filterVersion: number
}

export const DuckContext = createContext<DuckContextValue | null>(null)
