# @duck_ui/core

DuckDB-WASM engine, query executor, and data source management. Pure TypeScript — no React dependency.

## Install

```bash
npm install @duck_ui/core @duckdb/duckdb-wasm
```

## Usage

```ts
import {
  DuckDBManager,
  ConnectionPool,
  QueryExecutor,
  SchemaInspector,
  SourceLoader,
} from '@duck_ui/core'

// Initialize DuckDB-WASM
const engine = new DuckDBManager()
await engine.initialize()

// Create a connection pool and executor
const pool = new ConnectionPool(engine, { maxSize: 4 })
const executor = new QueryExecutor(pool)

// Execute queries
const result = await executor.execute('SELECT 1 + 1 AS answer')
console.log(result.rows) // [{ answer: 2 }]

// Inspect schemas
const inspector = new SchemaInspector(pool)
const tables = await inspector.getTables()
```

## Exports

- `DuckDBManager` — initialize and manage the DuckDB-WASM instance
- `ConnectionPool` — pooled connections with acquire/release
- `QueryExecutor` — execute SQL and get typed results
- `QueryCache` — LRU cache for query results
- `SchemaInspector` — list tables, get column schemas
- `SourceLoader` — load files, URLs, and other data sources
- `DataSourceRegistry` — register and manage data sources
- `FilterInjector` — inject WHERE clauses into SQL
- Types: `QueryResult`, `ColumnInfo`, `TableSchema`, `SourceConfig`, `FilterValue`

## License

Apache-2.0
