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
import { DuckProvider, DataTable, Chart, KPICard } from '@duck_ui/embed'

function App() {
  return (
    <DuckProvider
      config={{
        sources: [
          {
            type: 'postgres',
            name: 'orders',
            endpoint: 'http://localhost:3001/api/pg',
            query: 'orders',
          },
          {
            type: 'postgres',
            name: 'revenue',
            endpoint: 'http://localhost:3001/api/pg',
            query: 'revenue_by_month',
          },
          {
            type: 'postgres',
            name: 'top_customers',
            endpoint: 'http://localhost:3001/api/pg',
            query: 'top_customers',
          },
        ],
      }}
    >
      <KPICard
        sql="SELECT SUM(total_spent) AS value FROM top_customers"
        label="Total Revenue"
        format="currency"
      />
      <Chart
        sql="SELECT month, revenue FROM revenue GROUP BY 1 ORDER BY 1"
        type="bar"
        height={300}
      />
      <DataTable sql="SELECT * FROM orders" pageSize={25} />
    </DuckProvider>
  )
}
```

## With Authentication

Add a JWT/Bearer token to gateway requests:

```tsx
{
  type: 'postgres',
  name: 'orders',
  endpoint: 'http://localhost:3001/api/pg',
  query: 'orders',
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
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

1. `DuckProvider` mounts and starts loading sources
2. For each `postgres` source, `GatewaySource` sends a POST request:
   ```
   POST http://localhost:3001/api/pg
   Content-Type: application/json

   { "query": "orders" }
   ```
3. Backend looks up "orders" in the allowlist, runs the SQL against Postgres
4. Backend returns JSON array of rows
5. `GatewaySource` detects `application/json` Content-Type, registers the data as a file buffer
6. DuckDB-WASM creates a table: `CREATE OR REPLACE TABLE "orders" AS SELECT * FROM read_json_auto('orders.json')`
7. Components can now query the `orders` table with SQL
