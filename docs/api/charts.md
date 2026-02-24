# @duck_ui/charts API Reference

A React charting library built on [uPlot](https://github.com/leeoniya/uPlot) for high-performance, lightweight chart rendering. Includes line, bar, area, scatter, pie, and sparkline chart types with theming, tooltips, and accessibility-friendly palettes.

---

## Table of Contents

- [Components](#components)
  - [UChart](#uchart)
  - [PieChart](#piechart)
  - [Sparkline](#sparkline)
- [Presets](#presets)
- [Tooltip Plugin](#tooltip-plugin)
- [Themes](#themes)
- [Color Palettes](#color-palettes)
- [Format Utilities](#format-utilities)
- [Hooks](#hooks)
  - [useResizeObserver](#useresizeobserver)
- [Types](#types)

---

## Components

### UChart

The main chart component. Supports line, bar, area, and scatter chart types powered by uPlot.

```tsx
import { UChart } from '@duck_ui/charts'

const data = [
  [0, 1, 2, 3, 4],           // x-values
  [10, 40, 30, 50, 20],      // series 1
  [5, 25, 35, 15, 45],       // series 2
]

function MyChart() {
  return (
    <UChart
      data={data}
      type="line"
      height={400}
      labels={['Month', 'Revenue', 'Costs']}
      axes={{
        x: { label: 'Month', format: 'number' },
        y: { label: 'USD', format: 'currency' },
      }}
      onPointClick={(seriesIdx, dataIdx, value) => {
        console.log(`Clicked series ${seriesIdx}, point ${dataIdx}: ${value}`)
      }}
    />
  )
}
```

#### UChartProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `[number[], ...number[][]]` (uPlot.AlignedData) | **required** | Array of arrays. The first sub-array contains x-values; each subsequent sub-array is a y-series. |
| `type` | `'line' \| 'bar' \| 'area' \| 'scatter'` | `'line'` | Chart type. Each type applies a different preset controlling cursor behavior, point rendering, and scale distribution. |
| `width` | `number` | auto (container width via `useResizeObserver`) | Chart width in pixels. When omitted, the chart fills its container and resizes automatically. |
| `height` | `number` | `300` | Chart height in pixels. |
| `title` | `string` | -- | Chart title displayed above the plot area. |
| `colors` | `string[]` | `theme.palette` (falls back to `defaultPalette`) | Series colors. Colors cycle when there are more series than colors. |
| `legend` | `boolean` | `true` | Show the uPlot legend below the chart. Note: when `tooltip` is enabled (the default), the built-in legend is hidden in favor of the tooltip display. |
| `labels` | `string[]` | -- | Series labels. Index 0 labels the x-axis series; indices 1+ label each y-series. Unlabeled series default to `"Series N"`. |
| `xLabels` | `string[]` | -- | Categorical x-axis labels. When provided, indices are used as x-values and `xLabels` are rendered as tick labels. Long label sets (>6 items) are rotated -45 degrees automatically. |
| `axes` | `{ x?: AxisOptions; y?: AxisOptions }` | -- | Axis configuration for labels and tick formatting. |
| `theme` | `ChartTheme` | `lightTheme` | Visual theme controlling background, text, grid, and axis colors, palette, font, and font size. |
| `tooltip` | `TooltipOptions \| boolean` | `true` | Tooltip configuration. Pass `true` to enable with defaults, `false` to disable, or a `TooltipOptions` object for custom formatting. |
| `className` | `string` | -- | CSS class applied to the outer container `<div>`. |
| `onPointClick` | `(seriesIdx: number, dataIdx: number, value: number) => void` | -- | Called when a data point is clicked. Fires for the first non-null series at the cursor index. |
| `onRangeSelect` | `(min: number, max: number) => void` | -- | Called when a range is selected by dragging on the chart. Receives the min and max x-values of the selection. |

#### AxisOptions

```ts
interface AxisOptions {
  /** Axis label text */
  label?: string
  /** Tick format preset or custom formatter function */
  format?: 'number' | 'currency' | 'percent' | 'date' | ((value: number) => string)
}
```

#### Bar chart example

```tsx
import { UChart } from '@duck_ui/charts'

function BarChart() {
  return (
    <UChart
      data={[
        [0, 1, 2, 3],
        [120, 200, 150, 300],
      ]}
      type="bar"
      xLabels={['Q1', 'Q2', 'Q3', 'Q4']}
      labels={['Quarter', 'Sales']}
      axes={{ y: { format: 'currency' } }}
    />
  )
}
```

#### Area chart with range selection

```tsx
import { UChart } from '@duck_ui/charts'

function AreaChart() {
  return (
    <UChart
      data={[
        [1, 2, 3, 4, 5, 6],
        [10, 25, 18, 30, 22, 40],
      ]}
      type="area"
      height={350}
      labels={['X', 'Trend']}
      colors={['#10b981']}
      onRangeSelect={(min, max) => {
        console.log(`Selected range: ${min} to ${max}`)
      }}
    />
  )
}
```

#### Scatter chart example

```tsx
import { UChart } from '@duck_ui/charts'

function ScatterChart() {
  return (
    <UChart
      data={[
        [1.2, 2.5, 3.1, 4.8, 5.3, 6.7],
        [3.4, 1.2, 5.6, 2.3, 4.1, 3.8],
      ]}
      type="scatter"
      labels={['X', 'Measurement']}
      colors={['#8b5cf6']}
    />
  )
}
```

---

### PieChart

A canvas-based pie and donut chart component. Renders on a `<canvas>` element with HiDPI (Retina) support.

```tsx
import { PieChart } from '@duck_ui/charts'

function MyPie() {
  return (
    <PieChart
      values={[40, 25, 20, 15]}
      labels={['Desktop', 'Mobile', 'Tablet', 'Other']}
      showLabels
      onClick={(index, value) => {
        console.log(`Clicked slice ${index} with value ${value}`)
      }}
    />
  )
}
```

#### PieChartProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `values` | `number[]` | **required** | Numeric values for each slice. |
| `labels` | `string[]` | -- | Labels for each slice. Displayed on the slice when `showLabels` is `true`. |
| `colors` | `string[]` | `defaultPalette` | Slice fill colors. Colors cycle when there are more slices than colors. |
| `size` | `number` | `200` | Width and height of the canvas in pixels (chart is always square). |
| `showLabels` | `boolean` | `false` | Render labels on each slice. Labels are positioned at 65% of the radius from center. |
| `donut` | `number` | `0` | Inner radius ratio from 0 to 1. `0` renders a full pie; `0.6` renders a donut with 60% inner cutout. |
| `onClick` | `(index: number, value: number) => void` | -- | Called when a slice is clicked. Receives the slice index and its value. |

#### Donut chart example

```tsx
import { PieChart } from '@duck_ui/charts'

function DonutChart() {
  return (
    <PieChart
      values={[60, 30, 10]}
      labels={['Active', 'Idle', 'Offline']}
      donut={0.6}
      size={250}
      showLabels
    />
  )
}
```

---

### Sparkline

A minimal inline trend chart. Renders a tiny line chart with no axes, cursor, legend, or interactive elements. Ideal for embedding within table cells, cards, or dashboards.

```tsx
import { Sparkline } from '@duck_ui/charts'

function InlineTrend() {
  return (
    <span>
      Revenue trend: <Sparkline data={[10, 14, 8, 22, 18, 25, 30]} />
    </span>
  )
}
```

#### SparklineProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `number[]` | **required** | Y-axis data points. X-values are generated automatically as indices (0, 1, 2, ...). |
| `width` | `number` | `100` | Width in pixels. |
| `height` | `number` | `30` | Height in pixels. |
| `color` | `string` | `'#2563eb'` | Line stroke color. |
| `fill` | `boolean` | `false` | Fill the area under the line with a semi-transparent version of `color`. |

#### Sparkline with fill

```tsx
import { Sparkline } from '@duck_ui/charts'

function FilledSparkline() {
  return (
    <Sparkline
      data={[5, 12, 8, 20, 15, 22]}
      width={120}
      height={24}
      color="#10b981"
      fill
    />
  )
}
```

---

## Presets

Presets are factory functions that return partial `uPlot.Options` objects. They configure cursor behavior, drag selection, point rendering, and scale distribution for each chart type. Presets are applied automatically by `UChart` based on the `type` prop, but they can also be imported directly for custom uPlot configurations.

```ts
import { linePreset, barPreset, areaPreset, scatterPreset } from '@duck_ui/charts'
```

| Preset | Cursor Drag | Points | Scale | Description |
|--------|------------|--------|-------|-------------|
| `linePreset()` | x-axis only | Size 6, white fill, width 2 | Discrete (non-time) | Standard line chart with horizontal range selection. |
| `barPreset()` | Disabled | Hidden | Discrete categorical (`distr: 2`) | Categorical bar chart. No drag or cursor points. |
| `areaPreset()` | x-axis only | Size 6, white fill, width 2 | Discrete (non-time) | Same cursor behavior as line. Area fill is applied at the series level by `UChart`. |
| `scatterPreset()` | x and y axes | Size 5, rendered via `uPlot.paths.points` | Discrete (non-time) | Enables rectangular drag selection for both axes. Points rendered as dots. |

### Using a preset directly

```ts
import uPlot from 'uplot'
import { linePreset } from '@duck_ui/charts'

const opts: uPlot.Options = {
  width: 800,
  height: 400,
  ...linePreset(),
  series: [
    {},
    { stroke: '#2563eb', width: 2 },
  ],
}
```

---

## Tooltip Plugin

A uPlot plugin that renders a floating tooltip near the cursor showing the x-value and all visible series values.

```ts
import { tooltipPlugin } from '@duck_ui/charts'
import type { TooltipOptions } from '@duck_ui/charts'
```

### tooltipPlugin

```ts
function tooltipPlugin(options?: TooltipOptions): uPlot.Plugin
```

Creates and returns a uPlot plugin. The tooltip element is appended to the uPlot overlay and positioned automatically.

**Features:**
- Intelligent positioning: flips horizontally and vertically to stay within chart bounds
- Color-coded series indicators (colored dots matching each series stroke)
- Locale-aware default formatting via `toLocaleString()`
- Automatic date detection for large numeric x-values (Unix timestamps)

### TooltipOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `formatValue` | `(value: number, seriesIdx: number) => string` | `toLocaleString()` with max 2 fraction digits | Custom formatter for series values. Receives the value and the 1-based series index. |
| `formatX` | `(value: number) => string` | Auto-detect: date formatting for timestamps > 1e9, otherwise `String(value)` | Custom formatter for the x-axis label in the tooltip header. |
| `className` | `string` | -- | CSS class applied to the tooltip `<div>` element for custom styling. |

### Tooltip usage example

```ts
import uPlot from 'uplot'
import { tooltipPlugin, formatCurrency } from '@duck_ui/charts'

const opts: uPlot.Options = {
  width: 600,
  height: 300,
  series: [{}, { stroke: '#2563eb', label: 'Revenue' }],
  plugins: [
    tooltipPlugin({
      formatValue: (v) => formatCurrency(v),
      formatX: (v) => `Day ${v}`,
      className: 'my-custom-tooltip',
    }),
  ],
}
```

---

## Themes

Themes control the visual appearance of `UChart`, including background, text, grid, axis colors, the default color palette, and typography.

```ts
import { lightTheme, darkTheme } from '@duck_ui/charts'
import type { ChartTheme } from '@duck_ui/charts'
```

### ChartTheme

```ts
interface ChartTheme {
  background: string    // Chart container background color
  textColor: string     // Text color (used by labels)
  gridColor: string     // Grid line color
  axisColor: string     // Axis line and tick color
  palette: string[]     // Default series color palette
  fontFamily: string    // Font family for axis labels and ticks
  fontSize: number      // Font size in pixels for axis labels and ticks
}
```

### Built-in Themes

#### lightTheme

| Property | Value |
|----------|-------|
| `background` | `#ffffff` |
| `textColor` | `#374151` |
| `gridColor` | `#e5e7eb` |
| `axisColor` | `#9ca3af` |
| `palette` | `defaultPalette` (8 Tailwind-inspired colors) |
| `fontFamily` | `system-ui, -apple-system, sans-serif` |
| `fontSize` | `12` |

#### darkTheme

| Property | Value |
|----------|-------|
| `background` | `#111827` |
| `textColor` | `#e5e7eb` |
| `gridColor` | `#374151` |
| `axisColor` | `#6b7280` |
| `palette` | `darkPalette` (lighter variants for dark backgrounds) |
| `fontFamily` | `system-ui, -apple-system, sans-serif` |
| `fontSize` | `12` |

### Custom theme example

```tsx
import { UChart } from '@duck_ui/charts'
import type { ChartTheme } from '@duck_ui/charts'

const brandTheme: ChartTheme = {
  background: '#fefce8',
  textColor: '#422006',
  gridColor: '#fef08a',
  axisColor: '#ca8a04',
  palette: ['#eab308', '#f97316', '#ef4444', '#8b5cf6'],
  fontFamily: '"Inter", sans-serif',
  fontSize: 13,
}

function BrandedChart() {
  return (
    <UChart
      data={[[0, 1, 2], [10, 30, 20]]}
      theme={brandTheme}
    />
  )
}
```

---

## Color Palettes

Three built-in palettes are provided, each containing 8 hex color strings. Colors cycle automatically when there are more series (or slices) than palette entries.

```ts
import { defaultPalette, darkPalette, colorblindPalette } from '@duck_ui/charts'
```

### defaultPalette

Tailwind-inspired colors for light backgrounds.

| Index | Color | Hex |
|-------|-------|-----|
| 0 | Blue | `#2563eb` |
| 1 | Amber | `#f59e0b` |
| 2 | Green | `#10b981` |
| 3 | Red | `#ef4444` |
| 4 | Purple | `#8b5cf6` |
| 5 | Pink | `#ec4899` |
| 6 | Cyan | `#06b6d4` |
| 7 | Lime | `#84cc16` |

### darkPalette

Lighter variants of `defaultPalette` optimized for dark backgrounds.

| Index | Color | Hex |
|-------|-------|-----|
| 0 | Blue | `#60a5fa` |
| 1 | Amber | `#fbbf24` |
| 2 | Green | `#34d399` |
| 3 | Red | `#f87171` |
| 4 | Purple | `#a78bfa` |
| 5 | Pink | `#f472b6` |
| 6 | Cyan | `#22d3ee` |
| 7 | Lime | `#a3e635` |

### colorblindPalette

Accessible colors safe for all common forms of color-vision deficiency, based on the Wong palette.

| Index | Color | Hex |
|-------|-------|-----|
| 0 | Blue | `#0072B2` |
| 1 | Orange | `#E69F00` |
| 2 | Green | `#009E73` |
| 3 | Pink | `#CC79A7` |
| 4 | Sky | `#56B4E9` |
| 5 | Vermillion | `#D55E00` |
| 6 | Yellow | `#F0E442` |
| 7 | Black | `#000000` |

### Using a palette

```tsx
import { UChart, colorblindPalette } from '@duck_ui/charts'

function AccessibleChart() {
  return (
    <UChart
      data={[[0, 1, 2], [10, 20, 15], [5, 12, 18]]}
      colors={colorblindPalette}
      labels={['X', 'Series A', 'Series B']}
    />
  )
}
```

---

## Format Utilities

Utility functions for formatting numeric values on axes and in tooltips.

```ts
import {
  formatNumber,
  formatCurrency,
  formatPercent,
  formatDate,
  buildAxisFormatter,
} from '@duck_ui/charts'
```

### formatNumber

```ts
function formatNumber(value: number): string
```

Formats a number with K/M suffixes for thousands and millions.

| Input | Output |
|-------|--------|
| `750` | `"750"` |
| `1500` | `"1.5K"` |
| `2400000` | `"2.4M"` |
| `-3200` | `"-3.2K"` |

### formatCurrency

```ts
function formatCurrency(value: number, currency?: string): string
```

Formats a number as a currency string using `Intl.NumberFormat`. Defaults to USD with zero fraction digits.

| Input | Output |
|-------|--------|
| `formatCurrency(1234)` | `"$1,234"` |
| `formatCurrency(1234, 'EUR')` | `"EUR 1,234"` (varies by locale) |

### formatPercent

```ts
function formatPercent(value: number): string
```

Converts a decimal ratio to a percentage string. Expects values in the 0-1 range.

| Input | Output |
|-------|--------|
| `formatPercent(0.756)` | `"75.6%"` |
| `formatPercent(1)` | `"100.0%"` |

### formatDate

```ts
function formatDate(timestamp: number): string
```

Converts a Unix timestamp (seconds since epoch) to a localized date string using `toLocaleDateString()`.

| Input | Output |
|-------|--------|
| `formatDate(1700000000)` | `"11/14/2023"` (en-US locale) |

### buildAxisFormatter

```ts
function buildAxisFormatter(
  format: AxisOptions['format']
): (self: unknown, ticks: number[]) => string[]
```

Factory function that returns a uPlot-compatible axis values callback. Accepts a format preset string or a custom formatter function.

| Format | Delegates to |
|--------|-------------|
| `'number'` | `formatNumber` |
| `'currency'` | `formatCurrency` |
| `'percent'` | `formatPercent` |
| `'date'` | `formatDate` |
| `(value: number) => string` | Custom function applied to each tick |

```ts
import { buildAxisFormatter } from '@duck_ui/charts'

// Using a preset
const currencyFormatter = buildAxisFormatter('currency')

// Using a custom function
const customFormatter = buildAxisFormatter((v) => `${v} units`)
```

---

## Hooks

### useResizeObserver

```ts
function useResizeObserver(
  ref: React.RefObject<HTMLElement | null>
): { width: number | undefined; height: number | undefined }
```

Tracks the dimensions of a DOM element using the [ResizeObserver API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver). Returns the current `width` and `height` in pixels, rounded to integers. Both values are `undefined` until the first observation fires.

Used internally by `UChart` to auto-size the chart to its container. Can also be used independently.

```tsx
import { useRef } from 'react'
import { useResizeObserver } from '@duck_ui/charts'

function ResponsiveBox() {
  const ref = useRef<HTMLDivElement>(null)
  const { width, height } = useResizeObserver(ref)

  return (
    <div ref={ref} style={{ width: '100%', height: '100%' }}>
      Container is {width}x{height}
    </div>
  )
}
```

---

## Types

All types are exported from the package entry point.

```ts
import type {
  ChartData,
  ChartOptions,
  AxisOptions,
  ChartTheme,
  TooltipOptions,
  UChartProps,
  PieChartProps,
  SparklineProps,
} from '@duck_ui/charts'
```

### ChartData

```ts
interface ChartData {
  /** Array of arrays: first is x-values, rest are series y-values */
  data: uPlot.AlignedData
  /** Series labels */
  labels?: string[]
  /** Category labels for categorical x-axis (bar charts with string categories) */
  xLabels?: string[]
}
```

### ChartOptions

```ts
interface ChartOptions {
  width?: number
  height?: number
  title?: string
  type?: 'line' | 'bar' | 'area' | 'scatter'
  colors?: string[]
  legend?: boolean
  axes?: {
    x?: AxisOptions
    y?: AxisOptions
  }
  onPointClick?: (seriesIdx: number, dataIdx: number, value: number) => void
  onRangeSelect?: (min: number, max: number) => void
}
```

`UChartProps` extends `ChartOptions` with additional properties: `data`, `labels`, `xLabels`, `className`, `theme`, and `tooltip`.

### AxisOptions

```ts
interface AxisOptions {
  label?: string
  format?: 'number' | 'currency' | 'percent' | 'date' | ((value: number) => string)
}
```

### ChartTheme

```ts
interface ChartTheme {
  background: string
  textColor: string
  gridColor: string
  axisColor: string
  palette: string[]
  fontFamily: string
  fontSize: number
}
```

### TooltipOptions

```ts
interface TooltipOptions {
  formatValue?: (value: number, seriesIdx: number) => string
  formatX?: (value: number) => string
  className?: string
}
```
