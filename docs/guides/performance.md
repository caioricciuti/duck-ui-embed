# Performance

Tips for optimizing Duck-UI with large datasets.

## SQL-Level Pagination

The `DataTable` component uses `usePaginatedQuery` internally. Instead of loading all rows into JavaScript, it runs:

```sql
-- Count query (cached after first run)
SELECT COUNT(*) AS _total FROM (your_query) AS _count_base

-- Page query (only loads visible page)
SELECT * FROM (your_query) AS _page_base
ORDER BY revenue DESC
LIMIT 25 OFFSET 50
```

Both queries run in parallel. Only 25 rows (one page) are loaded into JavaScript at a time.

### Using usePaginatedQuery Directly

```tsx
import { usePaginatedQuery } from '@duck_ui/embed'

function MyTable() {
  const [page, setPage] = useState(0)

  const { rows, columns, totalRows, loading } = usePaginatedQuery(
    'SELECT * FROM sales',
    { page, pageSize: 50, orderBy: { column: 'revenue', direction: 'desc' } }
  )

  const totalPages = Math.ceil(totalRows / 50)

  return (
    <div>
      <table>{/* render rows */}</table>
      <button onClick={() => setPage(p => p - 1)} disabled={page === 0}>Previous</button>
      <span>Page {page + 1} of {totalPages}</span>
      <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>Next</button>
    </div>
  )
}
```

## maxRows on Sources

Limit rows at the source level during table creation:

```tsx
<DuckProvider
  config={{
    sources: [{
      type: 'url',
      name: 'sales',
      url: '/data/large-dataset.csv',
      maxRows: 100000,  // Only load first 100K rows
    }],
  }}
>
```

This adds a `LIMIT` clause to the `CREATE TABLE` SQL:

```sql
CREATE OR REPLACE TABLE "sales" AS
SELECT * FROM read_csv_auto('large-dataset.csv') LIMIT 100000
```

Use cases:
- Preview mode during development
- Capping extremely large datasets
- Reducing initial load time

## File Format Choice

| Format | Payload Size | Parse Speed | Best For |
|--------|-------------|-------------|----------|
| Parquet | Smallest | Fastest | Large datasets, production |
| Arrow | Small | Fast | Zero-copy, streaming |
| JSON | Large | Medium | API responses, small datasets |
| CSV | Medium | Slower | Universal compatibility |

**Recommendation:** Use Parquet for any dataset over 10K rows. It compresses well and DuckDB reads it natively.

For gateway sources, consider having your backend return Parquet:

```tsx
{
  type: 'postgres',
  name: 'data',
  endpoint: '/api/query/parquet',
  query: 'orders',
  format: 'parquet',
}
```

## Query Cache

`QueryCache` is an LRU cache with TTL (time-to-live):

- **Default max size:** 100 entries
- **Default TTL:** 5 minutes (300,000 ms)
- **Eviction:** Oldest entry removed when cache is full

Cache is automatic — every query result is cached unless `noCache: true`:

```tsx
// Cached (default)
const { data } = useQuery('SELECT * FROM sales')

// Not cached (fresh query every time)
const { data } = useQuery('SELECT * FROM sales', { noCache: true })
```

Invalidate cache programmatically:

```tsx
const { cache } = useDuck()

cache.invalidate()          // Clear all cached queries
cache.invalidate('my-key')  // Clear specific entry
```

The `usePaginatedQuery` hook caches the COUNT(*) result so page navigation only runs the page query.

## Connection Pool

The connection pool reuses DuckDB connections instead of creating new ones per query:

```tsx
<DuckProvider config={{ maxConnections: 4 }}>
```

| Setting | Default | Description |
|---------|---------|-------------|
| `maxConnections` | `4` | Maximum concurrent connections |
| `acquireTimeoutMs` | `30000` | Timeout when all connections are busy |

How it works:
1. Query needs a connection → pool checks for idle connections
2. Idle connection available → reuse it
3. No idle, under max → create new connection
4. At max → queue the request (with timeout)
5. Query done → connection returned to pool

For most dashboards, the default of 4 connections is sufficient. Increase if you have many parallel queries.

## Memory Limits

Configure the DuckDB-WASM memory limit:

```tsx
<DuckProvider
  config={{
    memoryLimit: 512 * 1024 * 1024,  // 512 MB
  }}
>
```

Default: 256 MB. The memory warning threshold (default 0.8) logs a warning when usage approaches the limit.

Tips:
- Parquet files use less memory than CSV (columnar, compressed)
- Use `maxRows` to cap row count at the source level
- Use SQL-level pagination instead of loading all rows
- Drop unused tables to free memory

## Best Practices Summary

| Practice | Impact |
|----------|--------|
| Use Parquet over CSV/JSON | Smaller payload, faster load, less memory |
| Set `maxRows` on large sources | Limits data loaded into WASM |
| Use `DataTable` (not custom table) | Automatic SQL-level pagination |
| Keep default connection pool size (4) | Prevents connection thrashing |
| Use `noCache: true` sparingly | Cache saves re-execution time |
| Increase `memoryLimit` if needed | Prevents OOM on large datasets |
| Return Parquet from gateway backends | Smallest network transfer |
