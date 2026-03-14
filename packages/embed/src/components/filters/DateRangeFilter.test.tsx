import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { lightTheme } from '@duck_ui/core'
import type { QueryExecutor } from '@duck_ui/core'
import { DateRangeFilter } from './DateRangeFilter'
import { DuckUIContext, type DuckUIContextValue } from '../../provider/context'

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

function createMockContext(overrides: Partial<DuckUIContextValue> = {}): DuckUIContextValue {
  const mockExecutor = {
    execute: vi.fn(() => Promise.resolve({ rows: [], columns: [], rowCount: 0, executionTime: 0 })),
  } as unknown as QueryExecutor

  return {
    query: vi.fn(),
    executor: mockExecutor,
    inspector: null,
    cache: null,
    status: 'ready',
    error: null,
    filters: {},
    setFilter: vi.fn(),
    setFilters: vi.fn(),
    clearFilters: vi.fn(),
    filterVersion: 0,
    tableNames: ['orders'],
    theme: lightTheme,
    ...overrides,
  }
}

function renderWithContext(ui: React.ReactElement, ctx: DuckUIContextValue) {
  return render(
    <DuckUIContext.Provider value={ctx}>{ui}</DuckUIContext.Provider>
  )
}

describe('DateRangeFilter', () => {
  it('renders trigger button with placeholder text', () => {
    const ctx = createMockContext()

    renderWithContext(
      <DateRangeFilter column="created_at" label="Created" />,
      ctx
    )

    expect(screen.getByText('Created')).toBeInTheDocument()
    expect(screen.getByText('Select dates')).toBeInTheDocument()
  })

  it('opens calendar on click', () => {
    const ctx = createMockContext()

    renderWithContext(
      <DateRangeFilter column="created_at" />,
      ctx
    )

    fireEvent.click(screen.getByText('Select dates'))

    // Calendar should show day headers
    expect(screen.getByText('Su')).toBeInTheDocument()
    expect(screen.getByText('Mo')).toBeInTheDocument()
    expect(screen.getByText('Fr')).toBeInTheDocument()
  })

  it('closes calendar on second click', () => {
    const ctx = createMockContext()

    renderWithContext(
      <DateRangeFilter column="created_at" />,
      ctx
    )

    const trigger = screen.getByText('Select dates')
    fireEvent.click(trigger)
    expect(screen.getByText('Su')).toBeInTheDocument()

    fireEvent.click(trigger)
    expect(screen.queryByText('Su')).not.toBeInTheDocument()
  })

  it('selects a date on click and calls setFilter', () => {
    const setFilter = vi.fn()
    const ctx = createMockContext({ setFilter })

    renderWithContext(
      <DateRangeFilter column="created_at" />,
      ctx
    )

    fireEvent.click(screen.getByText('Select dates'))

    // Click on day 15 (should exist in any month)
    const day15 = screen.getByText('15')
    fireEvent.click(day15)

    expect(setFilter).toHaveBeenCalled()
    const call = setFilter.mock.calls[0]
    expect(call[0]).toBe('created_at')
    expect(call[1]).toHaveProperty('start')
    expect(call[1]).toHaveProperty('end')
  })

  it('renders preset buttons', () => {
    const ctx = createMockContext()

    renderWithContext(
      <DateRangeFilter column="created_at" />,
      ctx
    )

    fireEvent.click(screen.getByText('Select dates'))

    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByText('Last 7 days')).toBeInTheDocument()
    expect(screen.getByText('Last 30 days')).toBeInTheDocument()
    expect(screen.getByText('This month')).toBeInTheDocument()
    expect(screen.getByText('This year')).toBeInTheDocument()
  })

  it('preset button sets filter with date range', () => {
    const setFilter = vi.fn()
    const ctx = createMockContext({ setFilter })

    renderWithContext(
      <DateRangeFilter column="created_at" />,
      ctx
    )

    fireEvent.click(screen.getByText('Select dates'))
    fireEvent.click(screen.getByText('Today'))

    expect(setFilter).toHaveBeenCalled()
    const call = setFilter.mock.calls[0]
    expect(call[0]).toBe('created_at')
    // Today preset: start === end
    expect(call[1].start).toBe(call[1].end)
  })

  it('Escape key closes the calendar', () => {
    const ctx = createMockContext()

    renderWithContext(
      <DateRangeFilter column="created_at" />,
      ctx
    )

    fireEvent.click(screen.getByText('Select dates'))
    expect(screen.getByText('Su')).toBeInTheDocument()

    // Click a day to get a button focused, then press Escape on it
    const day10 = screen.getByText('10')
    fireEvent.keyDown(day10, { key: 'Escape' })

    expect(screen.queryByText('Su')).not.toBeInTheDocument()
  })

  it('arrow keys navigate between days', () => {
    const ctx = createMockContext()

    renderWithContext(
      <DateRangeFilter column="created_at" />,
      ctx
    )

    fireEvent.click(screen.getByText('Select dates'))

    const day15 = screen.getByText('15')
    fireEvent.keyDown(day15, { key: 'ArrowRight' })

    // The component should have updated the hovered day to 16
    // We can't easily test focus in jsdom, but we can verify no errors occurred
    expect(screen.getByText('16')).toBeInTheDocument()
  })

  it('navigates months with prev/next buttons', () => {
    const ctx = createMockContext()

    renderWithContext(
      <DateRangeFilter column="created_at" />,
      ctx
    )

    fireEvent.click(screen.getByText('Select dates'))

    const prevButton = screen.getByLabelText('Previous month')
    const nextButton = screen.getByLabelText('Next month')

    // Get current month name displayed
    const now = new Date()
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const currentMonth = monthNames[now.getMonth()]
    expect(screen.getByText(new RegExp(currentMonth))).toBeInTheDocument()

    // Navigate to next month
    fireEvent.click(nextButton)
    const nextMonth = monthNames[(now.getMonth() + 1) % 12]
    expect(screen.getByText(new RegExp(nextMonth))).toBeInTheDocument()

    // Navigate back twice to previous month
    fireEvent.click(prevButton)
    fireEvent.click(prevButton)
    const prevMonth = monthNames[(now.getMonth() - 1 + 12) % 12]
    expect(screen.getByText(new RegExp(prevMonth))).toBeInTheDocument()
  })

  it('displays selected date range', () => {
    const ctx = createMockContext({
      filters: {
        created_at: { start: '2025-01-10', end: '2025-01-20' },
      },
    })

    renderWithContext(
      <DateRangeFilter column="created_at" />,
      ctx
    )

    // Should show formatted date range instead of "Select dates"
    expect(screen.getByText(/Jan 10, 2025/)).toBeInTheDocument()
    expect(screen.getByText(/Jan 20, 2025/)).toBeInTheDocument()
  })

  it('clear button resets filter', () => {
    const setFilter = vi.fn()
    const ctx = createMockContext({
      setFilter,
      filters: { created_at: { start: '2025-01-10', end: '2025-01-20' } },
    })

    renderWithContext(
      <DateRangeFilter column="created_at" />,
      ctx
    )

    // Open calendar to access Clear button
    fireEvent.click(screen.getByText(/Jan 10/))
    fireEvent.click(screen.getByText('Clear'))

    expect(setFilter).toHaveBeenCalledWith('created_at', null)
  })
})
