import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { lightTheme } from '@duck_ui/core'
import type { QueryExecutor } from '@duck_ui/core'
import { SelectFilter } from './SelectFilter'
import { DuckUIContext, type DuckUIContextValue } from '../../provider/context'

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

beforeEach(() => {
  // jsdom doesn't implement scrollIntoView
  if (typeof window !== 'undefined' && window.Element) {
    window.Element.prototype.scrollIntoView = vi.fn()
  }
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

describe('SelectFilter', () => {
  it('renders options from explicit list', async () => {
    const ctx = createMockContext()

    renderWithContext(
      <SelectFilter column="status" options={['active', 'inactive', 'pending']} label="Status" />,
      ctx
    )

    // Open the dropdown
    const combobox = screen.getByRole('combobox')
    fireEvent.click(combobox)

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'active' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'inactive' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'pending' })).toBeInTheDocument()
    })
  })

  it('calls setFilter on option select', async () => {
    const setFilter = vi.fn()
    const ctx = createMockContext({ setFilter })

    renderWithContext(
      <SelectFilter column="status" options={['active', 'inactive']} />,
      ctx
    )

    // Open dropdown
    fireEvent.click(screen.getByRole('combobox'))

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'active' })).toBeInTheDocument()
    })

    // Select option via mousedown (component uses onMouseDown)
    fireEvent.mouseDown(screen.getByRole('option', { name: 'active' }))

    expect(setFilter).toHaveBeenCalledWith('status', 'active')
  })

  it('calls setFilter with null on clear', async () => {
    const setFilter = vi.fn()
    const ctx = createMockContext({
      setFilter,
      filters: { status: 'active' },
    })

    renderWithContext(
      <SelectFilter column="status" options={['active', 'inactive']} label="Status" />,
      ctx
    )

    // Clear button should be visible when there's a value
    const clearButton = screen.getByLabelText('Clear Status')
    fireEvent.click(clearButton)

    expect(setFilter).toHaveBeenCalledWith('status', null)
  })

  it('displays selected value in trigger', () => {
    const ctx = createMockContext({
      filters: { status: 'active' },
    })

    renderWithContext(
      <SelectFilter column="status" options={['active', 'inactive']} />,
      ctx
    )

    // The trigger span shows the selected value; the listbox also has "active" as an option.
    // Query within the combobox trigger to avoid ambiguity.
    const combobox = screen.getByRole('combobox')
    expect(combobox).toHaveTextContent('active')
  })

  it('displays placeholder when no value selected', () => {
    const ctx = createMockContext()

    renderWithContext(
      <SelectFilter column="status" options={['active']} placeholder="Choose one" />,
      ctx
    )

    expect(screen.getByText('Choose one')).toBeInTheDocument()
  })

  it('renders label when provided', () => {
    const ctx = createMockContext()

    renderWithContext(
      <SelectFilter column="status" options={['active']} label="Order Status" />,
      ctx
    )

    expect(screen.getByText('Order Status')).toBeInTheDocument()
  })

  it('closes dropdown on Escape', async () => {
    const ctx = createMockContext()

    renderWithContext(
      <SelectFilter column="status" options={['active', 'inactive']} />,
      ctx
    )

    const combobox = screen.getByRole('combobox')
    fireEvent.click(combobox)

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'active' })).toBeInTheDocument()
    })

    // Press Escape on the input (which is focused when open)
    const input = screen.getByRole('textbox')
    fireEvent.keyDown(input, { key: 'Escape' })

    // Dropdown should close — options should no longer be visible
    // (opacity transitions to 0 and pointerEvents becomes 'none')
    expect(combobox.getAttribute('aria-expanded')).toBe('false')
  })
})
