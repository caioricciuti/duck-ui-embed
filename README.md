# Duck-UI Embed

Embed SQL-powered analytics dashboards in any React app using DuckDB-WASM. Zero backend required.

## Quick Start

```bash
bun add @duck_ui/embed @duckdb/duckdb-wasm
```

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

## Packages

| Package | Description | Size |
|---------|-------------|------|
| `@duck_ui/core` | DuckDB-WASM engine, data sources, query executor, schema inspector | ~15 KB |
| `@duck_ui/charts` | uPlot-based charts (line, bar, area, scatter, pie, sparkline) | ~10 KB |
| `@duck_ui/components` | React components (DuckProvider, DataTable, Chart, KPICard, filters) | ~17 KB |
| `@duck_ui/embed` | Convenience re-export of all packages | ~0.2 KB |
| `@duck_ui/pro` | License-gated features (dashboard builder, pivot table, exports) | Coming soon |

## Data Sources

```tsx
// Local file (Parquet, CSV, JSON, Arrow)
{ type: 'file', name: 'data', data: file, format: 'csv' }

// Remote URL (auto-detects format from extension)
{ type: 'url', name: 'data', url: 'https://example.com/data.parquet' }

// S3/GCS/Azure — requires @duck_ui/pro
// Postgres/MySQL — requires @duck_ui/pro
```

## Components

### DuckProvider

Initializes DuckDB-WASM and provides context to all child components.

```tsx
<DuckProvider config={{ sources, memoryLimit: 512 * 1024 * 1024 }}>
  {children}
</DuckProvider>
```

### Hooks

```tsx
const { status, error, filters, setFilter } = useDuck()
const { data, loading, error, refetch } = useQuery('SELECT * FROM sales')
const { tables, schema, loading } = useSchema('sales')
```

### DataTable

SQL-driven table with sorting and pagination.

```tsx
<DataTable sql="SELECT * FROM sales" pageSize={25} sortable />
```

### Chart

SQL-driven chart. Supports `line`, `bar`, `area`, `scatter`.

```tsx
<Chart sql="SELECT month, revenue FROM sales GROUP BY 1" type="line" height={300} />
```

### KPICard

Single metric display with optional comparison and sparkline.

```tsx
<KPICard sql="SELECT SUM(revenue) AS value FROM sales" label="Revenue" />
```

### Filters

Global filters that reactively update all components.

```tsx
<FilterBar>
  <SelectFilter column="region" options={['North', 'South']} label="Region" />
  <DateRangeFilter column="date" label="Date" />
  <RangeFilter column="amount" min={0} max={1000} label="Amount" />
</FilterBar>
```

## Development

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Run tests
bun run test

# Build a specific package
bun run build --filter=@duck_ui/core
```

## Architecture

```
duck-ui-embed/
└── packages/
    ├── core/          # DuckDB-WASM engine, sources, queries, schema
    ├── charts/        # uPlot chart components
    ├── components/    # React UI components
    ├── embed/         # Convenience re-export
    └── pro/           # License-gated features
```

## License

Apache-2.0 for `@duck_ui/core`, `@duck_ui/charts`, `@duck_ui/components`, `@duck_ui/embed`.

Commercial license for `@duck_ui/pro`.
