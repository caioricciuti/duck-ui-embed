# Example: Sales Dashboard

A complete, copy-paste-ready sales dashboard using the free Duck-UI packages.

## Install

```bash
bun add @duck_ui/embed @duckdb/duckdb-wasm
```

## Full Code

```tsx
import {
  DuckProvider,
  DataTable,
  Chart,
  KPICard,
  FilterBar,
  SelectFilter,
  DateRangeFilter,
  RangeFilter,
  ExportButton,
  useQuery,
} from '@duck_ui/embed'

function SalesDashboard() {
  return (
    <DuckProvider
      config={{
        sources: [
          { type: 'url', name: 'sales', url: '/data/sales.parquet' },
        ],
      }}
    >
      <h1>Sales Dashboard</h1>
      <Filters />
      <KPIs />
      <Charts />
      <SalesTable />
    </DuckProvider>
  )
}

function Filters() {
  return (
    <FilterBar>
      <SelectFilter column="region" source="sales" label="Region" />
      <SelectFilter column="category" source="sales" label="Category" />
      <DateRangeFilter column="order_date" label="Date" />
      <RangeFilter column="amount" min={0} max={50000} step={100} label="Amount" />
    </FilterBar>
  )
}

function KPIs() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
      <KPICard
        sql="SELECT SUM(revenue) AS value FROM sales"
        label="Total Revenue"
        format="currency"
        comparisonSql="SELECT SUM(revenue) AS value FROM sales WHERE EXTRACT(YEAR FROM order_date) = 2023"
        sparklineSql="SELECT EXTRACT(MONTH FROM order_date) AS m, SUM(revenue) AS v FROM sales GROUP BY 1 ORDER BY 1"
      />
      <KPICard
        sql="SELECT COUNT(*) AS value FROM sales"
        label="Total Orders"
        format="compact"
      />
      <KPICard
        sql="SELECT AVG(revenue) AS value FROM sales"
        label="Avg Order Value"
        format="currency"
      />
      <KPICard
        sql="SELECT COUNT(DISTINCT customer_id) AS value FROM sales"
        label="Unique Customers"
        format="number"
      />
    </div>
  )
}

function Charts() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
      <Chart
        sql={`
          SELECT
            EXTRACT(MONTH FROM order_date) AS month,
            SUM(revenue) AS revenue,
            SUM(profit) AS profit
          FROM sales
          GROUP BY 1
          ORDER BY 1
        `}
        type="bar"
        height={350}
        labels={['Revenue', 'Profit']}
      />
      <Chart
        sql={`
          SELECT region, SUM(revenue) AS revenue
          FROM sales
          GROUP BY 1
          ORDER BY 2 DESC
        `}
        type="bar"
        height={350}
      />
    </div>
  )
}

function SalesTable() {
  const { data } = useQuery('SELECT * FROM sales LIMIT 0')

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Sales Data</h2>
        <ExportButton data={data} format="csv" fileName="sales-export" label="Export CSV" />
      </div>
      <DataTable
        sql="SELECT order_id, customer_id, region, category, revenue, profit, order_date FROM sales"
        pageSize={25}
        sortable
        resizable
      />
    </div>
  )
}

export default SalesDashboard
```

## What This Demonstrates

- **DuckProvider** with a Parquet URL source
- **FilterBar** with 4 filter types (SelectFilter from source, DateRangeFilter, RangeFilter)
- **KPICard** with format presets, comparison, and sparkline
- **Chart** with multi-series bar chart and single-series bar chart
- **DataTable** with SQL-level pagination and sorting
- **ExportButton** for CSV download
- **Reactive filters** — all components update when any filter changes

## Data Requirements

The example assumes a `sales.parquet` file with these columns:

| Column | Type | Description |
|--------|------|-------------|
| order_id | `INTEGER` | Unique order ID |
| customer_id | `INTEGER` | Customer ID |
| region | `VARCHAR` | Sales region |
| category | `VARCHAR` | Product category |
| revenue | `DOUBLE` | Order revenue |
| profit | `DOUBLE` | Order profit |
| amount | `DOUBLE` | Order amount |
| order_date | `DATE` | Order date |

Replace the URL and column names to match your data.
