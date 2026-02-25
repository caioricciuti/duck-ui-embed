# Example: Express.js Gateway for PostgreSQL

A complete backend gateway that lets Duck-UI query your PostgreSQL database.

## Backend Setup

### Install Dependencies

```bash
npm install express pg cors
```

### Server Code

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

// -----------------------------------------------
// IMPORTANT: Never execute raw SQL from the client.
// Use an allowlist of named queries.
// -----------------------------------------------
const ALLOWED_QUERIES = {
  users: 'SELECT id, name, email, role, created_at FROM users',
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

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`)
})
```

### Run

```bash
DATABASE_URL=postgres://user:pass@localhost:5432/mydb node server.js
```

## Frontend

```tsx
import { DuckUIProvider, DataTable, Chart, KPICard } from '@duck_ui/embed'

function gatewayFetch(queryKey: string) {
  return {
    fetch: () => fetch('http://localhost:3001/api/pg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: queryKey }),
    }).then(r => r.json()),
  }
}

function App() {
  return (
    <DuckUIProvider data={{
      orders: gatewayFetch('orders'),
      revenue: gatewayFetch('revenue_by_month'),
      top_customers: gatewayFetch('top_customers'),
    }}>
      <KPICard
        sql="SELECT SUM(total_spent) AS value FROM top_customers"
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

## With Authentication

Add a JWT/Bearer token to gateway requests:

```tsx
function gatewayFetch(queryKey: string, token: string) {
  return {
    fetch: () => fetch('http://localhost:3001/api/pg', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query: queryKey }),
    }).then(r => r.json()),
  }
}
```

Backend middleware:

```js
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

app.post('/api/pg', authMiddleware, async (req, res) => {
  // ... existing handler
})
```

## How It Works

1. `DuckUIProvider` mounts and calls each `fetch` function
2. Each fetch sends a POST to `http://localhost:3001/api/pg`
3. Backend looks up the query key in the allowlist, runs SQL against Postgres
4. Backend returns JSON array of rows
5. Duck-UI loads the rows into DuckDB-WASM tables
6. Components query the local tables with SQL
