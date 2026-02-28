import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { lightTheme } from '@duck_ui/core'
import { FilterBar } from './FilterBar'
import { DuckUIContext, type DuckUIContextValue } from '../provider/context'

function createMockContext(overrides: Partial<DuckUIContextValue> = {}): DuckUIContextValue {
  return {
    query: vi.fn(),
    executor: null,
    inspector: null,
    cache: null,
    status: 'ready',
    error: null,
    filters: {},
    setFilter: vi.fn(),
    clearFilters: vi.fn(),
    filterVersion: 0,
    tableNames: ['orders'],
    license: null,
    theme: lightTheme,
    ...overrides,
  }
}

function renderWithContext(ui: React.ReactElement, ctx: DuckUIContextValue) {
  return render(
    <DuckUIContext.Provider value={ctx}>{ui}</DuckUIContext.Provider>
  )
}

describe('FilterBar', () => {
  it('renders without filters', () => {
    const ctx = createMockContext()
    const { container } = renderWithContext(<FilterBar />, ctx)
    expect(container.firstChild).toBeTruthy()
  })

  it('shows clear button when filters are active', () => {
    const ctx = createMockContext({
      filters: { status: 'active' },
    })
    renderWithContext(<FilterBar />, ctx)
    expect(screen.getByText('Clear filters')).toBeInTheDocument()
  })

  it('hides clear button when no filters active', () => {
    const ctx = createMockContext({ filters: {} })
    renderWithContext(<FilterBar />, ctx)
    expect(screen.queryByText('Clear filters')).not.toBeInTheDocument()
  })

  it('calls clearFilters when clear button is clicked', () => {
    const clearFilters = vi.fn()
    const ctx = createMockContext({
      filters: { status: 'active' },
      clearFilters,
    })
    renderWithContext(<FilterBar />, ctx)
    fireEvent.click(screen.getByText('Clear filters'))
    expect(clearFilters).toHaveBeenCalledTimes(1)
  })

  it('renders children alongside filters', () => {
    const ctx = createMockContext()
    renderWithContext(
      <FilterBar>
        <span>Custom content</span>
      </FilterBar>,
      ctx
    )
    expect(screen.getByText('Custom content')).toBeInTheDocument()
  })

  it('uses theme styles', () => {
    const ctx = createMockContext()
    const { container } = renderWithContext(<FilterBar />, ctx)
    const div = container.firstChild as HTMLElement
    expect(div.style.fontFamily).toBe(lightTheme.fontFamily)
  })
})
