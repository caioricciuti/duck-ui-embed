export interface ErrorDisplayProps {
  error: Error
  onRetry?: () => void
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div
      style={{
        padding: 16,
        border: '1px solid #fecaca',
        borderRadius: 8,
        background: '#fef2f2',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: '#dc2626',
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
      <div style={{ color: '#991b1b', fontSize: 13, lineHeight: 1.5 }}>{error.message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: 10,
            padding: '6px 14px',
            fontSize: 13,
            fontWeight: 500,
            color: '#dc2626',
            background: '#fff',
            border: '1px solid #fecaca',
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
