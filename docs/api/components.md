# @duck_ui/components API Reference

Complete API reference for the `@duck_ui/components` package -- the React component layer for Duck-UI Embed.

---

## Table of Contents

- [Provider](#provider)
  - [DuckProvider](#duckprovider)
  - [DuckContextValue](#duckcontextvalue)
- [Hooks](#hooks)
  - [useDuck](#useduck)
  - [useQuery](#usequerysql-options)
  - [usePaginatedQuery](#usepaginatedquerysql-options)
  - [useSchema](#useschematablename)
- [Components](#components)
  - [DataTable](#datatable)
  - [Chart](#chart)
  - [KPICard](#kpicard)
  - [ExportButton](#exportbutton)
- [Filters](#filters)
  - [FilterBar](#filterbar)
  - [SelectFilter](#selectfilter)
  - [MultiSelectFilter](#multiselectfilter)
  - [DateRangeFilter](#daterangefilter)
  - [RangeFilter](#rangefilter)
- [Shared Components](#shared-components)
  - [Loading](#loading)
  - [ErrorDisplay](#errordisplay)
  - [EmptyState](#emptystate)

---

## Provider

### DuckProvider

Initializes DuckDB-WASM and provides context to all child components. Every Duck-UI component and hook must be rendered inside a `<DuckProvider>`.

**Props:** `{ config: DuckConfig, children: ReactNode }`

#### DuckConfig

```ts
interface DuckConfig {
  sources?: SourceConfig[]       // Data sources to load on init
  memoryLimit?: number           // DuckDB memory limit in bytes (default: 256MB)
  maxConnections?: number        // Connection pool max size (default: 4)
}
```

#### Usage

```tsx
import { DuckProvider } from '@duck_ui/components'

function App() {
  return (
    <DuckProvider config={{
      sources: [{ name: 'sales', url: '/data/sales.parquet' }],
      memoryLimit: 512 * 1024 * 1024,
      maxConnections: 4,
    }}>
      {/* All Duck-UI components go here */}
    </DuckProvider>
  )
}
```

---

### DuckContextValue

The shape of the context object exposed by `<DuckProvider>` and consumed via the `useDuck()` hook.

```ts
interface DuckContextValue {
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
```

| Property | Type | Description |
|----------|------|-------------|
| `engine` | `DuckDBManager \| null` | The underlying DuckDB-WASM manager instance |
| `executor` | `QueryExecutor \| null` | Runs SQL queries against the engine |
| `inspector` | `SchemaInspector \| null` | Introspects table schemas and metadata |
| `registry` | `DataSourceRegistry \| null` | Manages registered data sources |
| `cache` | `QueryCache \| null` | In-memory query result cache |
| `status` | `'idle' \| 'loading' \| 'ready' \| 'error'` | Engine initialization status |
| `error` | `Error \| null` | Initialization error, if any |
| `filters` | `Record<string, FilterValue>` | Currently active filters keyed by column name |
| `setFilter` | `(column: string, value: FilterValue) => void` | Set or update a filter for a column |
| `clearFilters` | `() => void` | Remove all active filters |
| `filterVersion` | `number` | Monotonically increasing counter; increments on every filter change |

---

## Hooks

### useDuck()

```ts
function useDuck(): DuckContextValue
```

Access engine status, filters, and all context objects. Must be called inside a `<DuckProvider>`. Throws if used outside the provider tree.

#### Usage

```tsx
import { useDuck } from '@duck_ui/components'

function StatusBar() {
  const { status, error, filters, clearFilters } = useDuck()

  if (status === 'loading') return <p>Initializing...</p>
  if (status === 'error') return <p>Error: {error?.message}</p>

  return (
    <div>
      <span>Engine ready</span>
      {Object.keys(filters).length > 0 && (
        <button onClick={clearFilters}>Clear filters</button>
      )}
    </div>
  )
}
```

---

### useQuery(sql, options?)

```ts
function useQuery(sql: string, options?: UseQueryOptions): UseQueryResult
```

Execute a SQL query against the DuckDB engine. Automatically re-executes when the SQL string changes or when active filters change (unless `noFilter` is set).

#### UseQueryOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `tableName` | `string` | first registered source | Table name for filter injection |
| `noCache` | `boolean` | `false` | Bypass the query cache |
| `noFilter` | `boolean` | `false` | Skip filter injection (e.g., for `DISTINCT` queries populating filter dropdowns) |

#### UseQueryResult

| Property | Type | Description |
|----------|------|-------------|
| `data` | `QueryResult \| null` | Query results (`rows`, `columns`, `rowCount`, `executionTime`) |
| `loading` | `boolean` | `true` while the query is executing |
| `error` | `Error \| null` | Query error, if any |
| `refetch` | `() => void` | Re-execute the query manually |
| `effectiveSql` | `string` | The actual SQL sent to DuckDB, with filters injected |

#### Usage

```tsx
import { useQuery } from '@duck_ui/components'

function TotalRevenue() {
  const { data, loading, error } = useQuery(
    'SELECT SUM(revenue) AS total FROM sales'
  )

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  return <p>Total: ${data?.rows[0]?.total}</p>
}
```

---

### usePaginatedQuery(sql, options)

```ts
function usePaginatedQuery(sql: string, options: UsePaginatedQueryOptions): UsePaginatedQueryResult
```

Execute a paginated SQL query. Internally runs a `COUNT(*)` query and a `LIMIT/OFFSET` query in parallel. The count result is cached across page changes.

#### UsePaginatedQueryOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `page` | `number` | **required** | 0-based page index |
| `pageSize` | `number` | **required** | Rows per page |
| `orderBy` | `{ column: string; direction: 'asc' \| 'desc' }` | -- | SQL `ORDER BY` clause |
| `tableName` | `string` | first registered source | Table name for filter injection |
| `noFilter` | `boolean` | `false` | Skip filter injection |

#### UsePaginatedQueryResult

| Property | Type | Description |
|----------|------|-------------|
| `rows` | `Record<string, unknown>[]` | Current page rows |
| `columns` | `ColumnInfo[]` | Column metadata |
| `totalRows` | `number` | Total row count (cached) |
| `loading` | `boolean` | `true` while either query is executing |
| `error` | `Error \| null` | Error, if any |
| `refetch` | `() => void` | Re-execute both count and page queries |

#### Usage

```tsx
import { useState } from 'react'
import { usePaginatedQuery } from '@duck_ui/components'

function OrdersTable() {
  const [page, setPage] = useState(0)
  const { rows, columns, totalRows, loading } = usePaginatedQuery(
    'SELECT * FROM orders',
    { page, pageSize: 25, orderBy: { column: 'date', direction: 'desc' } }
  )

  const totalPages = Math.ceil(totalRows / 25)

  return (
    <div>
      <table>{/* render rows */}</table>
      <span>Page {page + 1} of {totalPages}</span>
      <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</button>
      <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
    </div>
  )
}
```

---

### useSchema(tableName?)

```ts
function useSchema(tableName?: string): {
  tables: string[]
  schema: TableSchema | null
  loading: boolean
}
```

Inspect database schema. When called without arguments, returns the list of all registered tables. When called with a table name, also returns the column-level schema for that table.

#### Usage

```tsx
import { useSchema } from '@duck_ui/components'

function SchemaExplorer() {
  const { tables, loading } = useSchema()
  const { schema } = useSchema('sales')

  if (loading) return <p>Loading schema...</p>

  return (
    <div>
      <h3>Tables</h3>
      <ul>{tables.map(t => <li key={t}>{t}</li>)}</ul>

      <h3>Sales columns</h3>
      <ul>{schema?.columns.map(c => <li key={c.name}>{c.name}: {c.type}</li>)}</ul>
    </div>
  )
}
```

---

## Components

### DataTable

SQL-driven paginated data table with sorting and column resizing. All data fetching, pagination, and sorting happen at the SQL level -- only the visible page of data is loaded into the browser.

#### Props (DataTableProps)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sql` | `string` | **required** | SQL query |
| `pageSize` | `number` | `25` | Initial rows per page. Options: `10`, `25`, `50`, `100`, `250` |
| `sortable` | `boolean` | `true` | Enable column header sorting |
| `resizable` | `boolean` | `true` | Enable column resize by dragging |
| `className` | `string` | -- | CSS class for root element |
| `tableName` | `string` | -- | Table name for filter injection |
| `striped` | `boolean` | `true` | Alternate row background colors |
| `maxHeight` | `number \| string` | -- | Max height for scroll container |

#### Features

- **SQL-level pagination** -- uses `LIMIT/OFFSET`; only the visible page is loaded
- **SQL-level sorting** -- click column headers to cycle: none -> asc -> desc -> none
- **Column resizing** -- drag column borders; double-click to reset; min: 60px, max: 600px
- **Page size selector** -- dropdown to change rows per page at runtime
- **Automatic cell formatting:**
  - `null` -> `'--'`
  - Numbers -> `toLocaleString` (max 6 decimal places)
  - Dates -> `toLocaleDateString`
- **Loading overlay** during page transitions
- Built-in `<Loading>`, `<ErrorDisplay>`, and `<EmptyState>` states

#### Usage

```tsx
import { DataTable } from '@duck_ui/components'

<DataTable
  sql="SELECT * FROM orders"
  pageSize={50}
  sortable
  resizable
  striped
  tableName="orders"
  maxHeight="600px"
/>
```

---

### Chart

SQL-driven chart component. Wraps `UChart` from `@duck_ui/charts` and handles data fetching and transformation automatically.

#### Props (ChartProps)

All `UChartProps` (`type`, `height`, `colors`, `axes`, `theme`, `tooltip`, etc.) **plus:**

| Prop | Type | Description |
|------|------|-------------|
| `sql` | `string` | SQL query to execute |
| `className` | `string` | CSS class |
| `tableName` | `string` | Table name for filter injection |

#### Data Transformation

- **First column** -> x-axis (strings become labels with numeric indices; numbers are used directly)
- **Remaining columns** -> y-series (non-numeric values are coerced to `0`)

#### Usage

```tsx
import { Chart } from '@duck_ui/components'

<Chart
  sql="SELECT month, revenue, cost FROM sales GROUP BY month ORDER BY month"
  type="bar"
  height={400}
  tableName="sales"
  colors={['#4f46e5', '#f97316']}
/>
```

---

### KPICard

Single metric display with optional comparison and sparkline trend.

#### Props (KPICardProps)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sql` | `string` | **required** | Query returning a single value (first column, first row) |
| `label` | `string` | **required** | KPI label text |
| `format` | `FormatPreset \| (value: number) => string` | -- | Value formatter |
| `formatOptions` | `KPIFormatOptions` | -- | Formatting options |
| `comparisonSql` | `string` | -- | Previous period value for % change |
| `sparklineSql` | `string` | -- | Time series for inline trend line |
| `className` | `string` | -- | CSS class |
| `tableName` | `string` | -- | Table name for filter injection |

#### FormatPreset

```ts
type FormatPreset = 'currency' | 'percent' | 'number' | 'compact'
```

#### KPIFormatOptions

```ts
interface KPIFormatOptions {
  currency?: string     // Default: 'USD'
  locale?: string       // Default: navigator.language
  decimals?: number     // Decimal places
}
```

#### Comparison and Sparkline

- **Comparison:** shows a colored percentage change badge (green with up arrow for positive change, red with down arrow for negative change)
- **Sparkline:** renders an inline trend line (width: 140px, height: 28px)

#### Usage

```tsx
import { KPICard } from '@duck_ui/components'

<KPICard
  sql="SELECT SUM(revenue) FROM sales WHERE year = 2026"
  label="Total Revenue"
  format="currency"
  formatOptions={{ currency: 'USD', decimals: 0 }}
  comparisonSql="SELECT SUM(revenue) FROM sales WHERE year = 2025"
  sparklineSql="SELECT month, SUM(revenue) FROM sales WHERE year = 2026 GROUP BY month ORDER BY month"
  tableName="sales"
/>
```

---

### ExportButton

Export query results as a CSV or JSON file download.

#### Props (ExportButtonProps)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `QueryResult \| null` | **required** | Data to export |
| `format` | `'csv' \| 'json'` | `'csv'` | Export format |
| `fileName` | `string` | `'export'` | Download file name (without extension) |
| `label` | `string` | `'Export'` | Button label text |
| `className` | `string` | -- | CSS class |

The button is disabled when `data` is `null` or `rowCount === 0`.

#### Usage

```tsx
import { useQuery, ExportButton } from '@duck_ui/components'

function ExportableTable() {
  const { data } = useQuery('SELECT * FROM sales')

  return (
    <div>
      <ExportButton data={data} format="csv" fileName="sales-report" />
      {/* render table */}
    </div>
  )
}
```

---

## Filters

All filter components integrate with the `DuckProvider` filter system. When a filter value changes, `filterVersion` increments and all `useQuery`/`usePaginatedQuery` hooks re-execute with the new filter clauses injected into their SQL.

### FilterBar

Container for filter components. Displays a "Clear filters" button when any filter is active.

**Props:** `{ children: ReactNode, className?: string }`

#### Usage

```tsx
import { FilterBar, SelectFilter, DateRangeFilter } from '@duck_ui/components'

<FilterBar>
  <SelectFilter column="region" source="sales" label="Region" />
  <DateRangeFilter column="order_date" label="Date Range" />
</FilterBar>
```

---

### SelectFilter

Single-select dropdown with search and keyboard navigation.

#### Props (SelectFilterProps)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `column` | `string` | **required** | Column name to filter |
| `options` | `string[]` | -- | Explicit option list |
| `source` | `string` | -- | Table name to query `DISTINCT` values from |
| `label` | `string` | -- | Display label |
| `placeholder` | `string` | `'All'` | Placeholder when no selection |

Either `options` or `source` should be provided. When `source` is used, the component runs:

```sql
SELECT DISTINCT "column" FROM "source" ORDER BY 1
```

This query is executed with `noFilter: true` so that filter state does not restrict the available options.

**Filter output:** produces a `string` FilterValue, which generates `"column" = 'value'`.

#### Usage

```tsx
{/* Options loaded from the database */}
<SelectFilter column="category" source="products" label="Category" />

{/* Explicit options */}
<SelectFilter column="status" options={['active', 'inactive', 'pending']} label="Status" />
```

---

### MultiSelectFilter

Multi-select pill buttons.

#### Props (MultiSelectFilterProps)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `column` | `string` | **required** | Column to filter |
| `options` | `string[]` | **required** | Available options |
| `label` | `string` | -- | Display label |

**Filter output:** produces a `string[]` FilterValue, which generates `"column" IN ('a', 'b')`.

#### Usage

```tsx
<MultiSelectFilter
  column="region"
  options={['North', 'South', 'East', 'West']}
  label="Region"
/>
```

---

### DateRangeFilter

Calendar-based date range picker.

#### Props (DateRangeFilterProps)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `column` | `string` | **required** | Column to filter |
| `label` | `string` | -- | Display label |

#### Calendar UI

- Month/year navigation
- Two-click range selection (click start date, then end date)
- Today indicator
- Live preview on hover

**Filter output:** produces `{ start: string, end: string }` in ISO format (`YYYY-MM-DD`), which generates `"column" BETWEEN 'start' AND 'end'`.

#### Usage

```tsx
<DateRangeFilter column="order_date" label="Order Date" />
```

---

### RangeFilter

Dual-thumb numeric range slider.

#### Props (RangeFilterProps)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `column` | `string` | **required** | Column to filter |
| `min` | `number` | **required** | Range minimum |
| `max` | `number` | **required** | Range maximum |
| `step` | `number` | `1` | Step increment |
| `label` | `string` | -- | Display label |

**Filter output:** produces `{ min: number, max: number }`, which generates `"column" >= min AND "column" <= max`.

The filter auto-clears when the selected range equals `[min, max]`.

#### Usage

```tsx
<RangeFilter column="price" min={0} max={1000} step={10} label="Price Range" />
```

---

## Shared Components

Utility components used internally by `DataTable`, `Chart`, and `KPICard`. Also exported for use in custom layouts.

### Loading

Centered spinner with a customizable message.

**Props:** `{ message?: string }`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `string` | `'Loading...'` | Message displayed below the spinner |

```tsx
import { Loading } from '@duck_ui/components'

<Loading message="Fetching data..." />
```

---

### ErrorDisplay

Red alert box with an error message and optional retry button.

**Props:** `{ error: Error, onRetry?: () => void }`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `error` | `Error` | **required** | The error to display |
| `onRetry` | `() => void` | -- | Callback for the retry button; button hidden if omitted |

```tsx
import { ErrorDisplay } from '@duck_ui/components'

<ErrorDisplay error={error} onRetry={() => refetch()} />
```

---

### EmptyState

Centered placeholder icon with a message, shown when a query returns zero rows.

**Props:** `{ message?: string }`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `string` | `'No data available'` | Message displayed below the icon |

```tsx
import { EmptyState } from '@duck_ui/components'

<EmptyState message="No results match your filters" />
```
