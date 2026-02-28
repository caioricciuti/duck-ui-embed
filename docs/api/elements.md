# @duck_ui/elements API Reference

Web Components for Duck-UI. Works in any framework (or no framework) -- just HTML attributes and DOM events. Built on `@duck_ui/core`.

```bash
bun add @duck_ui/elements @duckdb/duckdb-wasm
```

Or via CDN (no install needed):

```html
<script src="https://unpkg.com/@duck_ui/cdn/dist/duck-ui.min.js"></script>
```

---

## Table of Contents

- [Registration](#registration)
- [Elements](#elements)
  - [duck-provider](#duck-provider)
  - [duck-chart](#duck-chart)
  - [duck-table](#duck-table)
  - [duck-kpi](#duck-kpi)
  - [duck-dashboard](#duck-dashboard)
  - [duck-panel](#duck-panel)
  - [duck-filter-bar](#duck-filter-bar)
  - [duck-select-filter](#duck-select-filter)
  - [duck-range-filter](#duck-range-filter)
  - [duck-date-filter](#duck-date-filter)
  - [duck-export](#duck-export)
- [Events](#events)
- [Theming](#theming)

---

## Registration

When using `@duck_ui/elements` directly, call `register()` to define all custom elements:

```ts
import { register } from '@duck_ui/elements'
register()
```

When using the CDN bundle (`@duck_ui/cdn`), registration is automatic -- no call needed.

---

## Elements

### duck-provider

Root element that manages the DuckUI engine, theme, and filter state. All other Duck-UI elements must be descendants of a `<duck-provider>`.

#### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `src` | `string` | -- | URL to a data file (CSV, JSON, or Parquet) |
| `table` | `string` | -- | Table name for the `src` data |
| `format` | `'csv' \| 'json' \| 'parquet'` | auto-detect | Format of the `src` file |
| `theme` | `'light' \| 'dark'` | `'light'` | Built-in theme |

#### Methods

##### load(data)

Load data programmatically. Same `DataInput` types as the core API.

```ts
document.querySelector('duck-provider').load({
  orders: [{ id: 1, product: 'Widget', total: 99.50 }],
  sales: { url: '/data/sales.parquet', format: 'parquet' },
})
```

#### Usage

```html
<!-- Declarative: load a single file -->
<duck-provider src="/data/sales.parquet" table="sales" format="parquet" theme="light">
  <!-- child elements here -->
</duck-provider>

<!-- Programmatic: load multiple tables -->
<duck-provider id="app">
  <duck-table sql="SELECT * FROM orders"></duck-table>
</duck-provider>

<script type="module">
  import { register } from '@duck_ui/elements'
  register()

  document.getElementById('app').load({
    orders: [{ id: 1, product: 'Widget', total: 99.50 }],
  })
</script>
```

---

### duck-chart

SQL-driven chart powered by uPlot. Supports line, bar, area, and scatter types.

#### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `sql` | `string` | **required** | SQL query to execute |
| `type` | `'line' \| 'bar' \| 'area' \| 'scatter'` | `'line'` | Chart type |
| `height` | `number` | `300` | Chart height in pixels |
| `width` | `number` | auto (fills container) | Chart width in pixels |
| `title` | `string` | -- | Chart title |

**Data transformation:** First column of the query result becomes the x-axis, remaining columns become y-series.

```html
<duck-chart
  sql="SELECT month, SUM(revenue) AS rev FROM sales GROUP BY 1 ORDER BY 1"
  type="bar"
  height="350"
  title="Monthly Revenue"
></duck-chart>
```

---

### duck-table

Paginated, sortable data table rendered as pure DOM (no virtual scrolling).

#### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `sql` | `string` | **required** | SQL query to execute |
| `page-size` | `number` | `25` | Rows per page |
| `sortable` | `boolean` | `false` | Enable column sorting (presence = true) |
| `striped` | `boolean` | `false` | Alternate row colors (presence = true) |
| `max-height` | `string` | -- | Max scroll container height (CSS value) |

Pagination and sorting happen at the SQL level -- only the visible page is loaded.

```html
<duck-table
  sql="SELECT * FROM orders"
  page-size="50"
  sortable
  striped
  max-height="500px"
></duck-table>
```

---

### duck-kpi

Single-value KPI card with optional comparison and sparkline.

#### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `sql` | `string` | **required** | Query returning a single value (first column, first row) |
| `label` | `string` | **required** | KPI label |
| `format` | `'currency' \| 'percent' \| 'number' \| 'compact'` | -- | Value formatter |
| `currency` | `string` | `'USD'` | Currency code (when format is `'currency'`) |
| `compare-sql` | `string` | -- | Previous period value for % change |
| `sparkline-sql` | `string` | -- | Time series query for inline trend line |

```html
<duck-kpi
  sql="SELECT SUM(total) AS value FROM orders"
  label="Total Revenue"
  format="currency"
  currency="USD"
  compare-sql="SELECT SUM(total) AS value FROM orders WHERE year = 2024"
  sparkline-sql="SELECT month, SUM(total) FROM orders GROUP BY 1 ORDER BY 1"
></duck-kpi>
```

---

### duck-dashboard

CSS Grid layout container for organizing panels.

#### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `columns` | `1 \| 2 \| 3 \| 4` | `2` | Grid columns at full width |
| `gap` | `number` | `16` | Gap between panels (px) |
| `padding` | `number` | `24` | Container padding (px) |

Responsive breakpoints (auto-reduces columns):
- `< 480px` -- 1 column
- `< 768px` -- max 2 columns
- `< 1024px` -- max 3 columns
- `>= 1024px` -- columns as specified

```html
<duck-dashboard columns="3" gap="16" padding="24">
  <duck-panel span="2">
    <duck-chart sql="..." type="bar" height="300"></duck-chart>
  </duck-panel>
  <duck-panel>
    <duck-kpi sql="..." label="Orders"></duck-kpi>
  </duck-panel>
</duck-dashboard>
```

---

### duck-panel

Grid item wrapper. Must be a direct child of `<duck-dashboard>`.

#### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `span` | `number` | `1` | Column span |
| `row-span` | `number` | `1` | Row span |

---

### duck-filter-bar

Container for filter elements. Shows a "Clear filters" button when any filter is active.

#### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `auto` | `string` | -- | Auto-detect filters from table schema |
| `source` | `string` | -- | Table to read distinct values from |

```html
<!-- Auto mode: detect filters from column types -->
<duck-filter-bar auto="orders"></duck-filter-bar>

<!-- Manual mode: compose individual filter elements -->
<duck-filter-bar>
  <duck-select-filter column="status" source="orders" label="Status"></duck-select-filter>
  <duck-range-filter column="total" min="0" max="1000" label="Total"></duck-range-filter>
  <duck-date-filter column="created_at" label="Date"></duck-date-filter>
</duck-filter-bar>
```

---

### duck-select-filter

Searchable single-select dropdown with keyboard navigation.

#### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `column` | `string` | **required** | Column to filter |
| `source` | `string` | -- | Table to query DISTINCT values from |
| `label` | `string` | -- | Display label |

```html
<duck-select-filter column="region" source="sales" label="Region"></duck-select-filter>
```

---

### duck-range-filter

Dual-thumb numeric range slider.

#### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `column` | `string` | **required** | Column to filter |
| `min` | `number` | **required** | Range minimum |
| `max` | `number` | **required** | Range maximum |
| `step` | `number` | `1` | Step increment |
| `label` | `string` | -- | Display label |

```html
<duck-range-filter column="price" min="0" max="500" step="10" label="Price"></duck-range-filter>
```

---

### duck-date-filter

Calendar date picker for date/timestamp columns.

#### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `column` | `string` | **required** | Column to filter |
| `label` | `string` | -- | Display label |

```html
<duck-date-filter column="created_at" label="Date"></duck-date-filter>
```

---

### duck-export

Export button that downloads query results as CSV or JSON.

#### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `sql` | `string` | **required** | SQL query to export |
| `format` | `'csv' \| 'json'` | `'csv'` | Export format |
| `file-name` | `string` | `'export'` | Download file name (without extension) |
| `label` | `string` | `'Export'` | Button label |

```html
<duck-export sql="SELECT * FROM sales" format="csv" file-name="sales-report" label="Download CSV"></duck-export>
```

---

## Events

All Duck-UI custom elements dispatch standard `CustomEvent`s that bubble through the DOM.

| Event | Dispatched By | Detail | Description |
|-------|---------------|--------|-------------|
| `duck-ready` | `duck-provider` | `{}` | Engine initialized and data loaded |
| `duck-error` | `duck-provider` | `{ error: Error }` | Initialization or query error |
| `duck-filter-change` | `duck-filter-bar`, filter elements | `{ column: string, value: FilterValue }` | A filter value changed |

```html
<duck-provider id="app">...</duck-provider>

<script>
  const provider = document.getElementById('app')

  provider.addEventListener('duck-ready', () => {
    console.log('Engine is ready')
  })

  provider.addEventListener('duck-error', (e) => {
    console.error('Error:', e.detail.error)
  })

  provider.addEventListener('duck-filter-change', (e) => {
    console.log(`Filter ${e.detail.column} = ${e.detail.value}`)
  })
</script>
```

---

## Theming

Web Components use CSS custom properties (`--duck-*`) for theming. Set the `theme` attribute on `<duck-provider>` for built-in themes, or override individual properties:

```html
<!-- Built-in theme -->
<duck-provider theme="dark">...</duck-provider>

<!-- Custom overrides -->
<style>
  duck-provider {
    --duck-background: #1a1a2e;
    --duck-text-color: #eaeaea;
    --duck-primary-color: #e94560;
    --duck-surface-color: #16213e;
    --duck-border-color: #0f3460;
    --duck-palette: #e94560, #0f3460, #533483, #16213e;
  }
</style>
```

### Available CSS Custom Properties

| Property | Description |
|----------|-------------|
| `--duck-background` | Background color |
| `--duck-text-color` | Primary text color |
| `--duck-primary-color` | Accent / primary color |
| `--duck-surface-color` | Card / panel background |
| `--duck-border-color` | Borders and dividers |
| `--duck-hover-color` | Hover state background |
| `--duck-muted-text-color` | Secondary text |
| `--duck-stripe-color` | Table stripe background |
| `--duck-grid-color` | Chart grid lines |
| `--duck-axis-color` | Chart axis lines |
| `--duck-palette` | Comma-separated chart series colors |
| `--duck-font-family` | Font family |
| `--duck-font-size` | Base font size |

---

## Full Example

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/@duck_ui/cdn/dist/duck-ui.min.js"></script>
</head>
<body>
  <duck-provider id="app" theme="light">
    <duck-filter-bar>
      <duck-select-filter column="status" source="orders" label="Status"></duck-select-filter>
      <duck-range-filter column="total" min="0" max="500" label="Total"></duck-range-filter>
    </duck-filter-bar>

    <duck-dashboard columns="3" gap="16">
      <duck-panel>
        <duck-kpi
          sql="SELECT COUNT(*) AS value FROM orders"
          label="Total Orders"
        ></duck-kpi>
      </duck-panel>
      <duck-panel>
        <duck-kpi
          sql="SELECT SUM(total) AS value FROM orders"
          label="Revenue"
          format="currency"
        ></duck-kpi>
      </duck-panel>
      <duck-panel>
        <duck-kpi
          sql="SELECT AVG(total) AS value FROM orders"
          label="Avg Order"
          format="currency"
        ></duck-kpi>
      </duck-panel>
      <duck-panel span="2">
        <duck-chart
          sql="SELECT status, SUM(total) AS revenue FROM orders GROUP BY 1"
          type="bar"
          height="300"
        ></duck-chart>
      </duck-panel>
      <duck-panel>
        <duck-export sql="SELECT * FROM orders" format="csv" file-name="orders"></duck-export>
      </duck-panel>
      <duck-panel span="3">
        <duck-table sql="SELECT * FROM orders" page-size="25" sortable striped></duck-table>
      </duck-panel>
    </duck-dashboard>
  </duck-provider>

  <script>
    document.getElementById('app').load({
      orders: [
        { id: 1, product: 'Widget', status: 'shipped', total: 99.50 },
        { id: 2, product: 'Gadget', status: 'pending', total: 149.00 },
        { id: 3, product: 'Doohickey', status: 'shipped', total: 249.00 },
        { id: 4, product: 'Thingamajig', status: 'returned', total: 59.99 },
      ],
    })
  </script>
</body>
</html>
```
