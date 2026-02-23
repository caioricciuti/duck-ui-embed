import { useState, useRef, useEffect, useCallback } from 'react'
import { useDuck } from '../provider/hooks'

export interface DateRangeFilterProps {
  column: string
  label?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDaysInMonth(year: number, month: number): number[] {
  const count = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: count }, (_, i) => i + 1)
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const MONTH_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${MONTH_SHORT[m - 1]} ${d}, ${y}`
}

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const ACCENT = '#2563eb'
const ACCENT_LIGHT = '#dbeafe'
const ACCENT_HOVER = '#eff6ff'

const styles = {
  wrapper: {
    position: 'relative',
    display: 'inline-block',
  } as React.CSSProperties,

  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    color: '#374151',
    marginBottom: 4,
  } as React.CSSProperties,

  trigger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    fontSize: 13,
    color: '#111827',
    background: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    cursor: 'pointer',
    outline: 'none',
    lineHeight: 1.5,
    minWidth: 200,
    userSelect: 'none' as const,
    transition: 'border-color 0.15s, box-shadow 0.15s',
  } as React.CSSProperties,

  triggerOpen: {
    borderColor: ACCENT,
    boxShadow: `0 0 0 2px ${ACCENT}33`,
  } as React.CSSProperties,

  triggerPlaceholder: {
    color: '#9ca3af',
  } as React.CSSProperties,

  calendarIcon: {
    flexShrink: 0,
    width: 14,
    height: 14,
    color: '#6b7280',
  } as React.CSSProperties,

  popover: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    zIndex: 50,
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
    border: '1px solid #e5e7eb',
    padding: 16,
    width: 280,
    animation: 'none',
  } as React.CSSProperties,

  monthHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  } as React.CSSProperties,

  monthLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: '#111827',
    userSelect: 'none' as const,
  } as React.CSSProperties,

  navButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 6,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: '#374151',
    fontSize: 14,
    transition: 'background 0.15s',
    padding: 0,
  } as React.CSSProperties,

  dayOfWeekGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 2,
    marginBottom: 4,
  } as React.CSSProperties,

  dayOfWeekCell: {
    width: 32,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 500,
    color: '#9ca3af',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    userSelect: 'none' as const,
  } as React.CSSProperties,

  daysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 2,
  } as React.CSSProperties,

  dayCell: {
    width: 32,
    height: 32,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    borderRadius: 6,
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    color: '#111827',
    position: 'relative' as const,
    transition: 'background 0.1s, color 0.1s',
    padding: 0,
    lineHeight: 1,
  } as React.CSSProperties,

  dayCellOutside: {
    color: '#d1d5db',
    cursor: 'default',
  } as React.CSSProperties,

  dayCellSelected: {
    background: ACCENT,
    color: '#fff',
    fontWeight: 600,
  } as React.CSSProperties,

  dayCellInRange: {
    background: ACCENT_LIGHT,
    color: ACCENT,
    borderRadius: 0,
  } as React.CSSProperties,

  dayCellRangeStart: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  } as React.CSSProperties,

  dayCellRangeEnd: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  } as React.CSSProperties,

  dayCellRangeSingle: {
    borderRadius: 6,
  } as React.CSSProperties,

  dayCellHover: {
    background: ACCENT_HOVER,
  } as React.CSSProperties,

  todayDot: {
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: ACCENT,
    position: 'absolute' as const,
    bottom: 2,
    left: '50%',
    transform: 'translateX(-50%)',
  } as React.CSSProperties,

  todayDotSelected: {
    background: '#fff',
  } as React.CSSProperties,

  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 10,
    borderTop: '1px solid #f3f4f6',
    gap: 6,
  } as React.CSSProperties,

  clearButton: {
    fontSize: 12,
    color: '#6b7280',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 4,
    transition: 'color 0.15s',
  } as React.CSSProperties,

  todayButton: {
    fontSize: 12,
    color: ACCENT,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 4,
    fontWeight: 500,
    transition: 'background 0.15s',
  } as React.CSSProperties,
}

const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DateRangeFilter({ column, label }: DateRangeFilterProps) {
  const { filters, setFilter } = useDuck()
  const value = filters[column] as { start: string; end: string } | undefined

  const [open, setOpen] = useState(false)
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)
  const [navButtonHover, setNavButtonHover] = useState<'prev' | 'next' | null>(null)

  // Selection state: null = ready for first click, 'start' stored = waiting for end
  const [pendingStart, setPendingStart] = useState<string | null>(null)

  const today = new Date()
  const todayStr = formatDate(today)

  // Calendar view month
  const [viewYear, setViewYear] = useState(() => {
    if (value?.start) return parseDate(value.start).getFullYear()
    return today.getFullYear()
  })
  const [viewMonth, setViewMonth] = useState(() => {
    if (value?.start) return parseDate(value.start).getMonth()
    return today.getMonth()
  })

  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
        setPendingStart(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // Sync view to value changes from outside
  useEffect(() => {
    if (value?.start) {
      const d = parseDate(value.start)
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    }
  }, [value?.start])

  const goToPrevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1)
        return 11
      }
      return m - 1
    })
  }, [])

  const goToNextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1)
        return 0
      }
      return m + 1
    })
  }, [])

  const goToToday = useCallback(() => {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
  }, [today])

  const handleDayClick = useCallback(
    (dateStr: string) => {
      if (pendingStart === null) {
        // First click: set start, wait for end
        setPendingStart(dateStr)
        // Clear existing filter while selecting
        setFilter(column, { start: dateStr, end: dateStr })
      } else {
        // Second click: set the range
        let start = pendingStart
        let end = dateStr
        if (start > end) {
          ;[start, end] = [end, start]
        }
        setFilter(column, { start, end })
        setPendingStart(null)
      }
    },
    [pendingStart, column, setFilter],
  )

  const handleClear = useCallback(() => {
    setFilter(column, null)
    setPendingStart(null)
  }, [column, setFilter])

  // Build calendar cells
  const days = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  // Determine effective range for highlighting
  let rangeStart = value?.start ?? null
  let rangeEnd = value?.end ?? null

  // While selecting (pendingStart is set), show preview range on hover
  if (pendingStart !== null && hoveredDay !== null) {
    rangeStart = pendingStart
    rangeEnd = hoveredDay
    if (rangeStart > rangeEnd) {
      ;[rangeStart, rangeEnd] = [rangeEnd, rangeStart]
    }
  } else if (pendingStart !== null) {
    rangeStart = pendingStart
    rangeEnd = pendingStart
  }

  // Display text
  let displayText: string | null = null
  if (value?.start && value?.end && value.start !== value.end) {
    displayText = `${formatDisplayDate(value.start)} — ${formatDisplayDate(value.end)}`
  } else if (value?.start) {
    displayText = formatDisplayDate(value.start)
  }

  const isSameDay = rangeStart !== null && rangeEnd !== null && rangeStart === rangeEnd

  return (
    <div ref={wrapperRef} style={styles.wrapper}>
      {label && <label style={styles.label}>{label}</label>}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          ...styles.trigger,
          ...(open ? styles.triggerOpen : {}),
          ...(displayText ? {} : styles.triggerPlaceholder),
        }}
      >
        <svg
          style={styles.calendarIcon}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="3" width="12" height="11" rx="1.5" />
          <line x1="2" y1="6.5" x2="14" y2="6.5" />
          <line x1="5.5" y1="1.5" x2="5.5" y2="4" />
          <line x1="10.5" y1="1.5" x2="10.5" y2="4" />
        </svg>
        <span>{displayText ?? 'Select dates'}</span>
      </button>

      {/* Popover */}
      {open && (
        <div style={styles.popover}>
          {/* Month navigation */}
          <div style={styles.monthHeader}>
            <button
              type="button"
              style={{
                ...styles.navButton,
                ...(navButtonHover === 'prev' ? { background: '#f3f4f6' } : {}),
              }}
              onClick={goToPrevMonth}
              onMouseEnter={() => setNavButtonHover('prev')}
              onMouseLeave={() => setNavButtonHover(null)}
              aria-label="Previous month"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 3.5L5 7l3.5 3.5" />
              </svg>
            </button>
            <span style={styles.monthLabel}>
              {MONTH_FULL[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              style={{
                ...styles.navButton,
                ...(navButtonHover === 'next' ? { background: '#f3f4f6' } : {}),
              }}
              onClick={goToNextMonth}
              onMouseEnter={() => setNavButtonHover('next')}
              onMouseLeave={() => setNavButtonHover(null)}
              aria-label="Next month"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5.5 3.5L9 7l-3.5 3.5" />
              </svg>
            </button>
          </div>

          {/* Day-of-week headers */}
          <div style={styles.dayOfWeekGrid}>
            {DAY_HEADERS.map((d) => (
              <div key={d} style={styles.dayOfWeekCell}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={styles.daysGrid}>
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} style={{ width: 32, height: 32 }} />
            ))}

            {days.map((day) => {
              const dateStr = formatDate(new Date(viewYear, viewMonth, day))
              const isToday = dateStr === todayStr
              const isStart = rangeStart === dateStr
              const isEnd = rangeEnd === dateStr
              const isSelected = isStart || isEnd
              const isInRange =
                !isSameDay &&
                rangeStart !== null &&
                rangeEnd !== null &&
                dateStr > rangeStart &&
                dateStr < rangeEnd
              const isHovered = hoveredDay === dateStr && !isSelected

              let cellStyle: React.CSSProperties = { ...styles.dayCell }

              if (isSelected) {
                cellStyle = {
                  ...cellStyle,
                  ...styles.dayCellSelected,
                }
                if (!isSameDay && isStart) {
                  cellStyle = { ...cellStyle, ...styles.dayCellRangeStart }
                } else if (!isSameDay && isEnd) {
                  cellStyle = { ...cellStyle, ...styles.dayCellRangeEnd }
                } else if (isSameDay) {
                  cellStyle = { ...cellStyle, ...styles.dayCellRangeSingle }
                }
              } else if (isInRange) {
                cellStyle = {
                  ...cellStyle,
                  ...styles.dayCellInRange,
                }
              } else if (isHovered) {
                cellStyle = {
                  ...cellStyle,
                  ...styles.dayCellHover,
                }
              }

              return (
                <button
                  key={day}
                  type="button"
                  style={cellStyle}
                  onClick={() => handleDayClick(dateStr)}
                  onMouseEnter={() => setHoveredDay(dateStr)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {day}
                  {isToday && (
                    <span
                      style={{
                        ...styles.todayDot,
                        ...(isSelected ? styles.todayDotSelected : {}),
                      }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div style={styles.footer}>
            <button
              type="button"
              style={styles.clearButton}
              onClick={handleClear}
            >
              Clear
            </button>
            <button
              type="button"
              style={styles.todayButton}
              onClick={goToToday}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
