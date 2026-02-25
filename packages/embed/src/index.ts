// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export { DuckUIProvider } from './provider/DuckUIProvider'
export type { DuckUIProviderProps } from './provider/DuckUIProvider'

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
export { useDuckUI, useTheme } from './provider/hooks'

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------
export { Chart } from './components/Chart'
export type { ChartProps } from './components/Chart'

export { DataTable } from './components/DataTable'
export type { DataTableProps } from './components/DataTable'

export { KPICard } from './components/KPICard'
export type { KPICardProps } from './components/KPICard'

export { FilterBar } from './components/FilterBar'
export type { FilterBarProps, FilterConfig } from './components/FilterBar'

export { SelectFilter } from './components/filters/SelectFilter'
export { MultiSelectFilter } from './components/filters/MultiSelectFilter'
export { RangeFilter } from './components/filters/RangeFilter'
export { DateRangeFilter } from './components/filters/DateRangeFilter'

export { ExportButton } from './components/ExportButton'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type { DataInput } from './engine/data-loader'
export type { QueryResult, ColumnInfo } from './engine/query'
export type { FilterValue } from './engine/filter-inject'
export type { ChartTheme, DuckTheme } from './charts/theme'
