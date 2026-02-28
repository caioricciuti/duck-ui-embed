# Getting Started

Get a SQL-powered analytics dashboard running in 5 minutes. Pick the approach that fits your stack: React, Web Components, or CDN.

## Prerequisites

- Node.js 18+ (not needed for CDN)
- A package manager (bun recommended)

## Installation

### React

```bash
bun add @duck_ui/embed @duckdb/duckdb-wasm
```

### Web Components (Vanilla JS, Vue, Svelte, etc.)

```bash
bun add @duck_ui/elements @duckdb/duckdb-wasm
```

### Core Only (build your own UI)

```bash
bun add @duck_ui/core @duckdb/duckdb-wasm
```

### CDN (no bundler)

```html
<script src="https://unpkg.com/@duck_ui/cdn/dist/duck-ui.min.js"></script>
```

The CDN bundle includes `@duck_ui/core` + `@duck_ui/elements` with DuckDB-WASM. All custom elements are auto-registered.

## Minimal Example (React)

Wrap your app with `DuckUIProvider`, pass data, and drop in components:

```tsx
import { DuckUIProvider, DataTable } from '@duck_ui/embed'

const orders = [
  { id: 1, product: 'Widget', status: 'shipped', total: 99.50 },
  { id: 2, product: 'Gadget', status: 'pending', total: 149.00 },
]

function App() {
  return (
    <DuckUIProvider data={{ orders }}>
      <DataTable sql="SELECT * FROM orders" />
    </DuckUIProvider>
  )
}
```

That's it. DuckDB-WASM boots in a Web Worker, loads the array into a `orders` table, and the `DataTable` renders it with pagination and sorting.

## Minimal Example (Web Components)

```html
<script type="module">
  import { register } from '@duck_ui/elements'
  register()
</script>

<duck-provider id="app">
  <duck-table sql="SELECT * FROM orders" page-size="25" sortable></duck-table>
</duck-provider>

<script type="module">
  document.getElementById('app').load({
    orders: [
      { id: 1, product: 'Widget', status: 'shipped', total: 99.50 },
      { id: 2, product: 'Gadget', status: 'pending', total: 149.00 },
    ],
  })
</script>
```

## Minimal Example (CDN)

No bundler, no npm -- just a `<script>` tag:

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/@duck_ui/cdn/dist/duck-ui.min.js"></script>
</head>
<body>
  <duck-provider id="app">
    <duck-table sql="SELECT * FROM orders" page-size="25" sortable></duck-table>
  </duck-provider>

  <script>
    document.getElementById('app').load({
      orders: [
        { id: 1, product: 'Widget', total: 99.50 },
        { id: 2, product: 'Gadget', total: 149.00 },
      ],
    })
  </script>
</body>
</html>
```

## Minimal Example (Core Only)

Use the imperative `DuckUI` class directly -- no components, no DOM:

```ts
import { DuckUI } from '@duck_ui/core'

const ui = new DuckUI()
await ui.init({ orders: [{ id: 1, product: 'Widget', total: 99.50 }] })

const result = await ui.query('SELECT count(*) as n FROM orders')
console.log(result.rows) // [{ n: 1 }]

await ui.destroy()
```

## Add a Chart

```tsx
import { DuckUIProvider, DataTable, Chart } from '@duck_ui/embed'

function App() {
  return (
    <DuckUIProvider data={{ orders }}>
      <Chart
        sql="SELECT product, SUM(total) AS revenue FROM orders GROUP BY 1"
        type="bar"
        height={300}
      />
      <DataTable sql="SELECT * FROM orders" pageSize={25} />
    </DuckUIProvider>
  )
}
```

The first column of the query result becomes the x-axis, remaining columns become series.

## Add a KPI

```tsx
import { KPICard } from '@duck_ui/embed'

<KPICard
  sql="SELECT SUM(total) AS value FROM orders"
  label="Total Revenue"
  format="currency"
  compareSql="SELECT SUM(total) AS value FROM orders WHERE year = 2024"
  sparklineSql="SELECT month, SUM(total) AS rev FROM orders GROUP BY 1 ORDER BY 1"
/>
```

- `format` accepts `'currency'`, `'percent'`, `'number'`, `'compact'`, or a custom function
- `compareSql` shows a percentage change vs. the comparison value
- `sparklineSql` renders an inline trend line

## Add Filters

Filters are global — they automatically inject WHERE clauses into all queries:

```tsx
import {
  DuckUIProvider, DataTable, Chart, KPICard, FilterBar,
} from '@duck_ui/embed'

function Dashboard() {
  return (
    <DuckUIProvider data={{ orders }}>
      <FilterBar auto="orders" />
      <KPICard sql="SELECT SUM(total) AS value FROM orders" label="Revenue" format="currency" />
      <Chart sql="SELECT product, SUM(total) AS rev FROM orders GROUP BY 1" type="bar" height={300} />
      <DataTable sql="SELECT * FROM orders" pageSize={25} />
    </DuckUIProvider>
  )
}
```

When a user selects a filter value, every component automatically re-queries with the filter applied.

## Data Sources

```tsx
// Array of objects (loaded directly into DuckDB)
<DuckUIProvider data={{ orders: [...] }}>

// Remote file (CSV, JSON, or Parquet)
<DuckUIProvider data={{ sales: { url: '/data/sales.parquet', format: 'parquet' } }}>

// Async fetch callback (call your own API)
<DuckUIProvider data={{ users: { fetch: () => fetch('/api/users').then(r => r.json()) } }}>

// Browser File object (drag & drop, file picker)
<DuckUIProvider data={{ upload: fileFromInput }}>
```

See the [Data Sources](./guides/data-sources.md) guide for details.

## Bundler Configuration

DuckDB-WASM loads its engine from a CDN (jsDelivr) by default. No special bundler config is needed for most setups.

### Vite

Works out of the box. No additional configuration required.

### Next.js

Add DuckDB-WASM to the server component exclusion list if using App Router:

```js
// next.config.js
module.exports = {
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false }
    return config
  },
}
```

Ensure your Duck-UI components are client-only:

```tsx
'use client'
import { DuckUIProvider, DataTable } from '@duck_ui/embed'
```

### Webpack

If you need to serve WASM files locally instead of from CDN, configure the asset loader:

```js
// webpack.config.js
module.exports = {
  module: {
    rules: [
      { test: /\.wasm$/, type: 'asset/resource' },
    ],
  },
}
```

## Next Steps

- [Data Sources](./guides/data-sources.md) — all data input types
- [Gateway Pattern](./guides/gateway-pattern.md) — connect to Postgres, MySQL, ClickHouse via your backend
- [Filters](./guides/filters.md) — deep dive into the filter system
- [Charts](./guides/charts.md) — all chart types and customization
- [Core API Reference](./api/core.md) — DuckUI class, engine, chart factories
- [Embed API Reference](./api/embed.md) — React components and hooks
- [Elements API Reference](./api/elements.md) — Web Components reference
