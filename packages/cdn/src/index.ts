import { register } from '@duck_ui/elements'

// Re-export everything from core and elements
export { DuckUI } from '@duck_ui/core'
export type { DataInput, QueryResult, DuckTheme, ChartTheme } from '@duck_ui/core'
export { lightTheme, darkTheme } from '@duck_ui/core'

export {
  DuckProviderElement,
  DuckChartElement,
  DuckTableElement,
  DuckKPIElement,
  DuckDashboardElement,
  DuckPanelElement,
  DuckFilterBarElement,
  DuckSelectFilterElement,
  DuckRangeFilterElement,
  DuckDateFilterElement,
  DuckExportElement,
  register,
} from '@duck_ui/elements'

// Auto-register all custom elements on load
register()
