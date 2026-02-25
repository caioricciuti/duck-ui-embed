# Architecture

## Package Structure

`@duck_ui/embed` is a single package containing everything:

```
packages/embed/src/
├── provider/       DuckUIProvider, context, hooks, filter state (Zustand)
├── engine/         DuckDB init, connection pool, query executor, cache, filter injection, schema
├── components/     Chart, DataTable, KPICard, FilterBar, ExportButton, filter components
└── charts/         uPlot wrappers (UChart, PieChart, Sparkline), presets, plugins, theme
```

Peer dependency: `@duckdb/duckdb-wasm` (>=1.28.0)

## Runtime Initialization Flow

When `<DuckUIProvider>` mounts:

```
1. DuckDBManager.initialize()
   ├── Fetches WASM bundle info from jsDelivr
   ├── Selects best bundle for the browser
   ├── Creates a Web Worker
   └── Instantiates AsyncDuckDB

2. ConnectionPool(manager)
   └── Ready to hand out connections on acquire()

3. For each key in data prop:
   └── loadData(db, conn, data)
       ├── Array of objects → JSON string → registerFileBuffer → CREATE TABLE
       ├── { url }          → fetch → registerFileBuffer → CREATE TABLE
       ├── { url, format: 'parquet' } → registerFileURL → HTTP range reads
       ├── { fetch }        → call fn → JSON string → registerFileBuffer → CREATE TABLE
       └── File             → registerFileBuffer → CREATE TABLE

4. status = 'ready'
   └── Children render, hooks can execute queries
```

## Query Execution Flow

When a component calls `useQuery(sql)`:

```
1. useQuery checks DuckUIProvider status === 'ready'

2. Build effective SQL:
   ├── If filters are active and noFilter !== true:
   │   └── FilterInjector.inject(sql, filters, tableName)
   │       → Wraps sql as subquery, adds WHERE clauses
   └── Otherwise: use sql as-is

3. Check QueryCache:
   ├── Cache hit (and noCache !== true) → return cached result
   └── Cache miss → continue

4. QueryExecutor.execute(effectiveSql):
   ├── ConnectionPool.acquire() → get a DuckDB connection
   ├── conn.query(sql) → run SQL in WASM Worker
   ├── Coerce values (BigInt → Number, Date → ISO string, etc.)
   ├── ConnectionPool.release(conn)
   └── Return QueryResult { rows, columns, rowCount, executionTime }

5. Cache the result

6. Return { data, loading: false, error: null, refetch }
```

## Filter Flow

```
User interacts with <SelectFilter>
  → Zustand store: setFilter('region', 'North')
    → filterVersion increments
      → All useQuery hooks re-run (they depend on filterVersion)
        → FilterInjector wraps SQL:
            Original: SELECT * FROM sales
            Injected: SELECT * FROM (SELECT * FROM sales) AS _filtered
                      WHERE "region" = 'North'
          → Components re-render with filtered data
```

Filter conditions by value type:

| FilterValue | SQL Generated |
|-------------|--------------|
| `'North'` | `"col" = 'North'` |
| `42` | `"col" = 42` |
| `true` | `"col" = true` |
| `['A', 'B']` | `"col" IN ('A', 'B')` |
| `{ min: 10, max: 100 }` | `"col" >= 10 AND "col" <= 100` |
| `{ start: '2024-01-01', end: '2024-12-31' }` | `"col" BETWEEN '2024-01-01' AND '2024-12-31'` |
| `null` | _(skipped)_ |

## SQL-Level Pagination (DataTable)

`DataTable` uses `usePaginatedQuery` which runs two SQL queries per page:

```
Base SQL: SELECT * FROM sales WHERE region = 'North'

Count query (cached):
  SELECT COUNT(*) AS _total FROM (SELECT * FROM sales WHERE region = 'North') AS _count_base

Page query:
  SELECT * FROM (SELECT * FROM sales WHERE region = 'North') AS _page_base
  ORDER BY revenue DESC
  LIMIT 25 OFFSET 50
```

Both queries run in parallel. Only the current page of rows is loaded into JavaScript.

## Memory Model

```
┌─────────────────────────┐
│  Main Thread (React)    │
│  ├── DuckUIProvider     │
│  ├── Components/Hooks   │
│  └── QueryResults (JS)  │
└─────────┬───────────────┘
          │ postMessage
┌─────────▼───────────────┐
│  Web Worker             │
│  └── DuckDB-WASM        │
│      ├── Tables (WASM)  │
│      ├── Query Engine   │
│      └── Memory Limit   │
└─────────────────────────┘
```

- DuckDB runs entirely in a Web Worker (no main thread blocking)
- Table data lives in WASM memory (default: 256 MB)
- Query results are serialized and sent back to the main thread as JavaScript objects
- The `ConnectionPool` manages up to 4 concurrent connections by default
