// Placeholder for Monaco editor integration
// Will be implemented when monaco-editor is added as a dependency

export interface MonacoWrapperProps {
  value: string
  onChange: (value: string) => void
  onExecute?: () => void
  height?: number
  className?: string
}

export default function MonacoWrapper({ value, onChange, onExecute, height = 200, className }: MonacoWrapperProps) {
  return (
    <div className={className}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && onExecute) {
            e.preventDefault()
            onExecute()
          }
        }}
        style={{
          width: '100%',
          height,
          fontFamily: 'monospace',
          fontSize: 14,
          padding: 12,
          border: '1px solid #d1d5db',
          borderRadius: 4,
          resize: 'vertical',
        }}
        placeholder="SELECT * FROM ..."
      />
    </div>
  )
}
