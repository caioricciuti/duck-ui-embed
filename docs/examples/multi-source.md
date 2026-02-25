# Example: Multi-Source Dashboard

A dashboard that loads data from multiple sources — Parquet files, CSV URLs, and an API — and queries across them.

## Config

```tsx
import { DuckUIProvider, DataTable, Chart, KPICard, FilterBar } from '@duck_ui/embed'

function MultiSourceDashboard() {
  return (
    <DuckUIProvider data={{
      // Source 1: Parquet file from CDN
      products: { url: 'https://cdn.example.com/data/products.parquet', format: 'parquet' },

      // Source 2: CSV file from local server
      categories: { url: '/data/categories.csv' },

      // Source 3: PostgreSQL via gateway
      orders: {
        fetch: () => fetch('/api/pg', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ query: 'orders' }),
        }).then(r => r.json()),
      },

      // Source 4: ClickHouse via gateway
      events: {
        fetch: () => fetch('/api/clickhouse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'page_views' }),
        }).then(r => r.json()),
      },
    }}>
      <Dashboard />
    </DuckUIProvider>
  )
}
```

Each entry in the `data` prop creates a DuckDB table. You can query them independently or join them.

## Cross-Table Queries

Once all sources are loaded, they're just DuckDB tables. Use standard SQL JOINs:

```tsx
function Dashboard() {
  return (
    <>
      {/* Query a single source */}
      <KPICard
        sql="SELECT COUNT(*) AS value FROM orders"
        label="Total Orders"
        format="compact"
      />

      {/* Join two sources */}
      <Chart
        sql={`
          SELECT c.name AS category, SUM(o.total) AS revenue
          FROM orders o
          JOIN products p ON p.id = o.product_id
          JOIN categories c ON c.id = p.category_id
          GROUP BY 1
          ORDER BY 2 DESC
        `}
        type="bar"
        height={300}
      />

      {/* Join three sources */}
      <DataTable
        sql={`
          SELECT
            o.id AS order_id,
            p.name AS product,
            c.name AS category,
            o.total,
            o.created_at
          FROM orders o
          JOIN products p ON p.id = o.product_id
          JOIN categories c ON c.id = p.category_id
          ORDER BY o.created_at DESC
        `}
        pageSize={25}
        sortable
      />

      {/* Query from ClickHouse events data */}
      <Chart
        sql={`
          SELECT
            EXTRACT(HOUR FROM event_time) AS hour,
            COUNT(*) AS page_views
          FROM events
          GROUP BY 1
          ORDER BY 1
        `}
        type="area"
        height={250}
      />
    </>
  )
}
```

## Filters Across Sources

Filters work across all sources. If you filter by a column that exists in multiple tables, the filter applies to all queries that reference that column:

```tsx
<FilterBar auto="orders" />
```

For table-specific filtering, use the `tableName` prop on components:

```tsx
{/* Only filters against the "orders" table */}
<DataTable
  sql="SELECT * FROM orders"
  tableName="orders"
  pageSize={25}
/>
```

## Loading

All data sources must finish loading before `status` becomes `'ready'` and components render. If one source fails, the entire provider enters the `'error'` state.

```tsx
import { useDuckUI } from '@duck_ui/embed'

function Dashboard() {
  const { status } = useDuckUI()

  if (status === 'loading') return <p>Loading data sources...</p>
  if (status === 'error') return <p>Failed to load data</p>

  return <>{/* Dashboard content */}</>
}
```
