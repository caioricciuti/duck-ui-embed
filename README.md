# Duck-UI Embed

Drop-in SQL-powered React components backed by DuckDB-WASM. One package. One provider. Pass data, write SQL, get dashboards.

## Documentation

Full documentation: **[docs/](./docs/README.md)**

- [Getting Started](./docs/getting-started.md) -- install and first dashboard
- [Data Sources](./docs/guides/data-sources.md) -- files, URLs, fetch callbacks
- [Filters](./docs/guides/filters.md) -- reactive filter system
- [Charts](./docs/guides/charts.md) -- all chart types and customization
- [API Reference](./docs/api/core.md) -- full API reference

## Quick Start

```bash
bun add @duck_ui/embed @duckdb/duckdb-wasm
```

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

## Data Sources

```tsx
// Array of objects (loaded directly into DuckDB)
<DuckUIProvider data={{ orders: [...] }}>

// Remote file (CSV, JSON, or Parquet)
<DuckUIProvider data={{ sales: { url: '/data/sales.parquet', format: 'parquet' } }}>

// Async fetch callback (call your own API)
<DuckUIProvider data={{ users: { fetch: () => api.getUsers() } }}>

// Browser File object (drag & drop, file picker)
<DuckUIProvider data={{ upload: fileFromInput }}>
```

**Parquet files** use HTTP range requests — DuckDB only fetches the row groups the query needs.

## Components

### DuckUIProvider

Initializes DuckDB-WASM, loads data, provides context to all children.

```tsx
<DuckUIProvider
  data={{ orders, products }}   // Record<string, DataInput>
  theme={{ palette: [...] }}    // optional — Partial<DuckTheme>
  onReady={() => {}}            // optional
  onError={(err) => {}}         // optional
>
  {children}
</DuckUIProvider>
```

### Hooks

```tsx
const { query, status } = useDuckUI()
const result = await query("SELECT count(*) as n FROM orders")

const theme = useTheme()
```

### Chart / DataTable / KPICard / FilterBar / ExportButton

```tsx
<Chart sql="SELECT month, revenue FROM sales GROUP BY 1" type="line" height={300} />
<DataTable sql="SELECT * FROM sales" pageSize={25} sortable />
<KPICard sql="SELECT SUM(revenue) AS value FROM sales" label="Revenue" />
<FilterBar auto="orders" />
<ExportButton data={queryResult} format="csv" fileName="orders" />
```

## Development

```bash
bun install          # install deps
bun run build        # build via turbo
bun run dev          # dev mode (watch)
bun run test         # vitest
bun run lint         # tsc --noEmit
```

## Architecture

```
packages/embed/src/
├── provider/       # DuckUIProvider, context, hooks, filter state
├── engine/         # DuckDB init, connection pool, query executor, cache, filters, schema
├── components/     # Chart, DataTable, KPICard, FilterBar, ExportButton, filters
└── charts/         # uPlot wrappers, presets, plugins, theme
```

## License

Apache-2.0
