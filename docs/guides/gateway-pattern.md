# Gateway Pattern: Connecting External Databases

DuckDB-WASM runs inside a Web Worker in the browser. It cannot open TCP connections to PostgreSQL, MySQL, ClickHouse, BigQuery, or any other external database. The gateway pattern bridges that gap.

## Why a Gateway?

1. Your backend connects to the real database
2. It runs the query
3. It returns results as JSON over HTTP
4. Duck-UI loads the response into DuckDB-WASM via a `{ fetch }` DataInput

This keeps database credentials on the server, gives you full control over what queries are allowed, and lets Duck-UI work with any database your backend can reach.

## How It Works

```
Browser (Duck-UI)                    Your Backend                     Database
┌─────────────┐    HTTP Request   ┌──────────────┐    SQL Query    ┌──────────┐
│ DuckUI      │ ──────────────>   │  Express /   │ ──────────────> │ Postgres │
│ Provider    │                   │  Next.js /   │                 │ MySQL    │
│             │ <──────────────   │  FastAPI     │ <────────────── │ etc.     │
│ { fetch }   │    JSON rows      │              │    Result rows   │          │
└─────────────┘                   └──────────────┘                 └──────────┘
```

## Frontend Integration

Use the `{ fetch }` DataInput to call your gateway:

```tsx
import { DuckUIProvider, DataTable, Chart, KPICard } from '@duck_ui/embed'

function App() {
  return (
    <DuckUIProvider data={{
      orders: {
        fetch: () => fetch('/api/pg', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'orders' }),
        }).then(r => r.json()),
      },
      revenue: {
        fetch: () => fetch('/api/pg', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'revenue_by_month' }),
        }).then(r => r.json()),
      },
    }}>
      <KPICard
        sql="SELECT SUM(total) AS value FROM orders"
        label="Total Revenue"
        format="currency"
      />
      <Chart
        sql="SELECT month, revenue FROM revenue ORDER BY 1"
        type="bar"
        height={300}
      />
      <DataTable sql="SELECT * FROM orders" pageSize={25} sortable />
    </DuckUIProvider>
  )
}
```

### Helper Function

If you have many gateway sources, create a helper:

```tsx
function gatewayFetch(queryKey: string, token?: string) {
  return {
    fetch: () => fetch('/api/pg', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query: queryKey }),
    }).then(r => r.json()),
  }
}

<DuckUIProvider data={{
  orders: gatewayFetch('orders', token),
  revenue: gatewayFetch('revenue_by_month', token),
  customers: gatewayFetch('top_customers', token),
}}>
```

## Backend: Express.js

```js
// server.js
import express from 'express'
import pg from 'pg'
import cors from 'cors'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})

const app = express()
app.use(cors())
app.use(express.json())

// IMPORTANT: Never execute raw SQL from the client.
// Use an allowlist of named queries.
const ALLOWED_QUERIES = {
  orders: 'SELECT id, user_id, total, status, created_at FROM orders',
  revenue_by_month: `
    SELECT date_trunc('month', created_at)::date AS month,
           SUM(total) AS revenue,
           COUNT(*) AS order_count
    FROM orders
    GROUP BY 1
    ORDER BY 1
  `,
  top_customers: `
    SELECT u.name, COUNT(o.id) AS orders, SUM(o.total) AS total_spent
    FROM users u
    JOIN orders o ON o.user_id = u.id
    GROUP BY u.name
    ORDER BY total_spent DESC
    LIMIT 50
  `,
}

app.post('/api/pg', async (req, res) => {
  const queryKey = req.body.query
  const sql = ALLOWED_QUERIES[queryKey]
  if (!sql) {
    return res.status(400).json({ error: `Unknown query: ${queryKey}` })
  }

  try {
    const result = await pool.query(sql)
    res.json(result.rows)
  } catch (err) {
    console.error('Query failed:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(3001, () => console.log('Gateway running on port 3001'))
```

## Backend: Next.js API Route

```ts
// app/api/pg/route.ts
import { Pool } from 'pg'
import { NextRequest, NextResponse } from 'next/server'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const ALLOWED_QUERIES: Record<string, string> = {
  orders: 'SELECT id, user_id, product, total, status, created_at FROM orders',
  revenue_by_month: `
    SELECT date_trunc('month', created_at)::date AS month, SUM(total) AS revenue
    FROM orders GROUP BY 1 ORDER BY 1
  `,
}

export async function POST(request: NextRequest) {
  const { query } = await request.json()
  const sql = ALLOWED_QUERIES[query]
  if (!sql) {
    return NextResponse.json({ error: `Unknown query: ${query}` }, { status: 400 })
  }

  try {
    const result = await pool.query(sql)
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error('Gateway error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

## Security

- **Never pass raw SQL from the client** — use an allowlist of named queries
- **Authenticate requests** — verify JWT/session before executing queries
- **Limit result size** — add LIMIT clauses to prevent massive responses
- **Use row-level filtering** — your backend should filter data by user/tenant before returning it

```ts
// With NextAuth
import { getServerSession } from 'next-auth'

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... rest of handler
}
```

## How It Fits Together

1. `DuckUIProvider` mounts and calls each `fetch` function
2. Your fetch function sends a POST to your gateway endpoint
3. Backend looks up the query key in the allowlist, runs SQL against the real database
4. Backend returns JSON array of rows
5. Duck-UI loads the rows into a DuckDB-WASM table
6. Components query the local table with SQL — filtering, pagination, aggregation all happen in-browser
