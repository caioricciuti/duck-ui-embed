# Duck-UI Embed

Embed SQL-powered analytics dashboards in any React app using DuckDB-WASM. Zero backend required.

## Documentation

Full documentation: **[docs/](./docs/README.md)**

- [Getting Started](./docs/getting-started.md) -- install and first dashboard
- [Data Sources](./docs/guides/data-sources.md) -- files, URLs, gateway sources
- [Gateway Pattern](./docs/guides/gateway-pattern.md) -- connect Postgres, MySQL, ClickHouse, BigQuery
- [Filters](./docs/guides/filters.md) -- reactive filter system
- [Charts](./docs/guides/charts.md) -- all chart types and customization
- [API Reference](./docs/api/core.md) -- full API for every package

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
| `@duck_ui/pro` | License-gated pro features (dashboard builder, pivot table, drill-down, theming) | ~6 KB |

## Data Sources

```tsx
// Local file (Parquet, CSV, JSON, Arrow)
{ type: 'file', name: 'data', data: file, format: 'csv' }

// Remote URL (auto-detects format from extension)
{ type: 'url', name: 'data', url: 'https://example.com/data.parquet' }

// API gateway (your backend queries the database, returns data)
{ type: 'gateway', name: 'data', endpoint: '/api/query', query: 'SELECT * FROM users' }

// Database aliases (same gateway mechanism, signals intent)
{ type: 'postgres', name: 'users', endpoint: '/api/pg', query: 'users' }
{ type: 'mysql', name: 'orders', endpoint: '/api/mysql', query: 'orders' }
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

## Pro

`@duck_ui/pro` adds license-gated features on top of the free packages. Contact **c.ricciuti@iberodata.es** for pricing and license keys.

```bash
bun add @duck_ui/pro
```

Wrap your app with `ProProvider` to activate Pro components:

```tsx
import { DuckProvider, DataTable, Chart, KPICard } from '@duck_ui/embed'
import { ProProvider } from '@duck_ui/pro'

function App() {
  return (
    <DuckProvider config={{ sources: [{ type: 'url', name: 'sales', url: '/data/sales.parquet' }] }}>
      <ProProvider license="DUCK-eyJzdWI...">
        {/* Free + Pro components work together */}
      </ProProvider>
    </DuckProvider>
  )
}
```

Without a valid license, Pro components render nothing and log a console warning.

### ThemeProvider

Custom theming with CSS custom properties.

```tsx
import { ThemeProvider } from '@duck_ui/pro'

<ProProvider license="DUCK-...">
  <ThemeProvider theme={{ primary: '#4f46e5', fontFamily: 'Inter, sans-serif' }}>
    <DataTable sql="SELECT * FROM sales" />
    <Chart sql="SELECT month, revenue FROM sales GROUP BY 1" type="bar" height={300} />
  </ThemeProvider>
</ProProvider>
```

### PivotTable

Pivot table with row/column grouping and value aggregation.

```tsx
import { PivotTable } from '@duck_ui/pro'

<PivotTable
  sql="SELECT region, category, year, SUM(revenue) AS rev FROM sales GROUP BY 1, 2, 3"
  rows={['region', 'category']}
  columns={['year']}
  values={['rev']}
/>
```

### GroupBy

Advanced grouping controls for dynamic SQL group-by queries.

```tsx
import { GroupBy } from '@duck_ui/pro'

<GroupBy
  sql="SELECT region, category, SUM(revenue) AS rev FROM sales GROUP BY 1, 2"
  groupColumns={['region', 'category']}
/>
```

### DrillDown

Click-to-drill on chart data points to explore underlying data.

```tsx
import { DrillDown } from '@duck_ui/pro'

<DrillDown onDrill={(params) => console.log('Drilled into:', params)}>
  <Chart
    sql="SELECT region, SUM(revenue) AS rev FROM sales GROUP BY 1"
    type="bar"
    height={300}
  />
</DrillDown>
```

### ConditionalFormat

Apply conditional cell styling based on value rules.

```tsx
import { ConditionalFormat } from '@duck_ui/pro'

<ConditionalFormat
  rules={[
    { column: 'revenue', condition: 'gt', value: 100000, style: { color: 'green', fontWeight: 'bold' } },
    { column: 'revenue', condition: 'lt', value: 10000, style: { color: 'red' } },
    { column: 'margin', condition: 'between', value: [0.2, 0.4], style: { backgroundColor: '#fef3c7' } },
  ]}
>
  <DataTable sql="SELECT * FROM sales" />
</ConditionalFormat>
```

### RowLevelSecurity

Restrict data access based on user roles — automatically injects WHERE clauses.

```tsx
import { RowLevelSecurity } from '@duck_ui/pro'

<RowLevelSecurity rules={{ region: "= 'North'", department: "IN ('Sales', 'Marketing')" }}>
  <DataTable sql="SELECT * FROM sales" />
  <Chart sql="SELECT month, SUM(revenue) AS rev FROM sales GROUP BY 1" type="line" height={300} />
</RowLevelSecurity>
```

### DashboardBuilder + DashboardRenderer

Build dashboards with a config object, then render them anywhere.

```tsx
import { DashboardBuilder, DashboardRenderer } from '@duck_ui/pro'
import type { DashboardConfig } from '@duck_ui/pro'

// Build mode — drag-and-drop editor
const [config, setConfig] = useState<DashboardConfig>({
  id: 'sales-dashboard',
  title: 'Sales Overview',
  layout: [
    { id: 'kpi-1', type: 'kpi', x: 0, y: 0, w: 4, h: 2, config: { sql: "SELECT SUM(revenue) AS value FROM sales", label: 'Revenue' } },
    { id: 'chart-1', type: 'chart', x: 0, y: 2, w: 8, h: 4, config: { sql: "SELECT month, SUM(revenue) AS rev FROM sales GROUP BY 1", type: 'bar' } },
    { id: 'table-1', type: 'table', x: 0, y: 6, w: 12, h: 6, config: { sql: "SELECT * FROM sales LIMIT 100" } },
  ],
})

<DashboardBuilder config={config} onChange={setConfig} />

// Render mode — display a saved config
<DashboardRenderer config={config} />
```

### useProLicense

Hook to conditionally render UI based on license status.

```tsx
import { useProLicense } from '@duck_ui/pro'

function UpgradeGate({ children }: { children: ReactNode }) {
  const { valid, loading, tier } = useProLicense()

  if (loading) return <p>Checking license...</p>
  if (!valid) return <p>Upgrade to Pro for this feature. <a href="https://duck-ui.com/pro">Learn more</a></p>

  return <>{children}</>
}
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

Commercial license for `@duck_ui/pro` — contact **c.ricciuti@iberodata.es** for pricing.
