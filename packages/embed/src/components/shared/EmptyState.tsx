import { useTheme } from '../../provider/hooks'
import type { DuckTheme } from '../../charts/theme'

export interface EmptyStateProps {
  message?: string
}

export function EmptyState({ message = 'No data available' }: EmptyStateProps) {
  let theme: DuckTheme | null = null
  try { theme = useTheme() } catch { /* outside provider — use defaults */ }

  const color = theme?.mutedTextColor ?? '#9ca3af'
  const fontFamily = theme?.fontFamily ?? 'system-ui, -apple-system, sans-serif'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        color,
        fontFamily,
      }}
    >
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ marginBottom: 12, opacity: 0.5 }}>
        <rect x="4" y="8" width="32" height="24" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 16h32" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14 8v24M26 8v24" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
      </svg>
      <div style={{ fontSize: 14 }}>{message}</div>
    </div>
  )
}
