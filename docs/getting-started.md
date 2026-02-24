# Getting Started

Get a SQL-powered analytics dashboard running in your React app in 5 minutes.

## Prerequisites

- Node.js 18+
- React 18+
- A package manager (bun, npm, yarn, or pnpm)

## Installation

```bash
# Recommended: single package that includes everything
bun add @duck_ui/embed @duckdb/duckdb-wasm

# Or install individual packages
bun add @duck_ui/core @duck_ui/charts @duck_ui/components @duckdb/duckdb-wasm
```

npm / yarn / pnpm work the same way:

```bash
npm install @duck_ui/embed @duckdb/duckdb-wasm
```

## Minimal Example

Wrap your app with `DuckProvider`, point it at a data source, and drop in components:

```tsx
import { DuckProvider, DataTable } from '@duck_ui/embed'

function App() {
  return (
    <DuckProvider
      config={{
        sources: [
          { type: 'url', name: 'sales', url: '/data/sales.parquet' },
        ],
      }}
    >
      <DataTable sql="SELECT * FROM sales" />
    </DuckProvider>
  )
}
```

That's it. DuckDB-WASM boots in a Web Worker, fetches the Parquet file, creates a `sales` table, and the `DataTable` renders it with pagination and sorting.

## Add a Chart

```tsx
import { DuckProvider, DataTable, Chart } from '@duck_ui/embed'

function App() {
  return (
    <DuckProvider
      config={{
        sources: [
          { type: 'url', name: 'sales', url: '/data/sales.parquet' },
        ],
      }}
    >
      <Chart
        sql="SELECT month, SUM(revenue) AS rev FROM sales GROUP BY 1 ORDER BY 1"
        type="bar"
        height={300}
      />
      <DataTable sql="SELECT * FROM sales" pageSize={25} />
    </DuckProvider>
  )
}
```

The first column of the query result becomes the x-axis, remaining columns become series.

## Add a KPI

```tsx
import { KPICard } from '@duck_ui/embed'

<KPICard
  sql="SELECT SUM(revenue) AS value FROM sales"
  label="Total Revenue"
  format="currency"
  comparisonSql="SELECT SUM(revenue) AS value FROM sales WHERE year = 2023"
  sparklineSql="SELECT month, SUM(revenue) AS rev FROM sales GROUP BY 1 ORDER BY 1"
/>
```

- `format` accepts `'currency'`, `'percent'`, `'number'`, `'compact'`, or a custom function
- `comparisonSql` shows a percentage change vs. the comparison value
- `sparklineSql` renders an inline trend line

## Add Filters

Filters are global -- they automatically inject WHERE clauses into all queries:

```tsx
import {
  DuckProvider, DataTable, Chart, KPICard,
  FilterBar, SelectFilter, DateRangeFilter, RangeFilter,
} from '@duck_ui/embed'

function Dashboard() {
  return (
    <DuckProvider
      config={{
        sources: [{ type: 'url', name: 'sales', url: '/data/sales.parquet' }],
      }}
    >
      <FilterBar>
        <SelectFilter column="region" source="sales" label="Region" />
        <DateRangeFilter column="date" label="Date" />
        <RangeFilter column="amount" min={0} max={10000} label="Amount" />
      </FilterBar>

      <KPICard sql="SELECT SUM(revenue) AS value FROM sales" label="Revenue" format="currency" />
      <Chart sql="SELECT month, SUM(revenue) AS rev FROM sales GROUP BY 1" type="bar" height={300} />
      <DataTable sql="SELECT * FROM sales" pageSize={25} />
    </DuckProvider>
  )
}
```

When a user selects "North" in the Region filter, every component automatically re-queries with `WHERE region = 'North'` injected.

## Data Source Types

```tsx
// Local file (ArrayBuffer, Uint8Array, or File object)
{ type: 'file', name: 'data', data: fileBuffer, format: 'csv' }

// Remote URL (format auto-detected from extension or Content-Type)
{ type: 'url', name: 'data', url: 'https://example.com/data.parquet' }

// API gateway (your backend queries the database, returns data)
{ type: 'gateway', name: 'data', endpoint: '/api/query', query: 'SELECT * FROM users' }

// Database aliases (same as gateway, signals intent)
{ type: 'postgres', name: 'users', endpoint: '/api/pg', query: 'SELECT * FROM users' }
{ type: 'mysql', name: 'orders', endpoint: '/api/mysql', query: 'SELECT * FROM orders' }
```

See the [Data Sources](./guides/data-sources.md) and [Gateway Pattern](./guides/gateway-pattern.md) guides for details.

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
import { DuckProvider, DataTable } from '@duck_ui/embed'
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

- [Data Sources](./guides/data-sources.md) -- all source types, format detection, maxRows
- [Gateway Pattern](./guides/gateway-pattern.md) -- connect to Postgres, MySQL, ClickHouse, BigQuery
- [Filters](./guides/filters.md) -- deep dive into the filter system
- [Charts](./guides/charts.md) -- all chart types and customization
- [API Reference](./api/core.md) -- full API for every package
