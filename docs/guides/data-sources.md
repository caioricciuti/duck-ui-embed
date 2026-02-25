# Data Sources

## Overview

Duck-UI loads data into an in-browser DuckDB-WASM instance through the `data` prop on `DuckUIProvider`. Each key becomes a DuckDB table name, and the value determines how the data is loaded.

```tsx
import { DuckUIProvider } from '@duck_ui/embed'

<DuckUIProvider data={{
  orders: [...],                                              // array of objects
  sales: { url: '/data/sales.parquet', format: 'parquet' },   // remote file
  users: { fetch: () => fetch('/api/users').then(r => r.json()) },  // async callback
}}>
  {children}
</DuckUIProvider>
```

## DataInput Type

```ts
type DataInput =
  | Record<string, unknown>[]                              // Array of objects
  | { url: string; format?: 'csv' | 'json' | 'parquet' }  // Remote file
  | { fetch: () => Promise<Record<string, unknown>[]> }    // Async callback
  | File                                                    // Browser File object
```

---

## Array of Objects

The simplest form. Pass JavaScript objects directly and they're loaded into a DuckDB table.

```tsx
const orders = [
  { id: 1, product: 'Widget', status: 'shipped', total: 99.50 },
  { id: 2, product: 'Gadget', status: 'pending', total: 149.00 },
]

<DuckUIProvider data={{ orders }}>
```

DuckDB infers column types from the data. This is ideal when:
- You already have data in memory from your app state
- Data is small enough to pass inline
- You're prototyping or testing

---

## Remote URL

Fetch a file over HTTP and load it into DuckDB. Supports CSV, JSON, and Parquet.

```tsx
<DuckUIProvider data={{
  sales: { url: '/data/sales.parquet', format: 'parquet' },
  customers: { url: 'https://cdn.example.com/customers.csv' },
  events: { url: '/api/export/events.json', format: 'json' },
}}>
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `url` | `string` | yes | URL to fetch |
| `format` | `'csv' \| 'json' \| 'parquet'` | no | File format (auto-detected from extension if omitted) |

### Parquet — the power feature

Parquet files use HTTP range requests via `registerFileURL()`. DuckDB only downloads the row groups the query needs, making it viable to point at multi-GB files on S3/CDN and only pull what's necessary.

```tsx
// This 500MB file on S3 — DuckDB only downloads the row groups it needs
<DuckUIProvider data={{
  sales: { url: 'https://my-bucket.s3.amazonaws.com/sales.parquet', format: 'parquet' },
}}>
```

### CSV and JSON

CSV and JSON files are downloaded entirely, then loaded into DuckDB with `read_csv_auto` or `read_json_auto`.

---

## Fetch Callback

The most flexible option. You provide an async function that returns an array of objects. Duck-UI calls it during initialization and loads the result into a DuckDB table.

```tsx
<DuckUIProvider data={{
  users: {
    fetch: () => fetch('/api/users', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()),
  },
}}>
```

This is the replacement for the "gateway pattern" — you control the HTTP request entirely:
- Call any API endpoint
- Add authentication headers
- Transform the response before returning
- Call GraphQL, REST, or any custom protocol

```tsx
// GraphQL example
<DuckUIProvider data={{
  orders: {
    fetch: async () => {
      const res = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ orders { id total status } }' }),
      })
      const { data } = await res.json()
      return data.orders
    },
  },
}}>
```

---

## Browser File Object

Load files from a file input or drag-and-drop. Accepts the browser `File` API.

```tsx
function FileUploader() {
  const [file, setFile] = useState<File | null>(null)

  if (!file) {
    return <input type="file" accept=".csv,.parquet,.json" onChange={e => setFile(e.target.files?.[0] ?? null)} />
  }

  return (
    <DuckUIProvider data={{ uploaded: file }}>
      <DataTable sql="SELECT * FROM uploaded" />
    </DuckUIProvider>
  )
}
```

---

## Multiple Sources

Combine any input types. Each creates its own DuckDB table, and you can join across them with SQL.

```tsx
<DuckUIProvider data={{
  products: { url: '/data/products.parquet', format: 'parquet' },
  orders: { fetch: () => fetch('/api/orders').then(r => r.json()) },
  categories: [
    { id: 1, name: 'Electronics' },
    { id: 2, name: 'Clothing' },
  ],
}}>
```

Then query across tables:

```sql
SELECT
  o.id AS order_id,
  p.name AS product,
  c.name AS category,
  o.total
FROM orders o
JOIN products p ON o.product_id = p.id
JOIN categories c ON p.category_id = c.id
```

---

## Reactive Data Updates

When the `data` prop changes, DuckUIProvider:
1. Drops tables that are no longer in the new data prop
2. Reloads tables that are still present
3. Invalidates the query cache
4. All components re-render with fresh data
