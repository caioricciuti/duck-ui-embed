# Gateway Pattern: Connecting External Databases

DuckDB-WASM runs inside a Web Worker in the browser. It cannot open TCP connections to PostgreSQL, MySQL, ClickHouse, BigQuery, or any other external database. The gateway pattern bridges that gap.

## Why a Gateway?

The idea is straightforward:

1. Your backend connects to the real database.
2. It runs the query.
3. It returns results as JSON, CSV, or Parquet over HTTP.
4. Duck-UI fetches from your endpoint and loads the data into DuckDB-WASM.

This keeps your database credentials on the server, gives you full control over what queries are allowed, and lets Duck-UI work with any database that your backend can reach.

## How It Works

```
Browser (Duck-UI)                    Your Backend                     Database
┌─────────────┐    HTTP POST     ┌──────────────┐    SQL Query    ┌──────────┐
│ GatewaySource│ ──────────────► │ /api/query   │ ─────────────► │ Postgres │
│              │ { query: "..." }│              │                 │          │
│              │ ◄────────────── │              │ ◄───────────── │          │
│ DuckDB-WASM │    JSON/CSV/    │              │   Result rows   │          │
│ loads data   │    Parquet      └──────────────┘                 └──────────┘
└─────────────┘
```

The browser sends a POST (or GET) request to your endpoint. Your backend translates that into a real database query, executes it, and streams the result back. Duck-UI loads the response into DuckDB-WASM as a local table, and from that point on all client-side queries run against the in-browser copy.

---

## Frontend Configuration

Duck-UI provides a generic `gateway` source type and several semantic aliases. All aliases use the same `GatewaySource` class internally -- the `type` field is a hint for readability, not a behavior change.

### Generic Gateway

```tsx
{
  type: 'gateway',
  name: 'users',
  endpoint: 'https://api.example.com/query',
  query: 'SELECT * FROM users WHERE active = true',
  headers: { Authorization: 'Bearer <token>' },
}
```

### PostgreSQL Alias

```tsx
{
  type: 'postgres',
  name: 'orders',
  endpoint: '/api/pg',
  query: 'SELECT * FROM orders',
}
```

### MySQL Alias

```tsx
{
  type: 'mysql',
  name: 'products',
  endpoint: '/api/mysql',
  query: 'SELECT * FROM products',
}
```

### ClickHouse Alias

```tsx
{
  type: 'clickhouse',
  name: 'events',
  endpoint: '/api/clickhouse',
  query: 'SELECT * FROM events LIMIT 10000',
  method: 'GET',
}
```

### BigQuery Alias

```tsx
{
  type: 'bigquery',
  name: 'analytics',
  endpoint: '/api/bigquery',
  query: 'SELECT * FROM `project.dataset.table`',
}
```

The HTTP request sent by each alias is identical. Use whichever `type` makes your config self-documenting.

---

## Backend: Express.js + PostgreSQL

A complete, copy-paste-ready gateway server.

```js
// server.js
import express from 'express'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const app = express()
app.use(express.json())

// Allowlist of safe queries (NEVER execute raw client SQL)
const ALLOWED_QUERIES = {
  'users': 'SELECT id, name, email, created_at FROM users',
  'orders': 'SELECT id, user_id, total, status, created_at FROM orders',
  'revenue_by_month': `
    SELECT date_trunc('month', created_at) AS month, SUM(total) AS revenue
    FROM orders GROUP BY 1 ORDER BY 1
  `,
}

app.post('/api/pg', async (req, res) => {
  const queryKey = req.body.query
  const sql = ALLOWED_QUERIES[queryKey]
  if (!sql) {
    return res.status(400).json({ error: 'Unknown query' })
  }

  try {
    const result = await pool.query(sql)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(3001)
```

The frontend config that connects to this server:

```tsx
<DuckProvider
  config={{
    sources: [{
      type: 'postgres',
      name: 'orders',
      endpoint: 'http://localhost:3001/api/pg',
      query: 'orders', // Matches the allowlist key
    }],
  }}
>
```

The `query` value sent from the frontend (`"orders"`) is used as a key to look up the real SQL on the backend. The client never sends raw SQL.

---

## Backend: Next.js API Route

