import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useDuckInternal, useQuery } from '../../provider/hooks'

export interface SelectFilterProps {
  column: string
  options?: string[]
  source?: string
  label?: string
  placeholder?: string
}

export function SelectFilter({
  column,
  options: explicitOptions,
  source,
  label,
  placeholder = 'All',
}: SelectFilterProps) {
  const { filters, setFilter, theme } = useDuckInternal()
  const value = filters[column] as string | undefined

  const shouldQuery = !explicitOptions && !!source
  const sql = shouldQuery
    ? `SELECT DISTINCT "${column}" FROM "${source}" ORDER BY 1`
    : 'SELECT 1 WHERE false'
  const { data, loading } = useQuery(sql, { noCache: false, noFilter: true })

  const sourceOptions = useMemo(() => {
    if (!shouldQuery || !data) return []
    return data.rows.map((row) => String(row[column] ?? '')).filter(Boolean)
  }, [data, shouldQuery, column])

  const resolvedOptions = explicitOptions ?? sourceOptions

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const filtered = useMemo(() => {
    if (!search) return resolvedOptions
    const lower = search.toLowerCase()
    return resolvedOptions.filter((opt) => opt.toLowerCase().includes(lower))
  }, [resolvedOptions, search])

  useEffect(() => {
    setHighlightedIndex(0)
  }, [filtered.length, search])

  useEffect(() => {
    if (!open || !listRef.current) return
    const item = listRef.current.children[highlightedIndex] as HTMLElement | undefined
    if (item) {
      item.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex, open])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOpen = useCallback(() => {
    setOpen(true)
    setSearch('')
    setHighlightedIndex(0)
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  const handleSelect = useCallback(
    (opt: string) => {
      setFilter(column, opt || null)
      setOpen(false)
      setSearch('')
    },
    [column, setFilter]
  )

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setFilter(column, null)
      setSearch('')
      setOpen(false)
    },
    [column, setFilter]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleOpen()
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex((prev) => Math.min(prev + 1, filtered.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((prev) => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (filtered[highlightedIndex]) {
            handleSelect(filtered[highlightedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          setOpen(false)
          break
      }
    },
    [open, filtered, highlightedIndex, handleOpen, handleSelect]
  )

  const containerStyle: React.CSSProperties = { position: 'relative', display: 'inline-block' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: theme.textColor, marginBottom: 4 }

  const triggerStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', fontSize: 13,
    color: value ? theme.textColor : theme.mutedTextColor, background: theme.background, border: `1px solid ${theme.borderColor}`,
    borderRadius: 6, cursor: 'pointer', outline: 'none', minWidth: 120, lineHeight: 1.5, boxSizing: 'border-box',
  }

  const inputStyle: React.CSSProperties = {
    flex: 1, border: 'none', outline: 'none', fontSize: 13, lineHeight: 1.5, color: theme.textColor,
    background: 'transparent', padding: 0, minWidth: 0, width: '100%',
  }

  const clearBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16,
    border: 'none', background: theme.borderColor, borderRadius: '50%', cursor: 'pointer', padding: 0,
    fontSize: 10, lineHeight: 1, color: theme.mutedTextColor, flexShrink: 0,
  }

  const chevronStyle: React.CSSProperties = {
    flexShrink: 0, transition: 'transform 200ms ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
    color: theme.mutedTextColor, display: 'flex', alignItems: 'center',
  }

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: theme.background,
    border: `1px solid ${theme.borderColor}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
    maxHeight: 220, overflowY: 'auto', zIndex: 50, padding: '4px 0',
    opacity: open ? 1 : 0, transform: open ? 'translateY(0)' : 'translateY(-4px)',
    transition: 'opacity 150ms ease, transform 150ms ease', pointerEvents: open ? 'auto' : 'none',
    listStyle: 'none', margin: 0,
  }

  const baseItemStyle: React.CSSProperties = { padding: '6px 10px', fontSize: 13, cursor: 'pointer', borderRadius: 4, margin: '0 4px', userSelect: 'none' }

  const displayText = value || ''

  return (
    <div ref={containerRef} style={containerStyle}>
      {label && <label style={labelStyle}>{label}</label>}

      <div
        style={triggerStyle}
        onClick={() => { if (!open) handleOpen() }}
        onKeyDown={handleKeyDown}
        tabIndex={open ? -1 : 0}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {open ? (
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={value || placeholder}
            style={inputStyle}
            aria-autocomplete="list"
          />
        ) : (
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayText || placeholder}
          </span>
        )}

        {value && !open && (
          <button type="button" onClick={handleClear} style={clearBtnStyle} aria-label={`Clear ${label || column}`}>
            &#x2715;
          </button>
        )}

        <span style={chevronStyle} aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>

      <ul ref={listRef} role="listbox" style={dropdownStyle}>
        {shouldQuery && loading ? (
          <li style={{ ...baseItemStyle, color: theme.mutedTextColor, cursor: 'default', textAlign: 'center' }}>Loading&hellip;</li>
        ) : filtered.length === 0 ? (
          <li style={{ ...baseItemStyle, color: theme.mutedTextColor, cursor: 'default', textAlign: 'center' }}>No results</li>
        ) : (
          filtered.map((opt, i) => {
            const isSelected = opt === value
            const isHighlighted = i === highlightedIndex
            const itemStyle: React.CSSProperties = {
              ...baseItemStyle,
              background: isHighlighted ? `${theme.primaryColor}20` : isSelected ? `${theme.primaryColor}10` : 'transparent',
              color: isSelected ? theme.primaryColor : theme.textColor,
              fontWeight: isSelected ? 500 : 400,
            }
            return (
              <li
                key={opt}
                role="option"
                aria-selected={isSelected}
                style={itemStyle}
                onMouseEnter={() => setHighlightedIndex(i)}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(opt) }}
              >
                {opt}
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}
