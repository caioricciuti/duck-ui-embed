# @duck_ui/embed API Reference

React bindings for Duck-UI. This package provides `DuckUIProvider`, hooks, and component wrappers built on top of `@duck_ui/core`.

> Engine types (`QueryResult`, `FilterValue`, `DuckTheme`, etc.) and chart factories are defined in [`@duck_ui/core`](./core.md). This page covers the React-specific API.

```bash
bun add @duck_ui/embed @duckdb/duckdb-wasm
```

---

## Table of Contents

- [Provider](#provider)
- [Hooks](#hooks)
- [Components](#components)
- [Layout](#layout)
- [Filters](#filters)
- [Types](#types)

---

## Provider

### DuckUIProvider

Initializes DuckDB-WASM, loads data into tables, and provides context to all child components.

```tsx
import { DuckUIProvider } from '@duck_ui/embed'
```

#### DuckUIProviderProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `Record<string, DataInput>` | **required** | Data tables. Key = DuckDB table name, value = data source. |
| `theme` | `Partial<DuckTheme>` | `lightTheme` | Theme overrides (shallow-merged with defaults) |
| `onReady` | `() => void` | -- | Called when engine is ready and all data is loaded |
| `onError` | `(error: Error) => void` | -- | Called on initialization or data loading error |

#### DataInput

The value type for each entry in the `data` prop. The key becomes the DuckDB table name.

```ts
type DataInput =
  | Record<string, unknown>[]                              // Array of objects → table
  | { url: string; format?: 'csv' | 'json' | 'parquet' }  // Remote file
  | { fetch: () => Promise<Record<string, unknown>[]> }    // Async callback
  | File                                                    // Browser File object
```

| Variant | Description | Example |
|---------|-------------|---------|
| Array of objects | Data already in memory, loaded directly | `{ orders: [{ id: 1, total: 99 }] }` |
| URL object | Fetches remote file. Parquet uses HTTP range requests. | `{ sales: { url: '/data/sales.parquet' } }` |
| Fetch callback | You call your own API, return rows | `{ users: { fetch: () => api.getUsers() } }` |
| File | Browser File API (drag & drop, file input) | `{ upload: fileFromInput }` |

#### Usage

```tsx
<DuckUIProvider
  data={{
    orders: [
      { id: 1, product: 'Widget', total: 99.50 },
      { id: 2, product: 'Gadget', total: 149.00 },
    ],
    sales: { url: '/data/sales.parquet', format: 'parquet' },
    users: { fetch: () => fetch('/api/users').then(r => r.json()) },
  }}
  theme={{ primaryColor: '#4f46e5' }}
  onReady={() => console.log('Ready')}
  onError={(err) => console.error(err)}
>
  {children}
</DuckUIProvider>
```

---

## Hooks

### useDuckUI()

```ts
function useDuckUI(): { query: (sql: string) => Promise<QueryResult>; status: Status }
```

Public hook for executing SQL queries and checking engine status.

| Return | Type | Description |
|--------|------|-------------|
| `query` | `(sql: string) => Promise<QueryResult>` | Execute any SQL against the in-browser DuckDB |
| `status` | `'idle' \| 'loading' \| 'ready' \| 'error'` | Engine initialization status |

```tsx
import { useDuckUI } from '@duck_ui/embed'

function MyComponent() {
  const { query, status } = useDuckUI()

  if (status !== 'ready') return <p>Loading...</p>

  const handleClick = async () => {
    const result = await query('SELECT count(*) as n FROM orders')
    console.log(result.rows) // [{ n: 42 }]
  }

  return <button onClick={handleClick}>Count orders</button>
}
```

### useTheme()

```ts
function useTheme(): DuckTheme
```

Returns the merged theme object (defaults + user overrides).

```tsx
import { useTheme } from '@duck_ui/embed'

const theme = useTheme()
// theme.primaryColor, theme.background, theme.palette, etc.
```

---

## Components

### Chart

SQL-driven chart component. Supports line, bar, area, and scatter types.

```tsx
import { Chart } from '@duck_ui/embed'
```

#### ChartProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sql` | `string` | **required** | SQL query to execute |
| `type` | `'line' \| 'bar' \| 'area' \| 'scatter'` | `'line'` | Chart type |
| `height` | `number` | `300` | Chart height in pixels |
| `width` | `number` | auto (fills container) | Chart width in pixels |
| `title` | `string` | -- | Chart title |
| `colors` | `string[]` | theme palette | Series colors |
| `legend` | `boolean` | `true` | Show legend |
| `axes` | `{ x?: AxisOptions; y?: AxisOptions }` | -- | Axis labels and formatting |
| `tooltip` | `boolean \| TooltipOptions` | `true` | Tooltip config |
| `className` | `string` | -- | CSS class |
| `tableName` | `string` | -- | Table name for filter injection |
| `onPointClick` | `(seriesIdx, dataIdx, value) => void` | -- | Point click handler |
| `onRangeSelect` | `(min, max) => void` | -- | Range selection handler |

**Data transformation:** First column → x-axis, remaining columns → y-series.

```tsx
<Chart
  sql="SELECT month, SUM(revenue) AS rev FROM sales GROUP BY 1 ORDER BY 1"
  type="bar"
  height={350}
  axes={{ y: { format: 'currency' } }}
/>
```

### DataTable

SQL-driven paginated table with sorting and column resizing.

```tsx
import { DataTable } from '@duck_ui/embed'
```

#### DataTableProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sql` | `string` | **required** | SQL query |
| `pageSize` | `number` | `25` | Rows per page |
| `sortable` | `boolean` | `true` | Enable column sorting |
| `resizable` | `boolean` | `true` | Enable column resizing |
| `striped` | `boolean` | `true` | Alternate row colors |
| `maxHeight` | `number \| string` | -- | Max scroll container height |
| `className` | `string` | -- | CSS class |
| `tableName` | `string` | -- | Table name for filter injection |

Pagination and sorting happen at the SQL level — only the visible page is loaded.

```tsx
<DataTable sql="SELECT * FROM orders" pageSize={50} sortable />
```

### KPICard

Single-value metric card with optional comparison and sparkline.

```tsx
import { KPICard } from '@duck_ui/embed'
```

#### KPICardProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sql` | `string` | **required** | Query returning a single value (first column, first row) |
| `label` | `string` | **required** | KPI label |
| `format` | `'currency' \| 'percent' \| 'number' \| 'compact' \| (v: number) => string` | -- | Value formatter |
| `currency` | `string` | `'USD'` | Currency code (when format is `'currency'`) |
| `compareSql` | `string` | -- | Previous period value for % change |
| `compareLabel` | `string` | -- | Label for comparison (e.g., "vs 2024") |
| `sparklineSql` | `string` | -- | Time series query for inline trend line |
| `className` | `string` | -- | CSS class |
| `tableName` | `string` | -- | Table name for filter injection |

```tsx
<KPICard
  sql="SELECT SUM(total) AS value FROM orders"
  label="Total Revenue"
  format="currency"
  currency="USD"
  compareSql="SELECT SUM(total) AS value FROM orders WHERE year = 2024"
  compareLabel="vs 2024"
  sparklineSql="SELECT month, SUM(total) FROM orders GROUP BY 1 ORDER BY 1"
/>
```

### ExportButton

CSV/JSON export button.

```tsx
import { ExportButton } from '@duck_ui/embed'
```

#### ExportButtonProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `QueryResult \| null` | **required** | Data to export |
| `format` | `'csv' \| 'json'` | `'csv'` | Export format |
| `fileName` | `string` | `'export'` | Download file name (without extension) |
| `label` | `string` | `'Export'` | Button label |
| `className` | `string` | -- | CSS class |

Disabled when `data` is null or has zero rows.

```tsx
const { data } = useQuery('SELECT * FROM sales')
<ExportButton data={data} format="csv" fileName="sales-report" />
```

---

## Layout

### Dashboard

CSS Grid layout container with responsive breakpoints. Composes Chart, DataTable, KPICard, and FilterBar into a themed dashboard.

```tsx
import { Dashboard } from '@duck_ui/embed'
```

#### DashboardProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | **required** | Dashboard.Panel children |
| `columns` | `1 \| 2 \| 3 \| 4` | `2` | Grid columns at full width |
| `gap` | `number` | `16` | Gap between panels (px) |
| `padding` | `number` | `24` | Container padding (px) |
| `className` | `string` | -- | CSS class |

#### Dashboard.Panel

Grid item wrapper.

#### DashboardPanelProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | **required** | Panel content |
| `span` | `number` | `1` | Column span |
| `rowSpan` | `number` | `1` | Row span |
| `className` | `string` | -- | CSS class |

**Responsive breakpoints** (auto-reduces columns based on container width):
- `< 480px` → 1 column
- `< 768px` → max 2 columns
- `< 1024px` → max 3 columns
- `>= 1024px` → columns as specified

```tsx
<DuckUIProvider data={{ orders }}>
  <Dashboard columns={3} gap={16}>
    <Dashboard.Panel span={2}>
      <FilterBar auto="orders" />
    </Dashboard.Panel>
    <Dashboard.Panel>
      <KPICard sql="SELECT count(*) as value FROM orders" label="Orders" />
    </Dashboard.Panel>
    <Dashboard.Panel span={2}>
      <Chart sql="SELECT status, count(*) FROM orders GROUP BY 1" type="bar" />
    </Dashboard.Panel>
    <Dashboard.Panel>
      <Chart sql="SELECT date, sum(total) FROM orders GROUP BY 1" type="line" />
    </Dashboard.Panel>
    <Dashboard.Panel span={3}>
      <DataTable sql="SELECT * FROM orders" pageSize={20} sortable />
    </Dashboard.Panel>
  </Dashboard>
</DuckUIProvider>
```

---

## Filters

All filter components integrate with the DuckUIProvider filter system. When a filter value changes, all queries automatically re-execute with new WHERE clauses injected.

### FilterBar

Container for filter components. Shows "Clear filters" button when any filter is active.

```tsx
import { FilterBar } from '@duck_ui/embed'
```

#### FilterBarProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `filters` | `FilterConfig[]` | -- | Manual filter configuration |
| `auto` | `string` | -- | Auto-detect filters from table schema |
| `source` | `string` | -- | Table to read distinct values from |
| `className` | `string` | -- | CSS class |

**Auto mode:** Pass a table name and filters are detected from column types.

**Manual mode:** Pass an array of `FilterConfig` objects.

```tsx
// Auto mode
<FilterBar auto="orders" />

// Manual mode
<FilterBar filters={[
  { column: 'status', type: 'select' },
  { column: 'total', type: 'range', min: 0, max: 1000 },
  { column: 'created_at', type: 'daterange' },
]} source="orders" />
```

#### FilterConfig

```ts
interface FilterConfig {
  column: string
  type: 'select' | 'multiselect' | 'range' | 'daterange'
  label?: string
  min?: number        // For range
  max?: number        // For range
  step?: number       // For range
  options?: string[]  // For select (explicit options)
}
```

### SelectFilter

Searchable single-select dropdown with keyboard navigation.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `column` | `string` | **required** | Column to filter |
| `options` | `string[]` | -- | Explicit options |
| `source` | `string` | -- | Table to query DISTINCT values from |
| `label` | `string` | -- | Display label |
| `placeholder` | `string` | `'All'` | Placeholder text |

### MultiSelectFilter

Toggle buttons for multi-select.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `column` | `string` | **required** | Column to filter |
| `options` | `string[]` | **required** | Available options |
| `label` | `string` | -- | Display label |

### RangeFilter

Dual-thumb numeric range slider.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `column` | `string` | **required** | Column to filter |
| `min` | `number` | **required** | Range minimum |
| `max` | `number` | **required** | Range maximum |
| `step` | `number` | `1` | Step increment |
| `label` | `string` | -- | Display label |

### DateRangeFilter

Calendar-based date range picker.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `column` | `string` | **required** | Column to filter |
| `label` | `string` | -- | Display label |

### Filter SQL Generation

| FilterValue | Generated SQL |
|-------------|--------------|
| `'North'` | `"col" = 'North'` |
| `42` | `"col" = 42` |
| `true` | `"col" = true` |
| `['A', 'B']` | `"col" IN ('A', 'B')` |
| `{ min: 10, max: 100 }` | `"col" >= 10 AND "col" <= 100` |
| `{ start: '2024-01-01', end: '2024-12-31' }` | `"col" BETWEEN '2024-01-01' AND '2024-12-31'` |
| `null` | _(filter cleared)_ |

---

## Types

All core types (`QueryResult`, `ColumnInfo`, `FilterValue`, `DuckTheme`, `ChartTheme`, `AxisOptions`) are defined in `@duck_ui/core` and re-exported from `@duck_ui/embed`. See the [`@duck_ui/core` API Reference](./core.md#types) for full type definitions.

### Quick Reference

```ts
import type { QueryResult, FilterValue, DuckTheme } from '@duck_ui/embed'
// These are re-exports from @duck_ui/core
```

### Built-in Themes

```ts
import { lightTheme, darkTheme } from '@duck_ui/embed'
```

| Property | lightTheme | darkTheme |
|----------|-----------|-----------|
| background | `#ffffff` | `#111827` |
| textColor | `#374151` | `#e5e7eb` |
| primaryColor | `#2563eb` | `#60a5fa` |
| surfaceColor | `#f9fafb` | `#1f2937` |
| borderColor | `#e5e7eb` | `#374151` |
