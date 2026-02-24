# @duck_ui/embed

All-in-one embeddable analytics powered by DuckDB-WASM. This is the recommended package for most users — it re-exports everything from `@duck_ui/core`, `@duck_ui/charts`, and `@duck_ui/components`.

## Install

```bash
npm install @duck_ui/embed @duckdb/duckdb-wasm
```

## Usage

```tsx
import { DuckProvider, DataTable, Chart, KPICard } from '@duck_ui/embed'

function Dashboard() {
  return (
    <DuckProvider
      config={{
        sources: [
          { type: 'url', name: 'sales', url: '/data/sales.parquet' },
        ],
      }}
    >
      <KPICard
        sql="SELECT SUM(revenue) AS value FROM sales"
        label="Total Revenue"
        format={(v) => `$${v.toLocaleString()}`}
      />
      <Chart
        sql="SELECT month, SUM(revenue) AS rev FROM sales GROUP BY 1"
        type="bar"
        height={300}
      />
      <DataTable sql="SELECT * FROM sales LIMIT 100" />
    </DuckProvider>
  )
}
```

## What's included

| Package | What it provides |
|---------|-----------------|
| `@duck_ui/core` | DuckDB-WASM engine, query executor, data sources |
| `@duck_ui/charts` | uPlot chart components |
| `@duck_ui/components` | DuckProvider, DataTable, Chart, KPICard, filters, hooks |

## Full Documentation

- [API Reference](../../docs/api/embed.md)
- [Getting Started](../../docs/getting-started.md)

## License

Apache-2.0
