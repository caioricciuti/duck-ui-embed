# Charts

Duck-UI provides three chart components built on [uPlot](https://github.com/leeoniya/uPlot) — a fast, lightweight charting library.

## Chart Component (SQL-Driven)

The easiest way to render a chart. Pass a SQL query and Duck-UI handles the rest:

```tsx
import { Chart } from '@duck_ui/embed'

<Chart
  sql="SELECT month, SUM(revenue) AS rev FROM sales GROUP BY 1 ORDER BY 1"
  type="bar"
  height={300}
/>
```

**How data transforms:**
- First column → x-axis
- Remaining columns → y-series

If the first column contains strings (e.g., month names), they become categorical labels. If numeric (e.g., timestamps), they're used as x-values directly.

```sql
-- Categorical x-axis (strings)
SELECT region, SUM(revenue) AS rev FROM sales GROUP BY 1
-- → xLabels: ['North', 'South', ...], data: [[0, 1, ...], [rev1, rev2, ...]]

-- Numeric x-axis (dates/numbers)
SELECT EXTRACT(EPOCH FROM date) AS ts, SUM(revenue) FROM sales GROUP BY 1
-- → data: [[ts1, ts2, ...], [rev1, rev2, ...]]
```

## UChart (Low-Level)

Direct access to the chart with full control over data format:

```tsx
import { UChart } from '@duck_ui/embed'

<UChart
  data={[
    [1, 2, 3, 4, 5],        // x-values
    [10, 25, 15, 30, 20],   // series 1
    [5, 15, 10, 20, 25],    // series 2
  ]}
  type="line"
  height={300}
  labels={['Revenue', 'Profit']}
  colors={['#2563eb', '#16a34a']}
/>
```

Data format is `[number[], ...number[][]]` (uPlot's AlignedData):
- First array: x-values (shared across all series)
- Subsequent arrays: y-values for each series

## Chart Types

### Line

```tsx
<UChart data={data} type="line" height={300} />
```

Default chart type. Points with connecting lines. Supports x-axis drag selection via `onRangeSelect`.

### Bar

```tsx
<UChart
  data={[[0, 1, 2], [100, 200, 150]]}
  type="bar"
  height={300}
  xLabels={['Jan', 'Feb', 'Mar']}
/>
```

Categorical bar chart. Best with `xLabels` for category names.

### Area

```tsx
<UChart data={data} type="area" height={300} />
```

Line chart with filled area below. Same behavior as line but with fill.

### Scatter

```tsx
<UChart data={data} type="scatter" height={300} />
```

Points only, no connecting lines. Supports xy-drag selection.

## PieChart

Canvas-based pie and donut charts:

```tsx
import { PieChart } from '@duck_ui/embed'

// Pie chart
<PieChart
  values={[40, 30, 20, 10]}
  labels={['Electronics', 'Clothing', 'Food', 'Books']}
  size={300}
/>

// Donut chart
<PieChart
  values={[40, 30, 20, 10]}
  labels={['Electronics', 'Clothing', 'Food', 'Books']}
  donut={0.6}
  size={300}
/>
```

Set `donut` to a value between 0 and 1 to control the inner radius ratio. `0` = full pie, `0.6` = donut.

## Sparkline

Minimal inline trend chart — no axes, legend, or cursor:

```tsx
import { Sparkline } from '@duck_ui/embed'

<Sparkline data={[10, 20, 15, 25, 30, 28, 35]} width={140} height={28} color="#2563eb" />
```

Use inside KPI cards or table cells for inline trend visualization.

## Axes

Configure axis labels and formatting:

```tsx
<UChart
  data={data}
  type="line"
  height={300}
  axes={{
    x: { label: 'Date', format: 'date' },
    y: { label: 'Revenue ($)', format: 'currency' },
  }}
/>
```

Built-in format presets:

| Format | Output Example |
|--------|---------------|
| `'number'` | `1,234` or `1.5K` / `2.3M` |
| `'currency'` | `$1,234.00` |
| `'percent'` | `45.2%` |
| `'date'` | `Jan 1, 2024` (from Unix timestamp) |

Custom formatter:

```tsx
axes={{
  y: {
    label: 'Weight',
    format: (value) => `${value} kg`,
  },
}}
```

## Tooltip

Tooltips are enabled by default. Customize them:

```tsx
import { UChart, tooltipPlugin } from '@duck_ui/embed'

<UChart
  data={data}
  type="line"
  height={300}
  tooltip={{
    formatValue: (v) => `$${v.toLocaleString()}`,
    formatX: (v) => new Date(v * 1000).toLocaleDateString(),
  }}
/>

// Or disable tooltips entirely
<UChart data={data} type="line" tooltip={false} />
```

The tooltip automatically repositions to stay within the chart bounds.

## Event Handlers

### Point Click

```tsx
<UChart
  data={data}
  type="bar"
  height={300}
  onPointClick={(seriesIdx, dataIdx, value) => {
    console.log(`Clicked series ${seriesIdx}, point ${dataIdx}, value ${value}`)
  }}
/>
```

### Range Selection

```tsx
<UChart
  data={data}
  type="line"
  height={300}
  onRangeSelect={(min, max) => {
    console.log(`Selected range: ${min} to ${max}`)
  }}
/>
```

Works with line and area charts (x-axis drag) and scatter charts (xy-drag).

## Themes

Switch between light and dark themes:

```tsx
import { UChart, darkTheme } from '@duck_ui/embed'

<UChart data={data} type="line" theme={darkTheme} height={300} />
```

Create a custom theme:

```tsx
const myTheme = {
  background: '#0f172a',
  textColor: '#e2e8f0',
  gridColor: '#1e293b',
  axisColor: '#475569',
  palette: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444'],
  fontFamily: 'Inter, sans-serif',
  fontSize: 12,
}

<UChart data={data} type="line" theme={myTheme} height={300} />
```

## Color Palettes

Three built-in palettes (8 colors each):

```tsx
import { defaultPalette, darkPalette, colorblindPalette } from '@duck_ui/embed'
```

| Palette | Best For |
|---------|----------|
| `defaultPalette` | Light backgrounds |
| `darkPalette` | Dark backgrounds |
| `colorblindPalette` | Accessibility (safe for color-vision deficiency) |

Override colors per chart:

```tsx
<UChart data={data} type="bar" colors={['#2563eb', '#16a34a', '#dc2626']} height={300} />
```

## Presets

Presets configure uPlot behavior for each chart type:

| Preset | Cursor Drag | Points | Scale |
|--------|------------|--------|-------|
| `linePreset` | x-axis | Yes | Discrete, evenly-spaced |
| `barPreset` | None | No | Discrete, categorical |
| `areaPreset` | x-axis | Yes | Discrete, evenly-spaced |
| `scatterPreset` | xy-box | Yes (paths.points) | Default |

You typically don't need to use presets directly — set `type="line"` etc. and the correct preset is applied automatically.

## Format Utilities

Standalone formatting functions:

```tsx
import { formatNumber, formatCurrency, formatPercent, formatDate } from '@duck_ui/embed'

formatNumber(1500)       // '1.5K'
formatNumber(2300000)    // '2.3M'
formatCurrency(1234.5)   // '$1,234.50'
formatPercent(0.452)     // '45.2%'
formatDate(1704067200)   // 'Jan 1, 2024'
```

Build axis tick formatters:

```tsx
import { buildAxisFormatter } from '@duck_ui/embed'

const fmt = buildAxisFormatter('currency')
fmt(1234) // '$1,234.00'
```
