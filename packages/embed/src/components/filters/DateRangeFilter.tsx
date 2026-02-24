import { useState, useRef, useEffect, useCallback } from 'react'
import { useDuckInternal } from '../../provider/hooks'

export interface DateRangeFilterProps {
  column: string
  label?: string
}

function getDaysInMonth(year: number, month: number): number[] {
  const count = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: count }, (_, i) => i + 1)
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function fmtDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${MONTH_SHORT[m - 1]} ${d}, ${y}`
}

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function DateRangeFilter({ column, label }: DateRangeFilterProps) {
  const { filters, setFilter, theme } = useDuckInternal()
  const value = filters[column] as { start: string; end: string } | undefined

  const ACCENT = theme.primaryColor
  const ACCENT_LIGHT = `${theme.primaryColor}30`
  const ACCENT_HOVER = `${theme.primaryColor}10`

  const [open, setOpen] = useState(false)
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)
  const [navButtonHover, setNavButtonHover] = useState<'prev' | 'next' | null>(null)
  const [pendingStart, setPendingStart] = useState<string | null>(null)

  const today = new Date()
  const todayStr = fmtDate(today)

  const [viewYear, setViewYear] = useState(() => value?.start ? parseDate(value.start).getFullYear() : today.getFullYear())
  const [viewMonth, setViewMonth] = useState(() => value?.start ? parseDate(value.start).getMonth() : today.getMonth())

  const wrapperRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (value?.start) {
      const d = parseDate(value.start)
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    }
  }, [value?.start])

  const goToPrevMonth = useCallback(() => {
    setViewMonth((m) => { if (m === 0) { setViewYear((y) => y - 1); return 11 } return m - 1 })
  }, [])

  const goToNextMonth = useCallback(() => {
    setViewMonth((m) => { if (m === 11) { setViewYear((y) => y + 1); return 0 } return m + 1 })
  }, [])

  const goToToday = useCallback(() => {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
  }, [today])

  const handleDayClick = useCallback(
    (dateStr: string) => {
      if (pendingStart === null) {
        setPendingStart(dateStr)
        setFilter(column, { start: dateStr, end: dateStr })
      } else {
        let start = pendingStart
        let end = dateStr
        if (start > end) { ;[start, end] = [end, start] }
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

  const days = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  let rangeStart = value?.start ?? null
  let rangeEnd = value?.end ?? null

  if (pendingStart !== null && hoveredDay !== null) {
    rangeStart = pendingStart
    rangeEnd = hoveredDay
    if (rangeStart > rangeEnd) { ;[rangeStart, rangeEnd] = [rangeEnd, rangeStart] }
  } else if (pendingStart !== null) {
    rangeStart = pendingStart
    rangeEnd = pendingStart
  }

  let displayText: string | null = null
  if (value?.start && value?.end && value.start !== value.end) {
    displayText = `${formatDisplayDate(value.start)} \u2014 ${formatDisplayDate(value.end)}`
  } else if (value?.start) {
    displayText = formatDisplayDate(value.start)
  }

  const isSameDay = rangeStart !== null && rangeEnd !== null && rangeStart === rangeEnd

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: theme.textColor, marginBottom: 4 }}>{label}</label>}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', fontSize: 13,
          color: displayText ? theme.textColor : theme.mutedTextColor, background: theme.background, border: `1px solid ${theme.borderColor}`,
          borderRadius: 6, cursor: 'pointer', outline: 'none', lineHeight: 1.5, minWidth: 200,
          userSelect: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
          ...(open ? { borderColor: ACCENT, boxShadow: `0 0 0 2px ${ACCENT}33` } : {}),
        }}
      >
        <svg style={{ flexShrink: 0, width: 14, height: 14, color: theme.mutedTextColor }} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="12" height="11" rx="1.5" />
          <line x1="2" y1="6.5" x2="14" y2="6.5" />
          <line x1="5.5" y1="1.5" x2="5.5" y2="4" />
          <line x1="10.5" y1="1.5" x2="10.5" y2="4" />
        </svg>
        <span>{displayText ?? 'Select dates'}</span>
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50, background: theme.background, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: `1px solid ${theme.borderColor}`, padding: 16, width: 280 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button type="button" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: 'none', background: navButtonHover === 'prev' ? theme.hoverColor : 'transparent', cursor: 'pointer', color: theme.textColor, fontSize: 14, padding: 0 }} onClick={goToPrevMonth} onMouseEnter={() => setNavButtonHover('prev')} onMouseLeave={() => setNavButtonHover(null)} aria-label="Previous month">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 3.5L5 7l3.5 3.5" /></svg>
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, color: theme.textColor, userSelect: 'none' }}>{MONTH_FULL[viewMonth]} {viewYear}</span>
            <button type="button" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: 'none', background: navButtonHover === 'next' ? theme.hoverColor : 'transparent', cursor: 'pointer', color: theme.textColor, fontSize: 14, padding: 0 }} onClick={goToNextMonth} onMouseEnter={() => setNavButtonHover('next')} onMouseLeave={() => setNavButtonHover(null)} aria-label="Next month">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5.5 3.5L9 7l-3.5 3.5" /></svg>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {DAY_HEADERS.map((d) => (
              <div key={d} style={{ width: 32, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: theme.mutedTextColor, textTransform: 'uppercase', letterSpacing: '0.05em', userSelect: 'none' }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {Array.from({ length: firstDay }, (_, i) => <div key={`empty-${i}`} style={{ width: 32, height: 32 }} />)}
            {days.map((day) => {
              const dateStr = fmtDate(new Date(viewYear, viewMonth, day))
              const isToday = dateStr === todayStr
              const isStart = rangeStart === dateStr
              const isEnd = rangeEnd === dateStr
              const isSelected = isStart || isEnd
              const isInRange = !isSameDay && rangeStart !== null && rangeEnd !== null && dateStr > rangeStart && dateStr < rangeEnd
              const isHovered = hoveredDay === dateStr && !isSelected

              let bg = 'transparent'
              let color = theme.textColor
              let fw = 400
              let br = '6px'

              if (isSelected) {
                bg = ACCENT; color = '#fff'; fw = 600
                if (!isSameDay && isStart) br = '6px 0 0 6px'
                else if (!isSameDay && isEnd) br = '0 6px 6px 0'
              } else if (isInRange) {
                bg = ACCENT_LIGHT; color = ACCENT; br = '0'
              } else if (isHovered) {
                bg = ACCENT_HOVER
              }

              return (
                <button
                  key={day} type="button"
                  style={{ width: 32, height: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 13, borderRadius: br, cursor: 'pointer', border: 'none', background: bg, color, fontWeight: fw, position: 'relative', transition: 'background 0.1s, color 0.1s', padding: 0, lineHeight: 1 }}
                  onClick={() => handleDayClick(dateStr)}
                  onMouseEnter={() => setHoveredDay(dateStr)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {day}
                  {isToday && <span style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? '#fff' : ACCENT, position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)' }} />}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, paddingTop: 10, borderTop: `1px solid ${theme.hoverColor}`, gap: 6 }}>
            <button type="button" style={{ fontSize: 12, color: theme.mutedTextColor, background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 4 }} onClick={handleClear}>Clear</button>
            <button type="button" style={{ fontSize: 12, color: ACCENT, background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 4, fontWeight: 500 }} onClick={goToToday}>Today</button>
          </div>
        </div>
      )}
    </div>
  )
}
