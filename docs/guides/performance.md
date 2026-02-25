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

## Limiting Rows

For large datasets, limit rows at the SQL level in your components:

```tsx
<DataTable
  sql="SELECT * FROM sales LIMIT 100000"
  pageSize={25}
  sortable
/>
```

Or pre-filter data before loading — for example, with a `{ fetch }` source that only returns a subset from your backend.

## File Format Choice

| Format | Payload Size | Parse Speed | Best For |
|--------|-------------|-------------|----------|
| Parquet | Smallest | Fastest | Large datasets, production |
| Arrow | Small | Fast | Zero-copy, streaming |
| JSON | Large | Medium | API responses, small datasets |
| CSV | Medium | Slower | Universal compatibility |

**Recommendation:** Use Parquet for any dataset over 10K rows. It compresses well and DuckDB reads it natively.

For remote data, use Parquet URLs when possible:

```tsx
<DuckUIProvider data={{
  sales: { url: '/data/sales.parquet', format: 'parquet' },
}}>
```

DuckDB-WASM reads Parquet via HTTP range requests — it only downloads the row groups needed by each query, rather than the entire file.

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
const { cache } = useDuckUI()

cache.invalidate()          // Clear all cached queries
cache.invalidate('my-key')  // Clear specific entry
```

The `usePaginatedQuery` hook caches the COUNT(*) result so page navigation only runs the page query.

## Connection Pool

The connection pool reuses DuckDB connections instead of creating new ones per query:

The connection pool is managed internally by `DuckUIProvider`. Default settings:

| Setting | Default | Description |
|---------|---------|-------------|
| Max connections | `4` | Maximum concurrent connections |
| Acquire timeout | `30000ms` | Timeout when all connections are busy |

How it works:
1. Query needs a connection → pool checks for idle connections
2. Idle connection available → reuse it
3. No idle, under max → create new connection
4. At max → queue the request (with timeout)
5. Query done → connection returned to pool

For most dashboards, the default of 4 connections is sufficient. Increase if you have many parallel queries.

## Memory Limits

DuckDB-WASM has a default memory limit of 256 MB.

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
