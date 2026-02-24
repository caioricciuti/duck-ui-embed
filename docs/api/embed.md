# @duck_ui/embed API Reference

`@duck_ui/embed` is a convenience meta-package that re-exports everything from the three core packages:

```ts
export * from '@duck_ui/core'
export * from '@duck_ui/charts'
export * from '@duck_ui/components'
```

## When to Use

**Use `@duck_ui/embed`** when you want a single import for your entire dashboard:

```tsx
import { DuckProvider, DataTable, Chart, KPICard, FilterBar, SelectFilter } from '@duck_ui/embed'
```

**Use individual packages** when you need fine-grained control over bundle size or only need a subset:

```tsx
// Only need the query engine, no UI
import { DuckDBManager, QueryExecutor } from '@duck_ui/core'

// Only need chart components
import { UChart, PieChart } from '@duck_ui/charts'
```

## Tree-Shaking

All packages are published with both ESM (`index.mjs`) and CJS (`index.js`) outputs and are marked `sideEffects: false`. Modern bundlers (Vite, webpack 5, esbuild) will tree-shake unused exports.

Importing from `@duck_ui/embed` does **not** increase your bundle size compared to importing from individual packages -- unused exports are eliminated at build time.

## What's Included

| Re-exported Package | What It Provides |
|-------------------|-----------------|
| `@duck_ui/core` | DuckDBManager, ConnectionPool, QueryExecutor, QueryCache, SchemaInspector, FilterInjector, DataSourceRegistry, SourceLoader, FileSource, URLSource, GatewaySource, all types and errors |
| `@duck_ui/charts` | UChart, PieChart, Sparkline, presets, tooltipPlugin, themes, palettes, format utilities |
| `@duck_ui/components` | DuckProvider, useDuck, useQuery, usePaginatedQuery, useSchema, DataTable, Chart, KPICard, FilterBar, SelectFilter, MultiSelectFilter, DateRangeFilter, RangeFilter, ExportButton, Loading, ErrorDisplay, EmptyState |

## Not Included

`@duck_ui/pro` is **not** part of this package. Install it separately:

```bash
bun add @duck_ui/pro
```

## Full API Documentation

- [@duck_ui/core API](./core.md)
- [@duck_ui/charts API](./charts.md)
- [@duck_ui/components API](./components.md)
- [@duck_ui/pro API](./pro.md)
