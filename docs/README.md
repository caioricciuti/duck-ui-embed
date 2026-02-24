# Duck-UI Embed Documentation

Embed SQL-powered analytics dashboards in any React app using DuckDB-WASM. Zero backend required.

## Getting Started

- [Getting Started](./getting-started.md) -- Install, first dashboard, bundler setup
- [Architecture](./architecture.md) -- How the packages fit together, runtime and data flow

## Guides

| Guide | Description |
|-------|-------------|
| [Data Sources](./guides/data-sources.md) | Load data from files, URLs, and API gateways |
| [Gateway Pattern](./guides/gateway-pattern.md) | Connect to Postgres, MySQL, ClickHouse, BigQuery via your backend |
| [Filters](./guides/filters.md) | Reactive filter system -- SelectFilter, DateRangeFilter, RangeFilter, MultiSelectFilter |
| [Charts](./guides/charts.md) | Line, bar, area, scatter, pie, sparkline -- data format, presets, tooltips |
| [Theming](./guides/theming.md) | Chart themes, color palettes, Pro ThemeProvider |
| [Performance](./guides/performance.md) | Caching, connection pooling, pagination, memory limits |
| [Pro License](./guides/pro-license.md) | Getting a license, ProProvider setup, domain matching |

## API Reference

| Package | Description |
|---------|-------------|
| [@duck_ui/core](./api/core.md) | DuckDB-WASM engine, query executor, data sources, schema inspector, filters |
| [@duck_ui/charts](./api/charts.md) | UChart, PieChart, Sparkline, presets, tooltip, themes, palettes |
| [@duck_ui/components](./api/components.md) | DuckProvider, hooks, DataTable, Chart, KPICard, filters, ExportButton |
| [@duck_ui/embed](./api/embed.md) | Convenience re-export of core + charts + components |
| [@duck_ui/pro](./api/pro.md) | ProProvider, license validation, dashboard builder, advanced tables, theming |

## Examples

| Example | Description |
|---------|-------------|
| [Sales Dashboard](./examples/sales-dashboard.md) | Complete dashboard with KPIs, charts, table, and filters |
| [Express.js Gateway](./examples/gateway-express.md) | Postgres gateway with Express.js backend |
| [Next.js Gateway](./examples/gateway-nextjs.md) | Postgres gateway with Next.js API routes |
| [Multi-Source Dashboard](./examples/multi-source.md) | Multiple data sources with cross-table queries |

## Packages

```
@duck_ui/embed          (re-exports everything below)
  ├── @duck_ui/core        DuckDB-WASM engine, sources, queries, schema
  ├── @duck_ui/charts      uPlot chart components
  └── @duck_ui/components  React UI (provider, table, chart, KPI, filters)

@duck_ui/pro            License-gated pro features (separate install)
```

## License

Apache-2.0 for core, charts, components, embed.

Commercial license for `@duck_ui/pro` -- contact **c.ricciuti@iberodata.es** for pricing.