```ts
// app/api/pg/route.ts
import { Pool } from 'pg'
import { NextRequest, NextResponse } from 'next/server'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const ALLOWED_QUERIES: Record<string, string> = {
  'users': 'SELECT id, name, email FROM users',
  'orders': 'SELECT id, total, status FROM orders',
}

export async function POST(request: NextRequest) {
  const { query } = await request.json()
  const sql = ALLOWED_QUERIES[query]
  if (!sql) {
    return NextResponse.json({ error: 'Unknown query' }, { status: 400 })
  }

  const result = await pool.query(sql)
  return NextResponse.json(result.rows)
}
```

---

## Backend: ClickHouse

ClickHouse exposes a built-in HTTP interface, so your gateway can proxy to it directly:

```js
app.post('/api/clickhouse', async (req, res) => {
  const queryKey = req.body.query
  const sql = ALLOWED_QUERIES[queryKey]
  if (!sql) return res.status(400).json({ error: 'Unknown query' })

  const response = await fetch('http://clickhouse:8123/', {
    method: 'POST',
    body: sql + ' FORMAT JSONEachRow',
  })
  const data = await response.text()
  res.type('application/json').send(`[${data.trim().split('\n').join(',')}]`)
})
```

ClickHouse returns one JSON object per line in `JSONEachRow` format. The handler wraps those lines into a JSON array before sending the response.

---

## Returning Parquet for Large Datasets

For datasets over 100K rows, returning Parquet instead of JSON drastically reduces payload size and load time. Parquet is a columnar binary format -- it compresses well and DuckDB-WASM can read it directly without parsing text.

```js
import duckdb from 'duckdb' // Node.js DuckDB (not WASM)
import crypto from 'crypto'
import fs from 'fs'

app.post('/api/pg/parquet', async (req, res) => {
  const queryKey = req.body.query
  const sql = ALLOWED_QUERIES[queryKey]
  if (!sql) return res.status(400).json({ error: 'Unknown query' })

  // Use DuckDB's Postgres scanner on the server
  const db = new duckdb.Database(':memory:')
  db.run(`INSTALL postgres; LOAD postgres;`)
  db.run(`ATTACH '${process.env.DATABASE_URL}' AS pg (TYPE POSTGRES);`)

  const tmpFile = `/tmp/${crypto.randomUUID()}.parquet`
  db.run(`COPY (${sql}) TO '${tmpFile}' (FORMAT PARQUET);`)

  res.type('application/vnd.apache.parquet')
  res.sendFile(tmpFile, () => fs.unlinkSync(tmpFile))
})
```

Tell Duck-UI to expect Parquet in the source config:

```tsx
{
  type: 'postgres',
  name: 'orders',
  endpoint: '/api/pg/parquet',
  query: 'orders',
  format: 'parquet', // Tell Duck-UI to expect Parquet
}
```

---

## Authentication

Pass auth tokens via the `headers` config. These headers are sent with every request to the gateway endpoint.

```tsx
{
  type: 'gateway',
  name: 'data',
  endpoint: '/api/query',
  query: 'users',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'X-Tenant-ID': tenantId,
  },
}
```

This works with any auth scheme your backend expects -- Bearer tokens, API keys, session cookies, or custom headers.

---

## Security Best Practices

1. **NEVER execute raw SQL from the client.** Use an allowlist of named queries on the backend. The `query` field from the frontend should be treated as a lookup key, not as SQL.
2. **Validate the `query` field** -- reject anything that is not in your allowlist.
3. **Use authentication headers** for access control. Verify tokens on the backend before executing any query.
4. **Rate-limit** your gateway endpoints to prevent abuse.
5. **Add row limits** on the backend (`LIMIT 100000`) to prevent memory exhaustion in the browser.
6. **Use HTTPS** in production. Never send credentials or query results over plain HTTP.

---

## Performance Tips

| Tip | Impact |
|-----|--------|
| Return Parquet instead of JSON | 5-10x smaller payload, faster parsing |
| Add `maxRows` to source config | Limits rows loaded into DuckDB-WASM |
| Cache responses on your backend | Reduces database load |
| Use `usePaginatedQuery` | Only loads one page at a time |
| Enable gzip/brotli on your server | Smaller HTTP responses |
