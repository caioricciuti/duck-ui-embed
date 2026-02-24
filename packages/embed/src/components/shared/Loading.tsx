import { useTheme } from '../../provider/hooks'
import type { DuckTheme } from '../../charts/theme'

export interface LoadingProps {
  message?: string
}

const spinnerKeyframes = `
@keyframes duck-ui-spin {
  to { transform: rotate(360deg); }
}
`

export function Loading({ message = 'Loading...' }: LoadingProps) {
  let theme: DuckTheme | null = null
  try { theme = useTheme() } catch { /* outside provider — use defaults */ }

  const spinnerBorder = theme?.borderColor ?? '#e5e7eb'
  const spinnerAccent = theme?.primaryColor ?? '#2563eb'
  const textColor = theme?.mutedTextColor ?? '#6b7280'
  const fontFamily = theme?.fontFamily ?? 'system-ui, -apple-system, sans-serif'

  return (
    <>
      <style>{spinnerKeyframes}</style>
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
    </>
  )
}
