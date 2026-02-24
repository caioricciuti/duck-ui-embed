# @duck_ui/pro API Reference

License-gated premium components for Duck UI. Pro components render nothing without a valid license and log a one-time console warning per component type.

```
npm install @duck_ui/pro
```

---

## Table of Contents

- [Getting a License](#getting-a-license)
- [License System](#license-system)
  - [ProProvider](#proprovider)
  - [useProLicense](#useprolicense)
  - [LicenseValidator](#licensevalidator)
  - [LicensePayload](#licensepayload)
  - [requireLicense (internal HOC)](#requirelicense-internal-hoc)
- [Components](#components)
  - [ThemeProvider](#themeprovider)
  - [PivotTable](#pivottable) _(Coming Soon)_
  - [GroupBy](#groupby) _(Coming Soon)_
  - [DrillDown](#drilldown) _(Coming Soon)_
  - [ConditionalFormat](#conditionalformat) _(Coming Soon)_
  - [RowLevelSecurity](#rowlevelsecurity) _(Coming Soon)_
  - [DashboardBuilder](#dashboardbuilder) _(Coming Soon)_
  - [DashboardRenderer](#dashboardrenderer) _(Coming Soon)_
- [Dashboard Types](#dashboard-types)
  - [DashboardConfig](#dashboardconfig)
  - [LayoutItem](#layoutitem)
  - [FilterConfig](#filterconfig)
  - [ThemeConfig](#themeconfig)

---

## Getting a License

The `@duck_ui/pro` package requires a valid commercial license. All pro components will render nothing and log a console warning until a license is provided via `<ProProvider>`.

To obtain a license, contact:

**c.ricciuti@iberodata.es**

License tiers:

| Tier | Description |
|------|-------------|
| `pro` | Full access to all pro components for a single domain |
| `enterprise` | Multi-domain and wildcard domain support |

---

## License System

### ProProvider

Top-level provider that validates and distributes license state to all pro components.

```tsx
import { ProProvider } from '@duck_ui/pro'

function App() {
  return (
    <ProProvider license="DUCK-eyJzdWIiOi....<signature>">
      {/* Pro components work here */}
    </ProProvider>
  )
}
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `license` | `string` | Yes | License key in the format `DUCK-<base64url_payload>.<base64url_ed25519_signature>` |
| `children` | `ReactNode` | Yes | Child elements that may contain pro components |

#### Behavior

- Validates the license on mount using `LicenseValidator`.
- Uses the Web Crypto API for Ed25519 signature verification.
- Checks expiration (`exp` field) and domain matching (`dom` field) against `window.location.hostname`.
- `localhost` is always allowed during development, regardless of the `dom` field.

---

### useProLicense

Hook to read the current license state from within a `<ProProvider>`.

```ts
function useProLicense(): ProLicenseState
```

#### ProLicenseState

| Property | Type | Description |
|----------|------|-------------|
| `valid` | `boolean` | License is valid and not expired |
| `loading` | `boolean` | Validation in progress |
| `tier` | `'pro' \| 'enterprise' \| null` | License tier, or `null` if invalid |
| `payload` | `LicensePayload \| null` | Full decoded payload, or `null` if invalid |

#### Example: conditional rendering based on license

```tsx
import { useProLicense } from '@duck_ui/pro'

function UpgradeGate({ children }: { children: React.ReactNode }) {
  const { valid, loading, tier } = useProLicense()

  if (loading) return <span>Checking license...</span>

  if (!valid) {
    return (
      <div>
        <p>This feature requires a Duck UI Pro license.</p>
        <a href="mailto:c.ricciuti@iberodata.es">Get a license</a>
      </div>
    )
  }

  return (
    <>
      {children}
      {tier === 'enterprise' && <span>Enterprise</span>}
    </>
  )
}
```

---

### LicenseValidator

Class used internally by `ProProvider` to verify license keys. Can also be used directly for programmatic validation.

```ts
class LicenseValidator {
  validate(key: string): Promise<boolean>
  getPayload(): LicensePayload | null
  getTier(): 'pro' | 'enterprise' | null
}
```

#### Methods

##### `validate(key: string): Promise<boolean>`

Parses the license key, verifies the Ed25519 signature using the Web Crypto API, checks expiration, and validates the current domain against the allowed domains list. Returns `true` if all checks pass.

##### `getPayload(): LicensePayload | null`

Returns the decoded license payload after a successful `validate()` call, or `null` if validation has not run or failed.

##### `getTier(): 'pro' | 'enterprise' | null`

Returns the license tier after a successful `validate()` call, or `null` if validation has not run or failed.

---

### LicensePayload

Decoded contents of a license key.

```ts
interface LicensePayload {
  sub: string      // Subscriber identifier
  dom: string[]    // Allowed domains (supports wildcards like *.example.com)
  exp: number      // Expiration timestamp (seconds since epoch)
  tier: 'pro' | 'enterprise'
}
```

#### Domain Matching Rules

| Pattern | Matches |
|---------|---------|
| `example.com` | Exactly `example.com` |
| `*.example.com` | `app.example.com`, `staging.example.com`, and `example.com` itself |
| _(any)_ | `localhost` is always allowed during development |

---

### requireLicense (internal HOC)

All pro components are wrapped with this higher-order component. It is not exported but understanding its behavior is useful for debugging.

#### Behavior

- Renders `null` if the license is invalid or still loading.
- Logs a **one-time** console warning per component type when rendering is blocked.
- Sets the display name of the wrapped component to `Licensed(ComponentName)` for React DevTools.

---

## Components

### ThemeProvider

Custom theming via CSS custom properties. Converts key-value pairs into `--duck-<key>` CSS custom properties on a wrapping `<div>`.

```tsx
import { ProProvider, ThemeProvider } from '@duck_ui/pro'

function App() {
  return (
    <ProProvider license="DUCK-...">
      <ThemeProvider
        theme={{
          primary: '#4f46e5',
          'surface-bg': '#f9fafb',
          'font-family': 'Inter, sans-serif',
          'border-radius': '8px',
        }}
      >
        {/* All Duck UI components inside inherit these CSS vars */}
      </ThemeProvider>
    </ProProvider>
  )
}
```

The example above produces the following CSS custom properties on the wrapping div:

```css
--duck-primary: #4f46e5;
--duck-surface-bg: #f9fafb;
--duck-font-family: Inter, sans-serif;
--duck-border-radius: 8px;
```

#### Props (ThemeProviderProps)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `Record<string, string>` | `{}` | Key-value pairs converted to `--duck-<key>` CSS custom properties |
| `children` | `ReactNode` | required | Child elements |

---

### PivotTable

> **Coming Soon** -- This component is not yet available.

Pivot table with row/column grouping and value aggregation. License-gated via `requireLicense` HOC.

#### Props (PivotTableProps)

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `sql` | `string` | Yes | SQL query to pivot |
| `rows` | `string[]` | Yes | Columns to use as row headers |
| `columns` | `string[]` | Yes | Columns to use as column headers |
| `values` | `string[]` | Yes | Columns to aggregate as values |
| `className` | `string` | No | CSS class |

---

### GroupBy

> **Coming Soon** -- This component is not yet available.

Advanced grouping controls for dynamic SQL group-by queries. License-gated via `requireLicense` HOC.

#### Props (GroupByProps)

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `sql` | `string` | Yes | SQL query with GROUP BY |
| `groupColumns` | `string[]` | Yes | Columns to group by |
| `className` | `string` | No | CSS class |

---

### DrillDown

> **Coming Soon** -- This component is not yet available.

Wrap a chart to enable click-to-drill on data points. License-gated via `requireLicense` HOC.

#### Props (DrillDownProps)

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | `ReactNode` | Yes | Chart or component to make drillable |
| `onDrill` | `(params: Record<string, unknown>) => void` | No | Callback when user drills into a data point |

---

### ConditionalFormat

> **Coming Soon** -- This component is not yet available.

Apply conditional cell styling based on value rules. License-gated via `requireLicense` HOC.

#### Props (ConditionalFormatProps)

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `rules` | `ConditionalFormatRule[]` | Yes | Array of formatting rules |
| `children` | `ReactNode` | Yes | Table or component to format |

#### ConditionalFormatRule

```ts
interface ConditionalFormatRule {
  column: string
  condition: 'gt' | 'lt' | 'eq' | 'between'
  value: number | [number, number]  // single value or [min, max] for 'between'
  style: Record<string, string>     // CSS properties to apply
}
```

---

### RowLevelSecurity

> **Coming Soon** -- This component is not yet available.

Restrict data access by injecting WHERE clauses based on rules. License-gated via `requireLicense` HOC.

#### Props (RowLevelSecurityProps)

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `rules` | `Record<string, string>` | Yes | Column-to-SQL condition fragment mapping |
| `children` | `ReactNode` | Yes | Components to restrict |

#### Example Rules

```ts
const rules = {
  region: "= 'North'",
  department: "IN ('Sales', 'Marketing')",
}
```

---

### DashboardBuilder

> **Coming Soon** -- This component is not yet available.

Drag-and-drop dashboard editor. Outputs a `DashboardConfig` object. License-gated via `requireLicense` HOC.

#### Props (DashboardBuilderProps)

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `config` | `DashboardConfig` | Yes | Current dashboard configuration |
| `onChange` | `(config: DashboardConfig) => void` | Yes | Called when user modifies layout |
| `children` | `ReactNode` | No | Additional toolbar/UI elements |

---

### DashboardRenderer

> **Coming Soon** -- This component is not yet available.

Render a saved `DashboardConfig` as a read-only dashboard. License-gated via `requireLicense` HOC.

#### Props (DashboardRendererProps)

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `config` | `DashboardConfig` | Yes | Saved dashboard configuration |
| `className` | `string` | No | CSS class |

---

## Dashboard Types

### DashboardConfig

Top-level configuration object for dashboard builder and renderer.

```ts
interface DashboardConfig {
  id: string
  title: string
  layout: LayoutItem[]
  filters?: FilterConfig[]
  theme?: ThemeConfig
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | Yes | Unique dashboard identifier |
| `title` | `string` | Yes | Dashboard display title |
| `layout` | `LayoutItem[]` | Yes | Array of positioned components |
| `filters` | `FilterConfig[]` | No | Global dashboard filters |
| `theme` | `ThemeConfig` | No | Dashboard-level theme overrides |

---

### LayoutItem

Describes a single widget positioned on the dashboard grid.

```ts
interface LayoutItem {
  id: string
  type: 'chart' | 'table' | 'kpi' | 'filter'
  x: number        // Grid x position
  y: number        // Grid y position
  w: number        // Grid width
  h: number        // Grid height
  config: Record<string, unknown>  // Component-specific config
}
```

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique item identifier |
| `type` | `'chart' \| 'table' \| 'kpi' \| 'filter'` | Widget type |
| `x` | `number` | Grid x position |
| `y` | `number` | Grid y position |
| `w` | `number` | Grid width (columns) |
| `h` | `number` | Grid height (rows) |
| `config` | `Record<string, unknown>` | Component-specific configuration |

---

### FilterConfig

Defines a global dashboard filter control.

```ts
interface FilterConfig {
  column: string
  type: 'select' | 'multiselect' | 'range' | 'daterange'
  label?: string
  options?: string[]
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `column` | `string` | Yes | Column name to filter on |
| `type` | `'select' \| 'multiselect' \| 'range' \| 'daterange'` | Yes | Filter control type |
| `label` | `string` | No | Display label for the filter |
| `options` | `string[]` | No | Predefined options for select/multiselect types |

---

### ThemeConfig

Dashboard-level theme overrides.

```ts
interface ThemeConfig {
  primaryColor?: string
  fontFamily?: string
  borderRadius?: number
  darkMode?: boolean
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `primaryColor` | `string` | -- | Primary accent color |
| `fontFamily` | `string` | -- | Font family for the dashboard |
| `borderRadius` | `number` | -- | Border radius in pixels |
| `darkMode` | `boolean` | -- | Enable dark mode |
