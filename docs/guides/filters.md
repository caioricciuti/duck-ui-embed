# Filters

Duck-UI's filter system is reactive and global. When a user changes a filter, every component inside the same `DuckUIProvider` automatically re-queries with the new filter applied.

## How It Works

1. Filter components write to a shared Zustand store via `setFilter(column, value)`
2. The store increments `filterVersion`
3. All `useQuery` / `usePaginatedQuery` hooks depend on `filterVersion` and re-run
4. `FilterInjector.inject()` wraps the original SQL as a subquery and adds WHERE clauses
5. Components re-render with filtered data

```
User clicks "North" in SelectFilter
  → setFilter('region', 'North')
    → filterVersion++
      → useQuery re-runs
        → Original:  SELECT * FROM sales
        → Injected:  SELECT * FROM (SELECT * FROM sales) AS _filtered
                     WHERE "region" = 'North'
```

## FilterBar

Container for filter components. Automatically shows a "Clear filters" button when any filter is active.

```tsx
import { FilterBar, SelectFilter, DateRangeFilter, RangeFilter } from '@duck_ui/embed'

<FilterBar>
  <SelectFilter column="region" source="sales" label="Region" />
  <DateRangeFilter column="date" label="Date" />
  <RangeFilter column="amount" min={0} max={10000} label="Amount" />
</FilterBar>
```

Props:

| Prop | Type | Description |
|------|------|-------------|
| children | `ReactNode` | Filter components |
| className | `string` | CSS class |

## SelectFilter

Single-select dropdown with search and keyboard navigation.

```tsx
// Option 1: Explicit options
<SelectFilter column="region" options={['North', 'South', 'East', 'West']} label="Region" />

// Option 2: Auto-populate from table (runs SELECT DISTINCT)
<SelectFilter column="region" source="sales" label="Region" />
```

Props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| column | `string` | required | Column to filter |
| options | `string[]` | — | Explicit option list |
| source | `string` | — | Table name to query for distinct values |
| label | `string` | — | Display label |
| placeholder | `string` | `'All'` | Placeholder when nothing selected |

When `source` is set, runs `SELECT DISTINCT "column" FROM "source" ORDER BY 1` with `noFilter: true` (so other active filters don't affect the dropdown options).

**Filter value produced:** `string` or `null` (when cleared)

**SQL generated:** `"region" = 'North'`

Features:
- Type-ahead search to filter options
- Keyboard navigation (Arrow Up/Down, Enter, Escape)
- X button to clear selection
- Max height 220px (scrollable)

## MultiSelectFilter

Multi-select as pill/toggle buttons.

```tsx
<MultiSelectFilter
  column="category"
  options={['Electronics', 'Clothing', 'Food', 'Books']}
  label="Category"
/>
```

Props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| column | `string` | required | Column to filter |
| options | `string[]` | required | Available options |
| label | `string` | — | Display label |

**Filter value produced:** `string[]` or `null` (when all deselected)

**SQL generated:** `"category" IN ('Electronics', 'Food')`

## DateRangeFilter

Calendar-based date range picker with month/year navigation.

```tsx
<DateRangeFilter column="order_date" label="Date Range" />
```

Props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| column | `string` | required | Column to filter |
| label | `string` | — | Display label |

**Filter value produced:** `{ start: string, end: string }` (ISO format `YYYY-MM-DD`)

**SQL generated:** `"order_date" BETWEEN '2024-01-01' AND '2024-12-31'`

Features:
- Click day 1, then day 2 to set range (auto-swaps if end < start)
- Live preview on hover while selecting
- Today indicator (blue dot)
- "Today" button to jump to current month
- Click outside or clear button to dismiss

## RangeFilter

Dual-thumb numeric range slider.

```tsx
<RangeFilter column="price" min={0} max={500} step={10} label="Price Range" />
```

Props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| column | `string` | required | Column to filter |
| min | `number` | required | Range minimum |
| max | `number` | required | Range maximum |
| step | `number` | `1` | Step increment |
| label | `string` | — | Display label |

**Filter value produced:** `{ min: number, max: number }` or `null` (when at full range)

**SQL generated:** `"price" >= 50 AND "price" <= 300`

Features:
- Drag either thumb to adjust
- Click track to jump nearest thumb
- Auto-clears filter when range equals [min, max]
- Keyboard: Arrow keys adjust by step

## FilterValue Types

The full `FilterValue` union:

```ts
type FilterValue =
  | string                          // Exact match
  | number                          // Exact match
  | boolean                         // Exact match
  | string[]                        // IN clause
  | number[]                        // IN clause
  | { min: number; max: number }    // Numeric range
  | { start: string; end: string }  // Date range
  | null                            // No filter (skipped)
```

## SQL Condition Mapping

| FilterValue | SQL Generated |
|-------------|--------------|
| `'North'` | `"col" = 'North'` |
| `42` | `"col" = 42` |
| `true` | `"col" = true` |
| `['A', 'B', 'C']` | `"col" IN ('A', 'B', 'C')` |
| `[1, 2, 3]` | `"col" IN (1, 2, 3)` |
| `{ min: 10, max: 100 }` | `"col" >= 10 AND "col" <= 100` |
| `{ start: '2024-01-01', end: '2024-12-31' }` | `"col" BETWEEN '2024-01-01' AND '2024-12-31'` |
| `null` | _(skipped — no condition added)_ |

## FilterInjector

The `FilterInjector` class handles SQL rewriting. It wraps the original SQL as a subquery and appends WHERE clauses:

```ts
import { FilterInjector } from '@duck_ui/embed'

const sql = 'SELECT * FROM sales'
const filters = { region: 'North', amount: { min: 100, max: 5000 } }

const injected = FilterInjector.inject(sql, filters, 'sales')
// SELECT * FROM (SELECT * FROM sales) AS _filtered
// WHERE "region" = 'North' AND "amount" >= 100 AND "amount" <= 5000
```

**Safety:** Identifiers are quoted with double quotes (inner quotes doubled). String values are escaped with single quotes (doubled). This prevents SQL injection from filter values.

## Programmatic Filters

You can set filters programmatically without using filter components:

```tsx
function MyComponent() {
  const { setFilter, clearFilters, filters } = useDuckUI()

  // Set a filter
  setFilter('region', 'North')

  // Set a date range filter
  setFilter('date', { start: '2024-01-01', end: '2024-06-30' })

  // Clear a single filter
  setFilter('region', null)

  // Clear all filters
  clearFilters()

  // Read current filters
  console.log(filters) // { date: { start: '2024-01-01', end: '2024-06-30' } }
}
```

## Skipping Filter Injection

Use `noFilter: true` on `useQuery` to skip filter injection for a specific query:

```tsx
// This query won't have filters applied — useful for:
// - Filter option lists (SELECT DISTINCT)
// - Metadata queries
// - Aggregate queries that should always show full data
const { data } = useQuery(
  'SELECT DISTINCT region FROM sales ORDER BY 1',
  { noFilter: true }
)
```

The `SelectFilter` component uses `noFilter: true` internally when auto-populating from a `source` table, so the dropdown always shows all options regardless of other active filters.
