import { DuckProviderElement } from './duck-provider'
import { DuckChartElement } from './duck-chart'
import { DuckTableElement } from './duck-table'
import { DuckKPIElement } from './duck-kpi'
import { DuckDashboardElement, DuckPanelElement } from './duck-dashboard'
import { DuckFilterBarElement } from './duck-filter-bar'
import { DuckSelectFilterElement } from './duck-select-filter'
import { DuckRangeFilterElement } from './duck-range-filter'
import { DuckDateFilterElement } from './duck-date-filter'
import { DuckExportElement } from './duck-export'

const elements: [string, CustomElementConstructor][] = [
  ['duck-provider', DuckProviderElement],
  ['duck-chart', DuckChartElement],
  ['duck-table', DuckTableElement],
  ['duck-kpi', DuckKPIElement],
  ['duck-dashboard', DuckDashboardElement],
  ['duck-panel', DuckPanelElement],
  ['duck-filter-bar', DuckFilterBarElement],
  ['duck-select-filter', DuckSelectFilterElement],
  ['duck-range-filter', DuckRangeFilterElement],
  ['duck-date-filter', DuckDateFilterElement],
  ['duck-export', DuckExportElement],
]

/** Auto-register all duck-* custom elements. */
export function register(): void {
  for (const [name, ctor] of elements) {
    if (!customElements.get(name)) {
      customElements.define(name, ctor)
    }
  }
}
