import { useDuck } from '../provider/hooks'

export interface MultiSelectFilterProps {
  column: string
  options: string[]
  label?: string
}

export function MultiSelectFilter({ column, options, label }: MultiSelectFilterProps) {
  const { filters, setFilter } = useDuck()
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
        <label
          style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 500,
            color: '#374151',
            marginBottom: 4,
          }}
        >
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
                border: isSelected ? '1px solid #2563eb' : '1px solid #d1d5db',
                background: isSelected ? '#2563eb' : '#fff',
                color: isSelected ? '#fff' : '#374151',
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
