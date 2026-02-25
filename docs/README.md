# Duck-UI Embed Documentation

Drop-in SQL-powered React components backed by DuckDB-WASM. One package. One provider. Pass data, write SQL, get dashboards.

## Getting Started

- [Getting Started](./getting-started.md) -- Install, first dashboard, bundler setup
- [Architecture](./architecture.md) -- How the package works, runtime and data flow

## Guides

| Guide | Description |
|-------|-------------|
| [Data Sources](./guides/data-sources.md) | Load data from files, URLs, and fetch callbacks |
| [Gateway Pattern](./guides/gateway-pattern.md) | Connect to Postgres, MySQL, ClickHouse, BigQuery via your backend |
| [Filters](./guides/filters.md) | Reactive filter system -- SelectFilter, DateRangeFilter, RangeFilter, MultiSelectFilter |
| [Charts](./guides/charts.md) | Line, bar, area, scatter, pie, sparkline -- data format, presets, tooltips |
| [Theming](./guides/theming.md) | Chart themes, color palettes, custom styling |
| [Performance](./guides/performance.md) | Caching, connection pooling, pagination, memory limits |

## API Reference

| Package | Description |
|---------|-------------|
| [@duck_ui/embed](./api/embed.md) | DuckUIProvider, hooks, components, charts, engine |

## Examples

| Example | Description |
|---------|-------------|
| [Sales Dashboard](./examples/sales-dashboard.md) | Complete dashboard with KPIs, charts, table, and filters |
| [Express.js Gateway](./examples/gateway-express.md) | Postgres gateway with Express.js backend |
| [Next.js Gateway](./examples/gateway-nextjs.md) | Postgres gateway with Next.js API routes |
| [Multi-Source Dashboard](./examples/multi-source.md) | Multiple data sources with cross-table queries |

## License

Apache-2.0
