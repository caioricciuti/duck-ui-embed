# @duck_ui/pro

> Pro features for Duck-UI — dashboard builder, pivot tables, drill-down, row-level security, and more.

Contact **c.ricciuti@iberodata.es** for pricing and license keys.

## Install

```bash
npm install @duck_ui/pro @duck_ui/embed @duckdb/duckdb-wasm
```

## Setup

Wrap your app with `ProProvider` inside `DuckProvider` and pass your license key:

```tsx
import { DuckProvider } from '@duck_ui/embed'
import { ProProvider } from '@duck_ui/pro'

function App() {
  return (
    <DuckProvider
      config={{
        sources: [{ type: 'url', name: 'sales', url: '/data/sales.parquet' }],
      }}
    >
      <ProProvider license="DUCK-eyJzdWI...">
        {/* Pro + free components work together */}
      </ProProvider>
    </DuckProvider>
  )
}
```

Without a valid license, Pro components render nothing and log a console warning.

## Components

### ThemeProvider

Custom theming with CSS custom properties.

```tsx
import { ThemeProvider } from '@duck_ui/pro'
import { DataTable, Chart } from '@duck_ui/embed'

<ProProvider license="DUCK-...">
  <ThemeProvider theme={{ primary: '#4f46e5', fontFamily: 'Inter, sans-serif' }}>
    <DataTable sql="SELECT * FROM sales" />
    <Chart sql="SELECT month, revenue FROM sales GROUP BY 1" type="bar" height={300} />
  </ThemeProvider>
</ProProvider>
```

### PivotTable

Pivot table with row/column grouping and value aggregation.

```tsx
import { PivotTable } from '@duck_ui/pro'

<PivotTable
  sql="SELECT region, category, year, SUM(revenue) AS rev FROM sales GROUP BY 1, 2, 3"
  rows={['region', 'category']}
  columns={['year']}
  values={['rev']}
/>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `sql` | `string` | Yes | SQL query to pivot |
| `rows` | `string[]` | Yes | Columns to use as row headers |
| `columns` | `string[]` | Yes | Columns to use as column headers |
| `values` | `string[]` | Yes | Columns to aggregate as values |
| `className` | `string` | No | CSS class name |

### GroupBy

Advanced grouping controls for dynamic SQL group-by queries.

```tsx
import { GroupBy } from '@duck_ui/pro'

<GroupBy
  sql="SELECT region, category, SUM(revenue) AS rev FROM sales GROUP BY 1, 2"
  groupColumns={['region', 'category']}
/>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `sql` | `string` | Yes | SQL query with GROUP BY |
| `groupColumns` | `string[]` | Yes | Columns to group by |
| `className` | `string` | No | CSS class name |

### DrillDown

Wrap a chart to enable click-to-drill on data points.

```tsx
import { DrillDown } from '@duck_ui/pro'
import { Chart } from '@duck_ui/embed'

<DrillDown onDrill={(params) => console.log('Drilled into:', params)}>
  <Chart
    sql="SELECT region, SUM(revenue) AS rev FROM sales GROUP BY 1"
    type="bar"
    height={300}
  />
</DrillDown>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | `ReactNode` | Yes | Chart or component to make drillable |
| `onDrill` | `(params: Record<string, unknown>) => void` | No | Callback when user drills into a data point |

### ConditionalFormat

Apply conditional cell styling based on value rules.

```tsx
import { ConditionalFormat } from '@duck_ui/pro'
import { DataTable } from '@duck_ui/embed'

<ConditionalFormat
  rules={[
    { column: 'revenue', condition: 'gt', value: 100000, style: { color: 'green', fontWeight: 'bold' } },
    { column: 'revenue', condition: 'lt', value: 10000, style: { color: 'red' } },
    { column: 'margin', condition: 'between', value: [0.2, 0.4], style: { backgroundColor: '#fef3c7' } },
  ]}
>
  <DataTable sql="SELECT * FROM sales" />
</ConditionalFormat>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `rules` | `ConditionalFormatRule[]` | Yes | Array of formatting rules |
| `children` | `ReactNode` | Yes | Table or component to format |

**Rule format:**

```ts
interface ConditionalFormatRule {
  column: string
  condition: 'gt' | 'lt' | 'eq' | 'between'
  value: number | [number, number]  // single value or [min, max] for 'between'
  style: Record<string, string>     // CSS properties to apply
}
```

### RowLevelSecurity

Restrict data access based on user roles — automatically injects WHERE clauses.

```tsx
import { RowLevelSecurity } from '@duck_ui/pro'
import { DataTable, Chart } from '@duck_ui/embed'

<RowLevelSecurity rules={{ region: "= 'North'", department: "IN ('Sales', 'Marketing')" }}>
  <DataTable sql="SELECT * FROM sales" />
  <Chart sql="SELECT month, SUM(revenue) AS rev FROM sales GROUP BY 1" type="line" height={300} />
</RowLevelSecurity>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `rules` | `Record<string, string>` | Yes | Column → SQL condition mapping |
| `children` | `ReactNode` | Yes | Components to apply security to |

### DashboardBuilder

Drag-and-drop dashboard editor. Outputs a `DashboardConfig` you can save and render later.

```tsx
import { DashboardBuilder } from '@duck_ui/pro'
import type { DashboardConfig } from '@duck_ui/pro'

