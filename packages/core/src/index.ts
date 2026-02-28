// Imperative API
export { DuckUI } from './duck-ui'
export type { DuckUIStatus, DuckUIOptions } from './duck-ui'

// Engine
export { DuckDBManager } from './engine/init'
export type { DuckDBManagerConfig } from './engine/init'
export { ConnectionPool } from './engine/pool'
export type { ConnectionPoolConfig } from './engine/pool'
export { QueryExecutor } from './engine/query'
export type { QueryResult, ColumnInfo, ConnectionHandle } from './engine/query'
export { QueryCache } from './engine/cache'
export { FilterInjector } from './engine/filter-inject'
export type { FilterValue, FilterState } from './engine/filter-inject'
export { loadData, dropTables } from './engine/data-loader'
export type { DataInput } from './engine/data-loader'
export { SchemaInspector } from './engine/schema'
export type { TableSchema, ColumnSchema } from './engine/schema'
export { DuckUIError, ConnectionError, DataLoadError } from './engine/errors'

// Charts — theme & types
export { lightTheme, darkTheme } from './charts/theme'
export type { ChartTheme, DuckTheme } from './charts/theme'
export type { ChartData, ChartOptions, AxisOptions } from './charts/types'

// Charts — presets
export { linePreset } from './charts/presets/line'
export { barPreset } from './charts/presets/bar'
export { areaPreset } from './charts/presets/area'
export { scatterPreset } from './charts/presets/scatter'

// Charts — plugins
export { tooltipPlugin } from './charts/plugins/tooltip'
export type { TooltipOptions } from './charts/plugins/tooltip'

// Charts — utils
export { defaultPalette, darkPalette, colorblindPalette } from './charts/utils/colors'
export { formatNumber, formatCurrency, formatPercent, formatDate, buildAxisFormatter } from './charts/utils/format'

// Charts — factories
export { createChart, buildChartOptions } from './charts/create-chart'
export type { BuildChartOptionsParams, CreateChartOptions } from './charts/create-chart'
export { drawPie, pieHitTest } from './charts/create-pie'
export type { DrawPieOptions } from './charts/create-pie'
export { createSparkline } from './charts/create-sparkline'
export type { SparklineOptions } from './charts/create-sparkline'
export { queryResultToChartData } from './charts/query-transform'
export type { ChartDataResult } from './charts/query-transform'

// Utilities
export { formatCellValue } from './utils/format-cell'
export { resolveFormatter } from './utils/resolve-formatter'
export type { FormatPreset } from './utils/resolve-formatter'
export { exportToFile } from './utils/export-data'
export { detectFilterType } from './utils/detect-filter'
export type { FilterType } from './utils/detect-filter'
export { observeSize } from './utils/observe-size'
export type { Size } from './utils/observe-size'
