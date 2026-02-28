# @duck_ui/core

Pure JavaScript engine for DuckDB-WASM: query execution, caching, chart factories, and utilities. Zero framework dependencies.

## Install

```sh
npm install @duck_ui/core @duckdb/duckdb-wasm
```

## Usage

```ts
import { DuckUI } from '@duck_ui/core'

const ui = new DuckUI()
await ui.init({ orders: [{ id: 1, product: 'Widget', total: 99 }] })

const result = await ui.query('SELECT count(*) as n FROM orders')
console.log(result.rows) // [{ n: 1 }]

await ui.destroy()
```

## What's Included

- **Engine**: DuckDB-WASM init, connection pool, query executor, LRU cache, filter injection, schema inspector
- **Chart factories**: `createChart`, `buildChartOptions`, `drawPie`, `createSparkline`, `queryResultToChartData`
- **Themes**: `lightTheme`, `darkTheme`, color palettes
- **Utilities**: `formatCellValue`, `resolveFormatter`, `exportToFile`, `observeSize`

## Documentation

Full API reference: [docs/api/core.md](https://github.com/caioricciuti/duck-ui-embed/blob/main/docs/api/core.md)

## License

Apache-2.0
