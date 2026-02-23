export interface LoadingProps {
  message?: string
}

const spinnerKeyframes = `
@keyframes duck-ui-spin {
  to { transform: rotate(360deg); }
}
`

export function Loading({ message = 'Loading...' }: LoadingProps) {
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
          color: '#6b7280',
          fontSize: 14,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            border: '2px solid #e5e7eb',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'duck-ui-spin 0.6s linear infinite',
          }}
        />
        {message}
      </div>
    </>
  )
}
