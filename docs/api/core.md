# @duck_ui/core API Reference

Pure JavaScript engine and chart factories. Zero framework dependencies. This is the foundation that `@duck_ui/embed` (React) and `@duck_ui/elements` (Web Components) build on.

```bash
bun add @duck_ui/core @duckdb/duckdb-wasm
```

---

## Table of Contents

- [DuckUI Class](#duckui-class)
- [Engine](#engine)
- [Chart Factories](#chart-factories)
- [Utilities](#utilities)
- [Types](#types)

---

## DuckUI Class

High-level imperative API that wraps the engine layer. Use this when you want full control without React or Web Components.

```ts
import { DuckUI } from '@duck_ui/core'
```

### Constructor

```ts
const ui = new DuckUI()
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `status` | `'idle' \| 'ready' \| 'error'` | Current engine status |
| `theme` | `DuckTheme` | Active theme object |

### Methods

#### init(data)

Initialize DuckDB-WASM and load data into tables.

```ts
await ui.init(data: Record<string, DataInput>)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `Record<string, DataInput>` | Key = table name, value = data source |

```ts
await ui.init({
  orders: [{ id: 1, product: 'Widget', total: 99.50 }],
  sales: { url: '/data/sales.parquet', format: 'parquet' },
})
```

#### query(sql)

Execute a SQL query against the in-browser DuckDB instance.

```ts
const result = await ui.query(sql: string): Promise<QueryResult>
```

```ts
const result = await ui.query('SELECT count(*) as n FROM orders')
console.log(result.rows)           // [{ n: 1 }]
console.log(result.executionTime)  // 2.4 (ms)
```

#### setFilter(column, value)

Set a filter. Active filters are injected as WHERE clauses into subsequent queries.

```ts
ui.setFilter(column: string, value: FilterValue)
```

```ts
ui.setFilter('status', 'shipped')
ui.setFilter('total', { min: 50, max: 200 })
ui.setFilter('region', ['North', 'South'])
```

#### clearFilters()

Remove all active filters.

```ts
ui.clearFilters()
```

#### getSchema(tableName)

Inspect a table's column names and types.

```ts
const schema = await ui.getSchema(tableName: string): Promise<TableSchema | null>
```

```ts
const schema = await ui.getSchema('orders')
// { tableName: 'orders', columns: [{ name: 'id', type: 'INTEGER', nullable: false }, ...] }
```

#### destroy()

Shut down the DuckDB instance and release all resources.

```ts
await ui.destroy()
```

### Full Example

```ts
import { DuckUI } from '@duck_ui/core'

const ui = new DuckUI()
await ui.init({
  orders: [
    { id: 1, product: 'Widget', status: 'shipped', total: 99.50 },
    { id: 2, product: 'Gadget', status: 'pending', total: 149.00 },
  ],
})

console.log(ui.status) // 'ready'

const result = await ui.query('SELECT status, SUM(total) AS rev FROM orders GROUP BY 1')
console.log(result.rows)

ui.setFilter('status', 'shipped')
const filtered = await ui.query('SELECT * FROM orders')
console.log(filtered.rows) // only shipped orders

ui.clearFilters()
await ui.destroy()
```

---

## Engine

Lower-level building blocks. Most users should prefer the `DuckUI` class above.

### DuckDBManager

```ts
import { DuckDBManager } from '@duck_ui/core'
```

Initializes and manages the DuckDB-WASM instance and Web Worker.

| Method | Description |
|--------|-------------|
| `initialize()` | Fetch WASM bundle, create worker, instantiate DuckDB |
| `getDatabase()` | Returns the `AsyncDuckDB` instance |
| `terminate()` | Shut down the worker |

### ConnectionPool

```ts
import { ConnectionPool } from '@duck_ui/core'
```

Manages a pool of DuckDB connections for concurrent query execution.

| Method | Description |
|--------|-------------|
| `acquire()` | Get a connection from the pool |
| `release(conn)` | Return a connection to the pool |
| `drainAll()` | Close all connections |

### QueryExecutor

```ts
import { QueryExecutor } from '@duck_ui/core'
```

Executes SQL and returns typed `QueryResult` objects with value coercion (BigInt to Number, Date to ISO string, etc.).

### QueryCache

```ts
import { QueryCache } from '@duck_ui/core'
```

LRU cache for query results. Keyed by SQL string.

### FilterInjector

```ts
import { FilterInjector } from '@duck_ui/core'
```

Wraps user SQL as a subquery and appends WHERE clauses based on active filters.

```ts
FilterInjector.inject(sql, filters, tableName)
// SELECT * FROM (SELECT * FROM orders) AS _filtered WHERE "status" = 'shipped'
```

### SchemaInspector

```ts
import { SchemaInspector } from '@duck_ui/core'
```

Reads column metadata from DuckDB tables.

---

## Chart Factories

Framework-agnostic chart creation functions. These power both the React `<Chart>` component and the `<duck-chart>` Web Component.

### createChart(container, data, options)

Create a uPlot chart instance and mount it to a DOM element.

```ts
import { createChart, queryResultToChartData } from '@duck_ui/core'

const result = await ui.query('SELECT month, SUM(total) FROM orders GROUP BY 1 ORDER BY 1')
const chartData = queryResultToChartData(result)
const chart = createChart(container, chartData.data, {
  type: 'bar',
  height: 300,
  width: 600,
})
```

### buildChartOptions(type, data, options)

Build a uPlot options object without mounting. Useful for custom rendering.

```ts
import { buildChartOptions } from '@duck_ui/core'

const opts = buildChartOptions('line', chartData, { height: 300 })
```

### queryResultToChartData(result)

Transform a `QueryResult` into the format expected by chart factories. First column becomes the x-axis, remaining columns become y-series.

```ts
import { queryResultToChartData } from '@duck_ui/core'

const chartData = queryResultToChartData(result)
// { data: AlignedData, series: SeriesConfig[] }
```

### drawPie(canvas, data, options)

Render a pie/donut chart to a canvas element.

```ts
import { drawPie } from '@duck_ui/core'

drawPie(canvasElement, { labels: ['A', 'B'], values: [60, 40] }, { donut: true })
```

### createSparkline(container, values, options)

Render a minimal inline sparkline chart.

```ts
import { createSparkline } from '@duck_ui/core'

createSparkline(element, [10, 20, 15, 30, 25], { width: 120, height: 32 })
```

---

## Utilities

```ts
import { formatCellValue, resolveFormatter, exportToFile, observeSize } from '@duck_ui/core'
```

| Function | Description |
|----------|-------------|
| `formatCellValue(value, format)` | Format a value for display (`'currency'`, `'percent'`, `'compact'`, etc.) |
| `resolveFormatter(format)` | Return a formatting function from a format string or passthrough custom functions |
| `exportToFile(data, format, fileName)` | Trigger a CSV or JSON download from query result data |
| `observeSize(element, callback)` | ResizeObserver wrapper that calls back with `{ width, height }` |

---

## Types

### DataInput

```ts
type DataInput =
  | Record<string, unknown>[]                              // Array of objects
  | { url: string; format?: 'csv' | 'json' | 'parquet' }  // Remote file
  | { fetch: () => Promise<Record<string, unknown>[]> }    // Async callback
  | File                                                    // Browser File object
```

### QueryResult

```ts
interface QueryResult {
  rows: Record<string, unknown>[]
  columns: ColumnInfo[]
  rowCount: number
  executionTime: number  // milliseconds
}
```

### ColumnInfo

```ts
interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
}
```

### TableSchema

```ts
interface TableSchema {
  tableName: string
  columns: ColumnInfo[]
}
```

### FilterValue

```ts
type FilterValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | { min: number; max: number }
  | { start: string; end: string }
  | null
```

### DuckTheme

```ts
interface DuckTheme extends ChartTheme {
  surfaceColor: string
  borderColor: string
  hoverColor: string
  primaryColor: string
  errorColor: string
  errorBgColor: string
  mutedTextColor: string
  stripeColor: string
  successColor: string
  successBgColor: string
  dangerColor: string
  dangerBgColor: string
}
```

### ChartTheme

```ts
interface ChartTheme {
  background: string
  textColor: string
  gridColor: string
  axisColor: string
  palette: string[]
  fontFamily: string
  fontSize: number
}
```

### AxisOptions

```ts
interface AxisOptions {
  label?: string
  format?: 'number' | 'currency' | 'percent' | 'date' | ((value: number) => string)
}
```

### Built-in Themes

```ts
import { lightTheme, darkTheme } from '@duck_ui/core'
```
