import type { ReactNode } from 'react'
import { useDuck } from '../provider/hooks'

export interface FilterBarProps {
  children: ReactNode
  className?: string
}

export function FilterBar({ children, className }: FilterBarProps) {
  const { clearFilters, filters } = useDuck()

  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== null && v !== undefined
  )

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        padding: '12px 16px',
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {children}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          style={{
            marginLeft: 'auto',
            padding: '6px 14px',
            fontSize: 13,
            fontWeight: 500,
            color: '#6b7280',
            background: '#fff',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            cursor: 'pointer',
            transition: 'all 0.15s',
            lineHeight: 1.5,
          }}
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
