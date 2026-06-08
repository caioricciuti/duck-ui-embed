import { register } from '@duck_ui/elements'

// Re-export everything from core and elements
export { DuckUI } from '@duck_ui/core'
export type { DataInput, QueryResult, DuckTheme, ChartTheme } from '@duck_ui/core'
export { lightTheme, darkTheme, encodeShare, decodeShare, extractShareParam } from '@duck_ui/core'
export type { SharePayload } from '@duck_ui/core'

export {
  DuckProviderElement,
  DuckEmbedElement,
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
