import { useDuckInternal } from '../../provider/hooks'

export interface MultiSelectFilterProps {
  column: string
  options: string[]
  label?: string
}

export function MultiSelectFilter({ column, options, label }: MultiSelectFilterProps) {
  const { filters, setFilter, theme } = useDuckInternal()
  const selected = (filters[column] as string[] | undefined) ?? []

  const toggle = (opt: string) => {
    const next = selected.includes(opt)
      ? selected.filter((s) => s !== opt)
      : [...selected, opt]
    setFilter(column, next.length > 0 ? next : null)
  }

  return (
    <div>
      {label && (
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: theme.textColor, marginBottom: 4 }}>
          {label}
        </label>
      )}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {options.map((opt) => {
          const isSelected = selected.includes(opt)
          return (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              style={{
                padding: '5px 12px',
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 16,
                border: isSelected ? `1px solid ${theme.primaryColor}` : `1px solid ${theme.borderColor}`,
                background: isSelected ? theme.primaryColor : theme.background,
                color: isSelected ? '#fff' : theme.textColor,
                cursor: 'pointer',
                transition: 'all 0.15s',
                lineHeight: 1.4,
              }}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}