const [config, setConfig] = useState<DashboardConfig>({
  id: 'sales-dashboard',
  title: 'Sales Overview',
  layout: [
    { id: 'kpi-1', type: 'kpi', x: 0, y: 0, w: 4, h: 2, config: { sql: "SELECT SUM(revenue) AS value FROM sales", label: 'Revenue' } },
    { id: 'chart-1', type: 'chart', x: 0, y: 2, w: 8, h: 4, config: { sql: "SELECT month, SUM(revenue) AS rev FROM sales GROUP BY 1", type: 'bar' } },
    { id: 'table-1', type: 'table', x: 0, y: 6, w: 12, h: 6, config: { sql: "SELECT * FROM sales LIMIT 100" } },
  ],
})

<DashboardBuilder config={config} onChange={setConfig} />
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `config` | `DashboardConfig` | Yes | Current dashboard configuration |
| `onChange` | `(config: DashboardConfig) => void` | Yes | Called when user modifies the layout |
| `children` | `ReactNode` | No | Additional toolbar or UI elements |

### DashboardRenderer

Render a saved `DashboardConfig` as a read-only dashboard.

```tsx
import { DashboardRenderer } from '@duck_ui/pro'

// Load a saved config from your backend
const config = await fetch('/api/dashboards/sales').then(r => r.json())

<DashboardRenderer config={config} className="my-dashboard" />
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `config` | `DashboardConfig` | Yes | Saved dashboard configuration |
| `className` | `string` | No | CSS class name |

### DashboardConfig

The config object shared by `DashboardBuilder` and `DashboardRenderer`:

```ts
interface DashboardConfig {
  id: string
  title: string
  layout: LayoutItem[]
  filters?: FilterConfig[]
  theme?: ThemeConfig
}

interface LayoutItem {
  id: string
  type: 'chart' | 'table' | 'kpi' | 'filter'
  x: number
  y: number
  w: number
  h: number
  config: Record<string, unknown>
}
```

## Hooks

### useProLicense

Check license status to conditionally render UI.

```tsx
import { useProLicense } from '@duck_ui/pro'

function UpgradeGate({ children }: { children: ReactNode }) {
  const { valid, loading, tier } = useProLicense()

  if (loading) return <p>Checking license...</p>
  if (!valid) return <p>Upgrade to Pro. <a href="https://duck-ui.com/pro">Learn more</a></p>

  return <>{children}</>
}
```

**Return value:**

| Property | Type | Description |
|----------|------|-------------|
| `valid` | `boolean` | Whether the license is valid |
| `loading` | `boolean` | Whether validation is in progress |
| `tier` | `'pro' \| 'enterprise' \| null` | License tier |
| `payload` | `LicensePayload \| null` | Full decoded license payload |

## Full Example

Putting it all together — a themed dashboard with pivot table, drill-down charts, conditional formatting, and row-level security:

```tsx
import { DuckProvider, DataTable, Chart, KPICard, FilterBar, SelectFilter } from '@duck_ui/embed'
import {
  ProProvider,
  ThemeProvider,
  PivotTable,
  DrillDown,
  ConditionalFormat,
  RowLevelSecurity,
} from '@duck_ui/pro'

function SalesDashboard() {
  return (
    <DuckProvider
      config={{
        sources: [{ type: 'url', name: 'sales', url: '/data/sales.parquet' }],
      }}
    >
      <ProProvider license={process.env.NEXT_PUBLIC_DUCK_LICENSE!}>
        <ThemeProvider theme={{ primary: '#4f46e5' }}>
          <RowLevelSecurity rules={{ region: `= '${currentUser.region}'` }}>

            <FilterBar>
              <SelectFilter column="category" label="Category" />
            </FilterBar>

            <KPICard sql="SELECT SUM(revenue) AS value FROM sales" label="Revenue" format="currency" />

            <DrillDown onDrill={(p) => console.log(p)}>
              <Chart
                sql="SELECT month, SUM(revenue) AS rev FROM sales GROUP BY 1"
                type="bar"
                height={300}
              />
            </DrillDown>

            <ConditionalFormat
              rules={[
                { column: 'revenue', condition: 'gt', value: 50000, style: { color: 'green' } },
                { column: 'revenue', condition: 'lt', value: 5000, style: { color: 'red' } },
              ]}
            >
              <DataTable sql="SELECT * FROM sales" pageSize={25} />
            </ConditionalFormat>

            <PivotTable
              sql="SELECT region, year, SUM(revenue) AS rev FROM sales GROUP BY 1, 2"
              rows={['region']}
              columns={['year']}
              values={['rev']}
            />

          </RowLevelSecurity>
        </ThemeProvider>
      </ProProvider>
    </DuckProvider>
  )
}
```

## Full Documentation

- [API Reference](../../docs/api/pro.md)
- [Pro License Guide](../../docs/guides/pro-license.md)

## License

Commercial license — see [LICENSE.md](./LICENSE.md) for details.

This package is **not** covered by the Apache-2.0 license that applies to the other `@duck_ui/*` packages.
