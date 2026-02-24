# Pro License

`@duck_ui/pro` is a commercial package that adds advanced features on top of the free Duck-UI packages.

## Getting a License

Contact **c.ricciuti@iberodata.es** for pricing and license keys.

License tiers:

| Tier | Features |
|------|----------|
| **Pro** | All current pro components (ThemeProvider, PivotTable, GroupBy, DrillDown, ConditionalFormat, RowLevelSecurity, DashboardBuilder, DashboardRenderer) |
| **Enterprise** | Everything in Pro + priority support + custom integrations |

## Installation

```bash
bun add @duck_ui/pro @duck_ui/embed @duckdb/duckdb-wasm
```

## Setup

Wrap your app with `ProProvider` inside `DuckProvider`:

```tsx
import { DuckProvider } from '@duck_ui/embed'
import { ProProvider } from '@duck_ui/pro'

function App() {
  return (
    <DuckProvider
      config={{
        sources: [{ type: 'url', name: 'sales', url: '/data/sales.parquet' }],
      }}
    >
      <ProProvider license={process.env.NEXT_PUBLIC_DUCK_LICENSE!}>
        {/* Pro + free components work together */}
      </ProProvider>
    </DuckProvider>
  )
}
```

### Environment Variables

Store the license key as an environment variable:

| Framework | Variable |
|-----------|----------|
| Next.js | `NEXT_PUBLIC_DUCK_LICENSE` |
| Vite | `VITE_DUCK_LICENSE` |
| Create React App | `REACT_APP_DUCK_LICENSE` |

```tsx
// Next.js
<ProProvider license={process.env.NEXT_PUBLIC_DUCK_LICENSE!} />

// Vite
<ProProvider license={import.meta.env.VITE_DUCK_LICENSE} />
```

## License Format

Licenses follow this format:

```
DUCK-<base64url_payload>.<base64url_ed25519_signature>
```

The payload is a JSON object:

```ts
interface LicensePayload {
  sub: string      // Subscriber identifier (your name/company)
  dom: string[]    // Allowed domains
  exp: number      // Expiration timestamp (seconds since epoch)
  tier: 'pro' | 'enterprise'
}
```

Validation uses Ed25519 signatures via the Web Crypto API. The license is verified entirely client-side — no phone-home or network request.

## Domain Matching

The `dom` array in the license payload controls which domains the license is valid on:

| Pattern | Matches |
|---------|---------|
| `example.com` | Exactly `example.com` |
| `*.example.com` | `app.example.com`, `staging.example.com`, and `example.com` itself |
| `localhost` | Always allowed during development |

If `window.location.hostname` doesn't match any domain in the license, pro components render nothing.

## What Happens Without a License

- Pro components render `null` (nothing visible)
- A console warning is logged once per component type: `[Duck-UI Pro] <ComponentName> requires a valid license`
- The rest of your app works normally — free components are unaffected
- No errors thrown, no crash

## Checking License Status

Use the `useProLicense` hook to conditionally render UI:

```tsx
import { useProLicense } from '@duck_ui/pro'

function ProGate({ children }: { children: ReactNode }) {
  const { valid, loading, tier } = useProLicense()

  if (loading) return <p>Validating license...</p>
  if (!valid) return <p>Pro license required. Contact c.ricciuti@iberodata.es</p>

  return <>{children}</>
}
```

Return value:

| Property | Type | Description |
|----------|------|-------------|
| `valid` | `boolean` | License is valid and not expired |
| `loading` | `boolean` | Validation in progress |
| `tier` | `'pro' \| 'enterprise' \| null` | License tier |
| `payload` | `LicensePayload \| null` | Full decoded payload |

## LicenseValidator (Advanced)

For non-React usage or custom validation logic:

```ts
import { LicenseValidator } from '@duck_ui/pro'

const validator = new LicenseValidator()
const isValid = await validator.validate('DUCK-eyJzdWI...')

if (isValid) {
  const payload = validator.getPayload()
  console.log(payload.tier) // 'pro' or 'enterprise'
  console.log(payload.exp)  // expiration timestamp
}
```

## Expiration

Licenses expire based on the `exp` field in the payload. When expired:

- `useProLicense()` returns `{ valid: false }`
- Pro components render nothing
- Console warning logged

Contact **c.ricciuti@iberodata.es** to renew.
