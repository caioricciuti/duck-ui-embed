# @duck_ui/embed

Drop-in SQL-powered React components backed by DuckDB-WASM. One package. One provider. Pass data, write SQL, get dashboards.

## Install

```bash
npm install @duck_ui/embed @duckdb/duckdb-wasm
```

> DuckDB-WASM bundles are auto-loaded from jsDelivr CDN at runtime — no manual WASM setup required.

## Quick Start

```tsx
import { DuckUIProvider, Chart, DataTable, KPICard, FilterBar } from '@duck_ui/embed'

const orders = [
  { id: 1, product: 'Widget', status: 'shipped', total: 99.50 },
  { id: 2, product: 'Gadget', status: 'pending', total: 149.00 },
]

function Dashboard() {
  return (
    <DuckUIProvider data={{ orders }}>
      <KPICard
        sql="SELECT sum(total) as value FROM orders"
        label="Total Revenue"
        format="currency"
        currency="USD"
      />
      <FilterBar auto="orders" />
      <Chart
        sql="SELECT product, sum(total) as revenue FROM orders GROUP BY 1"
        type="bar"
      />
      <DataTable sql="SELECT * FROM orders" pageSize={10} sortable />
    </DuckUIProvider>
  )
}
```

## API Reference

### DuckUIProvider

The single provider that initializes DuckDB-WASM, loads data, and provides context to all child components.

```tsx
<DuckUIProvider
  data={{ orders, products }}   // Record<string, DataInput> — key = table name
  license="DUCK-xxx.yyy"       // optional — unlocks pro features
  theme={{ palette: [...] }}    // optional — Partial<DuckTheme>
  onReady={() => {}}            // optional — fires when DuckDB + data are loaded
  onError={(err) => {}}         // optional — fires on init/load errors
>
  {children}
</DuckUIProvider>
```

### DataInput

The object key becomes the DuckDB table name. The value determines how data is loaded:

```ts
type DataInput =
  | Record<string, unknown>[]                              // array of objects → table
  | { url: string; format?: 'csv' | 'json' | 'parquet' }  // remote file
  | { fetch: () => Promise<Record<string, unknown>[]> }    // async callback
  | File                                                    // browser File object
```

**Parquet files** use HTTP range requests — DuckDB only fetches the row groups it needs.

### Hooks

```tsx
import { useDuckUI, useTheme, useLicense } from '@duck_ui/embed'

// Public query hook
const { query, status } = useDuckUI()
// status: 'idle' | 'loading' | 'ready' | 'error'
const result = await query("SELECT count(*) as n FROM orders")
// result: { rows, columns, rowCount, executionTime }

// Theme hook
const theme = useTheme()

// License hook
const { isPro, tier, payload } = useLicense()
```

### Components

#### Chart

Renders bar, line, area, or scatter charts from a SQL query.

```tsx
<Chart sql="SELECT status, count(*) FROM orders GROUP BY 1" type="bar" height={300} />
```

#### DataTable

Paginated, sortable table with column resizing.

```tsx
<DataTable sql="SELECT * FROM orders" pageSize={20} sortable resizable />
```

#### KPICard

Single-value card with optional comparison and sparkline.

```tsx
<KPICard
  sql="SELECT sum(total) as value FROM orders"
  label="Revenue"
  format="currency"
  currency="USD"
  compareSql="SELECT sum(total) as value FROM orders WHERE year = 2023"
  compareLabel="vs 2023"
  sparklineSql="SELECT month, sum(total) FROM orders GROUP BY 1 ORDER BY 1"
/>
```

#### FilterBar

Declarative filters — auto-detect from schema or configure manually.

```tsx
// Auto mode
<FilterBar auto="orders" />

// Manual config
<FilterBar filters={[
  { column: 'status', type: 'select' },
  { column: 'total', type: 'range', min: 0, max: 1000 },
  { column: 'created_at', type: 'daterange' },
]} source="orders" />
```

#### ExportButton

CSV/JSON export (requires Pro license).

```tsx
<ExportButton data={queryResult} format="csv" fileName="orders" />
```

### Theming

Pass a partial `DuckTheme` to customize all component colors:

```tsx
<DuckUIProvider
  data={{ orders }}
  theme={{
    primaryColor: '#8b5cf6',
    background: '#0f172a',
    textColor: '#e2e8f0',
    borderColor: '#334155',
    surfaceColor: '#1e293b',
    palette: ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444'],
  }}
>
```

A built-in `darkTheme` is available:

```tsx
import { darkTheme } from '@duck_ui/embed'
<DuckUIProvider data={{ orders }} theme={darkTheme}>
```

### Pro Features

Without a `license` prop, the free tier is active:
- "Powered by Duck-UI" badge shown
- Export is disabled

With a valid license:
- Badge removed
- Export enabled
- Future: groupBy, pivot, drillDown, row-level security

## Browser Compatibility

Requires browsers with:
- **WebAssembly** support
- **Web Workers** support
- **ES2020+** (Chrome 80+, Firefox 78+, Safari 14+, Edge 80+)

## License

Apache-2.0
