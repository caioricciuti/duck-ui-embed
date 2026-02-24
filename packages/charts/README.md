# @duck_ui/charts

> uPlot-based chart components for React. Lightweight and fast.

## Install

```bash
npm install @duck_ui/charts
```

## Usage

```tsx
import { UChart, PieChart, Sparkline } from '@duck_ui/charts'

// Line chart
<UChart
  data={[
    [1, 2, 3, 4, 5],       // x values
    [10, 20, 15, 25, 30],   // y series 1
  ]}
  type="line"
  height={300}
/>

// Bar chart
<UChart
  data={[xValues, yValues]}
  type="bar"
  height={300}
  labels={['Month', 'Revenue']}
  xLabels={['Jan', 'Feb', 'Mar']}
/>

// Pie chart
<PieChart data={slices} width={300} height={300} />

// Sparkline (inline trend)
<Sparkline data={[10, 20, 15, 25, 30]} width={140} height={28} />
```

## Chart Types

- `line` — line chart
- `bar` — bar chart
- `area` — filled area chart
- `scatter` — scatter plot
- `pie` — pie/donut chart (via `PieChart`)
- `sparkline` — inline trend line (via `Sparkline`)

## Exports

### Components

- `UChart` — main chart component (line, bar, area, scatter via presets)
- `PieChart` — pie / donut chart
- `Sparkline` — compact inline sparkline

### Presets

- `linePreset`, `barPreset`, `areaPreset`, `scatterPreset`

### Plugins

- `tooltipPlugin` — hover tooltip for UChart

### Utilities

- `formatNumber`, `formatCurrency`, `formatPercent`, `formatDate`
- `defaultPalette`, `darkPalette`, `colorblindPalette`
- `useResizeObserver` — responsive container hook

## Full Documentation

- [API Reference](../../docs/api/charts.md)
- [Charts Guide](../../docs/guides/charts.md)
- [Theming Guide](../../docs/guides/theming.md)

## License

Apache-2.0
