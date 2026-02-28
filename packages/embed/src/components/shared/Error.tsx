import type { DuckTheme } from '@duck_ui/core'
import { useTheme } from '../../provider/hooks'

export interface ErrorDisplayProps {
  error: Error
  onRetry?: () => void
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  let theme: DuckTheme | null = null
  try { theme = useTheme() } catch { /* outside provider — use defaults */ }

  const errorColor = theme?.errorColor ?? '#dc2626'
  const errorBg = theme?.errorBgColor ?? '#fef2f2'
  const borderColor = theme?.errorColor ? `${theme.errorColor}40` : '#fecaca'
  const fontFamily = theme?.fontFamily ?? 'system-ui, -apple-system, sans-serif'

  return (
    <div
      style={{
        padding: 16,
        border: `1px solid ${borderColor}`,
        borderRadius: 8,
        background: errorBg,
        fontFamily,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: errorColor,
          fontWeight: 600,
          fontSize: 14,
          marginBottom: 6,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 4.5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="11" r="0.75" fill="currentColor" />
        </svg>
        Error
      </div>
      <div style={{ color: errorColor, fontSize: 13, lineHeight: 1.5, opacity: 0.85 }}>{error.message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: 10,
            padding: '6px 14px',
            fontSize: 13,
            fontWeight: 500,
            color: errorColor,
            background: theme?.background ?? '#fff',
            border: `1px solid ${borderColor}`,
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      )}
    </div>
  )
}
