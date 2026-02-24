# Example: Next.js Gateway for PostgreSQL

A gateway API route using Next.js App Router.

## Backend: API Route

### Install

```bash
npm install pg
```

### API Route

```ts
// app/api/pg/route.ts
import { Pool } from 'pg'
import { NextRequest, NextResponse } from 'next/server'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Allowlist of safe queries — NEVER execute raw client SQL
const ALLOWED_QUERIES: Record<string, string> = {
  users: 'SELECT id, name, email, role, created_at FROM users',
  orders: 'SELECT id, user_id, product, total, status, created_at FROM orders',
  revenue_by_month: `
    SELECT date_trunc('month', created_at)::date AS month,
           SUM(total) AS revenue
    FROM orders
    GROUP BY 1
    ORDER BY 1
  `,
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    const sql = ALLOWED_QUERIES[query]
    if (!sql) {
      return NextResponse.json(
        { error: `Unknown query: ${query}` },
        { status: 400 }
      )
    }

    const result = await pool.query(sql)
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error('Gateway error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Frontend: Client Component

```tsx
// app/dashboard/page.tsx
'use client'

import { DuckProvider, DataTable, Chart, KPICard } from '@duck_ui/embed'

export default function DashboardPage() {
  return (
    <DuckProvider
      config={{
        sources: [
          {
            type: 'postgres',
            name: 'orders',
            endpoint: '/api/pg',
            query: 'orders',
          },
          {
            type: 'postgres',
            name: 'revenue',
            endpoint: '/api/pg',
            query: 'revenue_by_month',
          },
        ],
      }}
    >
      <h1>Sales Dashboard</h1>

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
    </DuckProvider>
  )
}
```

## Key Points

1. **`'use client'`** — DuckProvider and all Duck-UI components require client-side rendering (DuckDB-WASM runs in the browser)
2. **Relative endpoint** — `/api/pg` works because Next.js serves both the page and the API route from the same origin
3. **No CORS needed** — same-origin requests don't require CORS headers
4. **Query keys, not SQL** — the frontend sends `"orders"` (a key), not raw SQL. The backend maps it to actual SQL.

## With Authentication (NextAuth)

```ts
// app/api/pg/route.ts
import { getServerSession } from 'next-auth'

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { query } = await request.json()
  const sql = ALLOWED_QUERIES[query]
  if (!sql) {
    return NextResponse.json({ error: `Unknown query: ${query}` }, { status: 400 })
  }

  const result = await pool.query(sql)
  return NextResponse.json(result.rows)
}
```

No extra headers needed on the frontend — NextAuth session cookies are sent automatically with same-origin requests.

## With Multiple Databases

```ts
// app/api/pg/route.ts
const pools = {
  main: new Pool({ connectionString: process.env.MAIN_DATABASE_URL }),
  analytics: new Pool({ connectionString: process.env.ANALYTICS_DATABASE_URL }),
}

const ALLOWED_QUERIES: Record<string, { db: keyof typeof pools; sql: string }> = {
  orders: { db: 'main', sql: 'SELECT * FROM orders' },
  events: { db: 'analytics', sql: 'SELECT * FROM events LIMIT 100000' },
}

export async function POST(request: NextRequest) {
  const { query } = await request.json()
  const entry = ALLOWED_QUERIES[query]
  if (!entry) {
    return NextResponse.json({ error: 'Unknown query' }, { status: 400 })
  }

  const result = await pools[entry.db].query(entry.sql)
  return NextResponse.json(result.rows)
}
```
