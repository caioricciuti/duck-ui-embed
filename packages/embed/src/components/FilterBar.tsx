import { type ReactNode } from 'react'
import { useDuckInternal, useSchema } from '../provider/hooks'
import { SelectFilter } from './filters/SelectFilter'
import { RangeFilter } from './filters/RangeFilter'
import { DateRangeFilter } from './filters/DateRangeFilter'
import { detectFilterType } from './filters/auto-detect'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FilterConfig {
  column: string
  type: 'select' | 'multiselect' | 'range' | 'daterange'
  label?: string
  /** For range filters: min value */
  min?: number
  /** For range filters: max value */
  max?: number
  /** For range filters: step */
  step?: number
  /** For select filters: explicit options */
  options?: string[]
}

export interface FilterBarProps {
  /** Manual filter config */
  filters?: FilterConfig[]
  /** Auto-detect filters from a table's schema */
  auto?: string
  /** Which table to read distinct values from (for select filters) */
  source?: string
  /** Custom className */
  className?: string
  /** Children to render alongside filters */
  children?: ReactNode
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FilterBar({ filters: filterConfigs, auto, source, className, children }: FilterBarProps) {
  const { filters, clearFilters, tableNames, theme } = useDuckInternal()
  const effectiveSource = source ?? auto ?? tableNames[0]

  // Auto-detect mode
  const { schema } = useSchema(auto ?? undefined)

  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== null && v !== undefined
  )

  // Build filter elements
  const filterElements: ReactNode[] = []

  if (auto && schema) {
    for (const col of schema.columns) {
      const filterType = detectFilterType(col)
      if (filterType === 'select') {
        filterElements.push(
          <SelectFilter
            key={col.name}
            column={col.name}
            source={effectiveSource}
            label={col.name}
          />
        )
      } else if (filterType === 'daterange') {
        filterElements.push(
          <DateRangeFilter
            key={col.name}
            column={col.name}
            label={col.name}
          />
        )
      }
    }
  }

  if (filterConfigs) {
    for (const config of filterConfigs) {
      switch (config.type) {
        case 'select':
          filterElements.push(
            <SelectFilter
              key={config.column}
              column={config.column}
              options={config.options}
              source={effectiveSource}
              label={config.label ?? config.column}
            />
          )
          break
        case 'range':
          if (config.min !== undefined && config.max !== undefined) {
            filterElements.push(
              <RangeFilter
                key={config.column}
                column={config.column}
                min={config.min}
                max={config.max}
                step={config.step}
                label={config.label ?? config.column}
              />
            )
          }
          break
        case 'daterange':
          filterElements.push(
            <DateRangeFilter
              key={config.column}
              column={config.column}
              label={config.label ?? config.column}
            />
          )
          break
      }
    }
  }

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        padding: '12px 16px',
        background: theme.surfaceColor,
        border: `1px solid ${theme.borderColor}`,
        borderRadius: 8,
        fontFamily: theme.fontFamily,
      }}
    >
      {filterElements}
      {children}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          style={{
            marginLeft: 'auto',
            padding: '6px 14px',
            fontSize: 13,
            fontWeight: 500,
            color: theme.mutedTextColor,
            background: theme.background,
            border: `1px solid ${theme.borderColor}`,
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
