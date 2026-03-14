import { DuckElement } from './base'
import { escapeHTML } from './styles'

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

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${MONTH_SHORT[m - 1]} ${d}, ${y}`
}

const dateFilterCSS = `
  .date-container {
    position: relative;
    display: inline-block;
  }
  .filter-label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: var(--duck-text, #374151);
    margin-bottom: 4px;
  }
  .date-trigger {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    font-size: 13px;
    color: var(--duck-text, #374151);
    background: var(--duck-bg, #ffffff);
    border: 1px solid var(--duck-border, #e5e7eb);
    border-radius: 6px;
    cursor: pointer;
    outline: none;
    line-height: 1.5;
    min-width: 200px;
    user-select: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .date-trigger.placeholder {
    color: var(--duck-muted, #6b7280);
  }
  .date-trigger.open {
    border-color: var(--duck-primary, #2563eb);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--duck-primary, #2563eb) 20%, transparent);
  }
  .date-trigger svg {
    flex-shrink: 0;
    color: var(--duck-muted, #6b7280);
  }
  .calendar {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 50;
    background: var(--duck-bg, #ffffff);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.12);
    border: 1px solid var(--duck-border, #e5e7eb);
    padding: 16px;
    width: 280px;
  }
  .calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .nav-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--duck-text, #374151);
    font-size: 14px;
    padding: 0;
    transition: background 0.15s;
  }
  .nav-btn:hover {
    background: var(--duck-hover, #f3f4f6);
  }
  .month-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--duck-text, #374151);
    user-select: none;
  }
  .day-headers {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    margin-bottom: 4px;
  }
  .day-header {
    width: 32px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 500;
    color: var(--duck-muted, #6b7280);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    user-select: none;
  }
  .days-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }
  .day-empty {
    width: 32px;
    height: 32px;
  }
  .day-btn {
    width: 32px;
    height: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    cursor: pointer;
    border: none;
    background: transparent;
    color: var(--duck-text, #374151);
    font-weight: 400;
    position: relative;
    transition: background 0.1s, color 0.1s;
    padding: 0;
    line-height: 1;
    border-radius: 6px;
  }
  .day-btn:hover {
    background: color-mix(in srgb, var(--duck-primary, #2563eb) 6%, transparent);
  }
  .day-btn.selected {
    background: var(--duck-primary, #2563eb);
    color: #fff;
    font-weight: 600;
  }
  .day-btn.range-start {
    border-radius: 6px 0 0 6px;
  }
  .day-btn.range-end {
    border-radius: 0 6px 6px 0;
  }
  .day-btn.in-range {
    background: color-mix(in srgb, var(--duck-primary, #2563eb) 18%, transparent);
    color: var(--duck-primary, #2563eb);
    border-radius: 0;
  }
  .today-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--duck-primary, #2563eb);
    position: absolute;
    bottom: 2px;
    left: 50%;
    transform: translateX(-50%);
  }
  .day-btn.selected .today-dot {
    background: #fff;
  }
  .calendar-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--duck-hover, #f3f4f6);
    gap: 6px;
  }
  .footer-btn {
    font-size: 12px;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background 0.15s;
  }
  .footer-btn:hover {
    background: var(--duck-hover, #f3f4f6);
  }
  .footer-btn.clear {
    color: var(--duck-muted, #6b7280);
  }
  .footer-btn.today {
    color: var(--duck-primary, #2563eb);
    font-weight: 500;
  }
`

/**
 * <duck-date-filter> — Calendar date range picker filter.
 *
 * Usage:
 *   <duck-date-filter column="created_at" label="Date"></duck-date-filter>
 */
export class DuckDateFilterElement extends DuckElement {
  static observedAttributes = ['column', 'label']

  private wrapper!: HTMLDivElement
  private triggerBtn!: HTMLButtonElement
  private calendarEl: HTMLDivElement | null = null

  private open = false
  private pendingStart: string | null = null
  private hoveredDay: string | null = null
  private viewYear: number
  private viewMonth: number

  constructor() {
    super()
    const today = new Date()
    this.viewYear = today.getFullYear()
    this.viewMonth = today.getMonth()
  }

  render(): void {
    if (!this.wrapper) {
      this.applyStyles(dateFilterCSS)
      this.buildDOM()
    }
    this.updateTrigger()
  }

  private getCurrentValue(): { start: string; end: string } | undefined {
    const column = this.getAttribute('column')
    if (!column) return undefined
    return this.getProvider()?.filters[column] as { start: string; end: string } | undefined
  }

  private buildDOM(): void {
    this.wrapper = document.createElement('div')
    this.wrapper.className = 'date-container'

    const labelText = this.getAttribute('label')
    if (labelText) {
      const label = document.createElement('label')
      label.className = 'filter-label'
      label.textContent = labelText
      this.wrapper.appendChild(label)
    }

    this.triggerBtn = document.createElement('button')
    this.triggerBtn.type = 'button'
    this.triggerBtn.className = 'date-trigger placeholder'
    this.triggerBtn.addEventListener('click', () => this.toggleOpen())
    this.wrapper.appendChild(this.triggerBtn)

    // Close on outside click
    document.addEventListener('mousedown', (e) => {
      if (this.open && !this.wrapper.contains(e.target as Node)) {
        this.closeCalendar()
      }
    })

    this.shadow.appendChild(this.wrapper)
  }

  private updateTrigger(): void {
    const value = this.getCurrentValue()
    let displayText: string | null = null

    if (value?.start && value?.end && value.start !== value.end) {
      displayText = `${formatDisplayDate(value.start)} \u2014 ${formatDisplayDate(value.end)}`
    } else if (value?.start) {
      displayText = formatDisplayDate(value.start)
    }

    this.triggerBtn.className = `date-trigger${displayText ? '' : ' placeholder'}${this.open ? ' open' : ''}`
    this.triggerBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="3" width="12" height="11" rx="1.5"/>
        <line x1="2" y1="6.5" x2="14" y2="6.5"/>
        <line x1="5.5" y1="1.5" x2="5.5" y2="4"/>
        <line x1="10.5" y1="1.5" x2="10.5" y2="4"/>
      </svg>
      <span>${displayText ?? 'Select dates'}</span>
    `

    // Sync calendar view to value
    if (value?.start) {
      const d = parseDate(value.start)
      this.viewYear = d.getFullYear()
      this.viewMonth = d.getMonth()
    }
  }

  private toggleOpen(): void {
    this.open = !this.open
    if (this.open) {
      this.renderCalendar()
    } else {
      this.closeCalendar()
    }
    this.updateTrigger()
  }

  private closeCalendar(): void {
    this.open = false
    this.pendingStart = null
    this.calendarEl?.remove()
    this.calendarEl = null
    this.updateTrigger()
  }

  private renderCalendar(): void {
    this.calendarEl?.remove()

    const cal = document.createElement('div')
    cal.className = 'calendar'
    this.calendarEl = cal

    // Header
    const header = document.createElement('div')
    header.className = 'calendar-header'

    const prevBtn = document.createElement('button')
    prevBtn.type = 'button'
    prevBtn.className = 'nav-btn'
    prevBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 3.5L5 7l3.5 3.5"/></svg>`
    prevBtn.addEventListener('click', () => this.goToPrevMonth())

    const title = document.createElement('span')
    title.className = 'month-title'
    title.textContent = `${MONTH_FULL[this.viewMonth]} ${this.viewYear}`

    const nextBtn = document.createElement('button')
    nextBtn.type = 'button'
    nextBtn.className = 'nav-btn'
    nextBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 3.5L9 7l-3.5 3.5"/></svg>`
    nextBtn.addEventListener('click', () => this.goToNextMonth())

    header.appendChild(prevBtn)
    header.appendChild(title)
    header.appendChild(nextBtn)
    cal.appendChild(header)

    // Day headers
    const dayHeaders = document.createElement('div')
    dayHeaders.className = 'day-headers'
    for (const d of DAY_HEADERS) {
      const span = document.createElement('div')
      span.className = 'day-header'
      span.textContent = d
      dayHeaders.appendChild(span)
    }
    cal.appendChild(dayHeaders)

    // Days grid
    const daysGrid = document.createElement('div')
    daysGrid.className = 'days-grid'

    const today = new Date()
    const todayStr = fmtDate(today)
    const days = getDaysInMonth(this.viewYear, this.viewMonth)
    const firstDay = getFirstDayOfMonth(this.viewYear, this.viewMonth)
    const value = this.getCurrentValue()

    let rangeStart = value?.start ?? null
    let rangeEnd = value?.end ?? null

    if (this.pendingStart !== null && this.hoveredDay !== null) {
      rangeStart = this.pendingStart
      rangeEnd = this.hoveredDay
      if (rangeStart > rangeEnd) {
        ;[rangeStart, rangeEnd] = [rangeEnd, rangeStart]
      }
    } else if (this.pendingStart !== null) {
      rangeStart = this.pendingStart
      rangeEnd = this.pendingStart
    }

    const isSameDay = rangeStart !== null && rangeEnd !== null && rangeStart === rangeEnd

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('div')
      empty.className = 'day-empty'
      daysGrid.appendChild(empty)
    }

    // Day buttons
    for (const day of days) {
      const dateStr = fmtDate(new Date(this.viewYear, this.viewMonth, day))
      const isToday = dateStr === todayStr
      const isStart = rangeStart === dateStr
      const isEnd = rangeEnd === dateStr
      const isSelected = isStart || isEnd
      const isInRange = !isSameDay && rangeStart !== null && rangeEnd !== null && dateStr > rangeStart && dateStr < rangeEnd

      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'day-btn'
      btn.textContent = String(day)

      if (isSelected) {
        btn.classList.add('selected')
        if (!isSameDay && isStart) btn.classList.add('range-start')
        else if (!isSameDay && isEnd) btn.classList.add('range-end')
      } else if (isInRange) {
        btn.classList.add('in-range')
      }

      if (isToday) {
        const dot = document.createElement('span')
        dot.className = 'today-dot'
        btn.appendChild(dot)
      }

      btn.setAttribute('data-date', dateStr)
      btn.tabIndex = 0
      btn.addEventListener('click', () => this.handleDayClick(dateStr))
      btn.addEventListener('mouseenter', () => {
        this.hoveredDay = dateStr
        this.renderCalendar()
      })
      btn.addEventListener('mouseleave', () => {
        this.hoveredDay = null
      })
      btn.addEventListener('keydown', (e) => this.handleDayKeyDown(e, dateStr))

      daysGrid.appendChild(btn)
    }

    cal.appendChild(daysGrid)

    // Presets
    const presetsDiv = document.createElement('div')
    presetsDiv.className = 'calendar-footer'
    presetsDiv.style.flexWrap = 'wrap'
    presetsDiv.style.justifyContent = 'flex-start'

    const presets: [string, () => { start: string; end: string }][] = [
      ['Today', () => { const d = fmtDate(new Date()); return { start: d, end: d } }],
      ['Last 7 days', () => { const end = new Date(); const s = new Date(); s.setDate(s.getDate() - 6); return { start: fmtDate(s), end: fmtDate(end) } }],
      ['Last 30 days', () => { const end = new Date(); const s = new Date(); s.setDate(s.getDate() - 29); return { start: fmtDate(s), end: fmtDate(end) } }],
      ['This month', () => { const now = new Date(); return { start: fmtDate(new Date(now.getFullYear(), now.getMonth(), 1)), end: fmtDate(now) } }],
      ['This year', () => { const now = new Date(); return { start: fmtDate(new Date(now.getFullYear(), 0, 1)), end: fmtDate(now) } }],
    ]

    for (const [label, getRange] of presets) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'footer-btn today'
      btn.style.fontSize = '11px'
      btn.textContent = label
      btn.addEventListener('click', () => {
        const column = this.getAttribute('column')
        if (!column) return
        const range = getRange()
        this.getProvider()?.setFilter(column, range)
        this.pendingStart = null
        const d = parseDate(range.start)
        this.viewYear = d.getFullYear()
        this.viewMonth = d.getMonth()
        this.updateTrigger()
        this.renderCalendar()
      })
      presetsDiv.appendChild(btn)
    }

    cal.appendChild(presetsDiv)

    // Footer
    const footer = document.createElement('div')
    footer.className = 'calendar-footer'

    const clearBtn = document.createElement('button')
    clearBtn.type = 'button'
    clearBtn.className = 'footer-btn clear'
    clearBtn.textContent = 'Clear'
    clearBtn.addEventListener('click', () => this.handleClear())

    const todayBtn = document.createElement('button')
    todayBtn.type = 'button'
    todayBtn.className = 'footer-btn today'
    todayBtn.textContent = 'Go to today'
    todayBtn.addEventListener('click', () => {
      this.viewYear = today.getFullYear()
      this.viewMonth = today.getMonth()
      this.renderCalendar()
    })

    footer.appendChild(clearBtn)
    footer.appendChild(todayBtn)
    cal.appendChild(footer)

    this.wrapper.appendChild(cal)
  }

  private handleDayClick(dateStr: string): void {
    const column = this.getAttribute('column')
    if (!column) return

    const provider = this.getProvider()

    if (this.pendingStart === null) {
      this.pendingStart = dateStr
      provider?.setFilter(column, { start: dateStr, end: dateStr })
    } else {
      let start = this.pendingStart
      let end = dateStr
      if (start > end) {
        ;[start, end] = [end, start]
      }
      provider?.setFilter(column, { start, end })
      this.pendingStart = null
    }

    this.updateTrigger()
    this.renderCalendar()
  }

  private handleClear(): void {
    const column = this.getAttribute('column')
    if (!column) return

    this.getProvider()?.setFilter(column, null)
    this.pendingStart = null
    this.updateTrigger()
    this.renderCalendar()
  }

  private goToPrevMonth(): void {
    if (this.viewMonth === 0) {
      this.viewYear--
      this.viewMonth = 11
    } else {
      this.viewMonth--
    }
    this.renderCalendar()
  }

  private handleDayKeyDown(e: KeyboardEvent, dateStr: string): void {
    const d = parseDate(dateStr)
    let next: Date | null = null

    switch (e.key) {
      case 'ArrowLeft': next = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1); break
      case 'ArrowRight': next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1); break
      case 'ArrowUp': next = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7); break
      case 'ArrowDown': next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7); break
      case 'Enter':
      case ' ':
        e.preventDefault()
        this.handleDayClick(dateStr)
        return
      case 'Escape':
        e.preventDefault()
        this.closeCalendar()
        return
      default: return
    }

    e.preventDefault()
    if (next) {
      this.viewYear = next.getFullYear()
      this.viewMonth = next.getMonth()
      this.renderCalendar()
      requestAnimationFrame(() => {
        const btn = this.calendarEl?.querySelector(`[data-date="${fmtDate(next!)}"]`) as HTMLElement | null
        btn?.focus()
      })
    }
  }

  private goToNextMonth(): void {
    if (this.viewMonth === 11) {
      this.viewYear++
      this.viewMonth = 0
    } else {
      this.viewMonth++
    }
    this.renderCalendar()
  }
}
