# Example: Multi-Source Dashboard

A dashboard that loads data from multiple sources — Parquet files, CSV URLs, and a PostgreSQL gateway — and queries across them.

## Config

```tsx
import { DuckProvider, DataTable, Chart, KPICard, FilterBar, SelectFilter } from '@duck_ui/embed'

function MultiSourceDashboard() {
  return (
    <DuckProvider
      config={{
        sources: [
          // Source 1: Parquet file from CDN
          {
            type: 'url',
            name: 'products',
            url: 'https://cdn.example.com/data/products.parquet',
          },

          // Source 2: CSV file from local server
          {
            type: 'url',
            name: 'categories',
            url: '/data/categories.csv',
            format: 'csv',
            csvOptions: { delimiter: ',', header: true },
          },

          // Source 3: PostgreSQL via gateway
          {
            type: 'postgres',
            name: 'orders',
            endpoint: '/api/pg',
            query: 'orders',
            headers: { Authorization: `Bearer ${token}` },
          },

          // Source 4: ClickHouse via gateway
          {
            type: 'clickhouse',
            name: 'events',
            endpoint: '/api/clickhouse',
            query: 'page_views',
            maxRows: 100000,
          },
        ],
      }}
    >
      <Dashboard />
    </DuckProvider>
  )
}
```

Each source becomes a DuckDB table. You can query them independently or join them.

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
<FilterBar>
  {/* This filter applies to any query with a "category" column */}
  <SelectFilter column="category" options={['Electronics', 'Clothing', 'Food']} label="Category" />
</FilterBar>
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

## Loading Order

Sources load in the order they appear in the array. All sources must finish loading before `status` becomes `'ready'` and components render.

If one source fails (e.g., network error), the entire `DuckProvider` enters the `'error'` state. Handle this in your UI:

```tsx
import { useDuck } from '@duck_ui/embed'

function Dashboard() {
  const { status, error } = useDuck()

  if (status === 'loading') return <p>Loading data sources...</p>
  if (status === 'error') return <p>Failed to load: {error?.message}</p>

  return (
    <>
      {/* Dashboard content */}
    </>
  )
}
```

## Table Name Override

If two sources would have the same name, use `tableName` to differentiate:

```tsx
{
  type: 'url',
  name: 'q1-sales',           // Source identifier
  url: '/data/q1-sales.csv',
  tableName: 'sales_q1',      // DuckDB table name
},
{
  type: 'url',
  name: 'q2-sales',
  url: '/data/q2-sales.csv',
  tableName: 'sales_q2',
},
```

Then query:

```sql
SELECT * FROM sales_q1
UNION ALL
SELECT * FROM sales_q2
```
