import type { DuckTheme } from '@duck_ui/core'
import { useTheme } from '../../provider/hooks'

export type LoadingVariant = 'spinner' | 'skeleton-chart' | 'skeleton-table' | 'skeleton-kpi'

export interface LoadingProps {
  message?: string
  variant?: LoadingVariant
}

const keyframes = `
@keyframes duck-ui-spin {
  to { transform: rotate(360deg); }
}
@keyframes duck-ui-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
`

function SkeletonBlock({ width, height, borderRadius = 4, theme }: {
  width: string | number
  height: string | number
  borderRadius?: number
  theme: { borderColor: string }
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: theme.borderColor,
        animation: 'duck-ui-pulse 1.5s ease-in-out infinite',
      }}
    />
  )
}

function SkeletonChart({ theme }: { theme: DuckTheme }) {
  return (
    <div style={{ padding: 16 }}>
      <SkeletonBlock width={120} height={14} theme={theme} />
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 16, height: 120 }}>
        {[60, 90, 45, 100, 70, 55, 80].map((h, i) => (
          <SkeletonBlock key={i} width={24} height={h} borderRadius={3} theme={theme} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 24, marginTop: 12 }}>
        {[40, 40, 40, 40, 40, 40, 40].map((w, i) => (
          <SkeletonBlock key={i} width={w} height={10} theme={theme} />
        ))}
      </div>
    </div>
  )
}

function SkeletonTable({ theme }: { theme: DuckTheme }) {
  return (
    <div style={{ borderRadius: 8, border: `1px solid ${theme.borderColor}`, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 12, padding: '12px 14px', background: theme.surfaceColor }}>
        {[80, 120, 100, 90].map((w, i) => (
          <SkeletonBlock key={i} width={w} height={12} theme={theme} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: 5 }, (_, row) => (
        <div
          key={row}
          style={{
            display: 'flex',
            gap: 12,
            padding: '12px 14px',
            borderTop: `1px solid ${theme.hoverColor}`,
            background: row % 2 === 1 ? theme.stripeColor : theme.background,
          }}
        >
          {[80, 120, 100, 90].map((w, i) => (
            <SkeletonBlock key={i} width={w} height={12} theme={theme} />
          ))}
        </div>
      ))}
    </div>
  )
}

function SkeletonKPI({ theme }: { theme: DuckTheme }) {
  return (
    <div style={{ padding: 20 }}>
      <SkeletonBlock width={80} height={12} theme={theme} />
      <div style={{ marginTop: 10 }}>
        <SkeletonBlock width={140} height={28} borderRadius={6} theme={theme} />
      </div>
      <div style={{ marginTop: 10 }}>
        <SkeletonBlock width={60} height={16} borderRadius={12} theme={theme} />
      </div>
    </div>
  )
}

export function Loading({ message = 'Loading...', variant = 'spinner' }: LoadingProps) {
  let theme: DuckTheme | null = null
  try { theme = useTheme() } catch { /* outside provider — use defaults */ }

  const spinnerBorder = theme?.borderColor ?? '#e5e7eb'
  const spinnerAccent = theme?.primaryColor ?? '#2563eb'
  const textColor = theme?.mutedTextColor ?? '#6b7280'
  const fontFamily = theme?.fontFamily ?? 'system-ui, -apple-system, sans-serif'

  const defaultTheme: DuckTheme = theme ?? {
    background: '#fff',
    textColor: '#374151',
    primaryColor: '#2563eb',
    surfaceColor: '#f9fafb',
    borderColor: '#e5e7eb',
    mutedTextColor: '#6b7280',
    hoverColor: '#f3f4f6',
    stripeColor: '#f9fafb',
    successColor: '#16a34a',
    successBgColor: '#f0fdf4',
    dangerColor: '#dc2626',
    dangerBgColor: '#fef2f2',
    errorColor: '#dc2626',
    errorBgColor: '#fef2f2',
    gridColor: '#f3f4f6',
    axisColor: '#9ca3af',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 14,
    palette: [],
  }

  return (
    <>
      <style>{keyframes}</style>
      {variant === 'skeleton-chart' && <SkeletonChart theme={defaultTheme} />}
      {variant === 'skeleton-table' && <SkeletonTable theme={defaultTheme} />}
      {variant === 'skeleton-kpi' && <SkeletonKPI theme={defaultTheme} />}
      {variant === 'spinner' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: 32,
            color: textColor,
            fontSize: 14,
            fontFamily,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              border: `2px solid ${spinnerBorder}`,
              borderTopColor: spinnerAccent,
              borderRadius: '50%',
              animation: 'duck-ui-spin 0.6s linear infinite',
            }}
          />
          {message}
        </div>
      )}
    </>
  )
}
