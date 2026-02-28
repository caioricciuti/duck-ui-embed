# Duck-UI Documentation

SQL-powered dashboards backed by DuckDB-WASM. Framework-agnostic -- use React, Web Components, or a plain `<script>` tag.

## Packages

| Package | Description | Use When |
|---------|-------------|----------|
| `@duck_ui/core` | Pure JS engine + chart factories (no framework deps) | Building custom integrations or non-React frameworks |
| `@duck_ui/embed` | React bindings (imports from core) | React / Next.js apps |
| `@duck_ui/elements` | Web Components / Custom Elements (imports from core) | Vanilla JS, Vue, Svelte, or any framework |
| `@duck_ui/cdn` | Pre-bundled IIFE script for CDN usage | No bundler, plain HTML pages |

## Getting Started

- [Getting Started](./getting-started.md) -- Install, first dashboard, bundler setup (React, Web Components, CDN)
- [Architecture](./architecture.md) -- Monorepo layout, runtime and data flow

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
| [@duck_ui/core](./api/core.md) | DuckUI class, engine exports, chart factories |
| [@duck_ui/embed](./api/embed.md) | DuckUIProvider, hooks, React components |
| [@duck_ui/elements](./api/elements.md) | Custom elements, attributes, events |

## License

Apache-2.0
