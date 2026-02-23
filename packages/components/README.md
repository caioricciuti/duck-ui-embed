# @duck_ui/components

> Embeddable analytics React components — tables, charts, KPIs, and filters. Powered by DuckDB-WASM.

## Install

```bash
npm install @duck_ui/components @duckdb/duckdb-wasm
```

## Usage

```tsx
import { DuckProvider, DataTable, Chart, KPICard } from '@duck_ui/components'

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
        format="currency"
      />
      <Chart
        sql="SELECT month, SUM(revenue) AS rev FROM sales GROUP BY 1"
        type="bar"
        height={300}
      />
      <DataTable sql="SELECT * FROM sales LIMIT 100" pageSize={25} />
    </DuckProvider>
  )
}
```

## Components

- `DuckProvider` — initializes DuckDB-WASM, provides context
- `DataTable` — SQL-driven table with sorting, pagination, virtualisation
- `Chart` — SQL-driven chart (line, bar, area, scatter)
- `KPICard` — single metric with comparison and sparkline
- `ExportButton` — export query results as CSV/JSON

## Filters

- `FilterBar` — container for filter components
- `SelectFilter` — single-select dropdown
- `MultiSelectFilter` — multi-select dropdown
- `DateRangeFilter` — date range picker
- `RangeFilter` — numeric range slider

## Hooks

- `useDuck()` — access engine status, filters, setFilter
- `useQuery(sql)` — execute SQL with loading/error states
- `useSchema(table?)` — inspect table schemas

## Shared

- `Loading`, `ErrorDisplay`, `EmptyState`

## License

Apache-2.0
