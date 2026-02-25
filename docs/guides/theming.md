# Theming

Customize the visual appearance of Duck-UI charts and components.

## Chart Themes

Pass a `theme` prop to `UChart` to control chart appearance:

```tsx
import { UChart, lightTheme, darkTheme } from '@duck_ui/embed'

// Light theme (default)
<UChart data={data} type="line" theme={lightTheme} height={300} />

// Dark theme
<UChart data={data} type="line" theme={darkTheme} height={300} />
```

### ChartTheme Interface

```ts
interface ChartTheme {
  background: string    // Chart background color
  textColor: string     // Text and label color
  gridColor: string     // Grid line color
  axisColor: string     // Axis line color
  palette: string[]     // Series color palette
  fontFamily: string    // Font family
  fontSize: number      // Base font size
}
```

### Built-in Themes

| Property | lightTheme | darkTheme |
|----------|-----------|-----------|
| background | `#ffffff` | `#111827` |
| textColor | `#374151` | `#e5e7eb` |
| gridColor | `#e5e7eb` | `#374151` |
| axisColor | `#9ca3af` | `#6b7280` |
| palette | defaultPalette | darkPalette |
| fontFamily | `system-ui, sans-serif` | `system-ui, sans-serif` |
| fontSize | `12` | `12` |

### Custom Theme

```tsx
const corporateTheme: ChartTheme = {
  background: '#fafafa',
  textColor: '#1a1a1a',
  gridColor: '#e0e0e0',
  axisColor: '#999999',
  palette: ['#0066cc', '#cc6600', '#006633', '#cc0033'],
  fontFamily: 'Inter, sans-serif',
  fontSize: 13,
}

<UChart data={data} type="bar" theme={corporateTheme} height={300} />
```

## Color Palettes

Three built-in 8-color palettes:

```tsx
import { defaultPalette, darkPalette, colorblindPalette } from '@duck_ui/embed'
```

- **defaultPalette** — Vibrant Tailwind-inspired colors for light backgrounds
- **darkPalette** — Lighter variants for dark backgrounds
- **colorblindPalette** — Accessible colors safe for color-vision deficiency

Override per chart with the `colors` prop:

```tsx
<UChart data={data} type="bar" colors={['#2563eb', '#16a34a']} height={300} />
```

Colors cycle when there are more series than palette entries.

## Component Styling

All Duck-UI components accept a `className` prop for CSS overrides:

```tsx
<DataTable sql="SELECT * FROM sales" className="my-table" />
<Chart sql="..." type="bar" className="my-chart" height={300} />
<KPICard sql="..." label="Revenue" className="my-kpi" />
<FilterBar className="my-filters">...</FilterBar>
```

Components use inline styles by default (no CSS stylesheet dependency). Override with your own CSS using the `className` and standard CSS specificity.
