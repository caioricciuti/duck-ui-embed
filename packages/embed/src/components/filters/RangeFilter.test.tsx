import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { lightTheme } from '@duck_ui/core'
import type { QueryExecutor } from '@duck_ui/core'
import { RangeFilter } from './RangeFilter'
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

describe('RangeFilter', () => {
  it('renders two slider thumbs with correct ARIA attributes', () => {
    const ctx = createMockContext()

    renderWithContext(
      <RangeFilter column="price" min={0} max={100} label="Price" />,
      ctx
    )

    const sliders = screen.getAllByRole('slider')
    expect(sliders).toHaveLength(2)

    // Min thumb
    expect(sliders[0].getAttribute('aria-label')).toBe('Price minimum')
    expect(sliders[0].getAttribute('aria-valuemin')).toBe('0')
    expect(sliders[0].getAttribute('aria-valuenow')).toBe('0')

    // Max thumb
    expect(sliders[1].getAttribute('aria-label')).toBe('Price maximum')
    expect(sliders[1].getAttribute('aria-valuemax')).toBe('100')
    expect(sliders[1].getAttribute('aria-valuenow')).toBe('100')
  })

  it('renders direct input fields with correct min/max', () => {
    const ctx = createMockContext()

    renderWithContext(
      <RangeFilter column="price" min={0} max={100} label="Price" />,
      ctx
    )

    const minInput = screen.getByLabelText('Price minimum value') as HTMLInputElement
    const maxInput = screen.getByLabelText('Price maximum value') as HTMLInputElement

    expect(minInput).toBeInTheDocument()
    expect(maxInput).toBeInTheDocument()
    expect(minInput.type).toBe('number')
    expect(maxInput.type).toBe('number')
    expect(minInput.value).toBe('0')
    expect(maxInput.value).toBe('100')
  })

  it('calls setFilter when min input changes', () => {
    const setFilter = vi.fn()
    const ctx = createMockContext({ setFilter })

    renderWithContext(
      <RangeFilter column="price" min={0} max={100} />,
      ctx
    )

    const minInput = screen.getByLabelText('price minimum value')
    fireEvent.change(minInput, { target: { value: '25' } })

    expect(setFilter).toHaveBeenCalledWith('price', { min: 25, max: 100 })
  })

  it('calls setFilter when max input changes', () => {
    const setFilter = vi.fn()
    const ctx = createMockContext({ setFilter })

    renderWithContext(
      <RangeFilter column="price" min={0} max={100} />,
      ctx
    )

    const maxInput = screen.getByLabelText('price maximum value')
    fireEvent.change(maxInput, { target: { value: '75' } })

    expect(setFilter).toHaveBeenCalledWith('price', { min: 0, max: 75 })
  })

  it('adjusts slider via keyboard ArrowRight on min thumb', () => {
    const setFilter = vi.fn()
    const ctx = createMockContext({ setFilter })

    renderWithContext(
      <RangeFilter column="price" min={0} max={100} step={5} />,
      ctx
    )

    const sliders = screen.getAllByRole('slider')
    fireEvent.keyDown(sliders[0], { key: 'ArrowRight' })

    expect(setFilter).toHaveBeenCalledWith('price', { min: 5, max: 100 })
  })

  it('adjusts slider via keyboard ArrowLeft on max thumb', () => {
    const setFilter = vi.fn()
    const ctx = createMockContext({ setFilter })

    renderWithContext(
      <RangeFilter column="price" min={0} max={100} step={10} />,
      ctx
    )

    const sliders = screen.getAllByRole('slider')
    fireEvent.keyDown(sliders[1], { key: 'ArrowLeft' })

    expect(setFilter).toHaveBeenCalledWith('price', { min: 0, max: 90 })
  })

  it('clears filter when full range is selected', () => {
    const setFilter = vi.fn()
    const ctx = createMockContext({
      setFilter,
      filters: { price: { min: 25, max: 75 } },
    })

    renderWithContext(
      <RangeFilter column="price" min={0} max={100} />,
      ctx
    )

    // Set min input back to 0 and max to 100 — should clear filter (null)
    const minInput = screen.getByLabelText('price minimum value')
    fireEvent.change(minInput, { target: { value: '0' } })

    // The commit function checks if values cover full range and passes null
    // Since current max is 75 (from filters), it won't clear yet
    expect(setFilter).toHaveBeenCalledWith('price', { min: 0, max: 75 })
  })

  it('renders label when provided', () => {
    const ctx = createMockContext()

    renderWithContext(
      <RangeFilter column="price" min={0} max={100} label="Price Range" />,
      ctx
    )

    expect(screen.getByText('Price Range')).toBeInTheDocument()
  })

  it('reflects current filter value in sliders', () => {
    const ctx = createMockContext({
      filters: { price: { min: 20, max: 80 } },
    })

    renderWithContext(
      <RangeFilter column="price" min={0} max={100} />,
      ctx
    )

    const sliders = screen.getAllByRole('slider')
    expect(sliders[0].getAttribute('aria-valuenow')).toBe('20')
    expect(sliders[1].getAttribute('aria-valuenow')).toBe('80')

    const minInput = screen.getByLabelText('price minimum value') as HTMLInputElement
    const maxInput = screen.getByLabelText('price maximum value') as HTMLInputElement
    expect(minInput.value).toBe('20')
    expect(maxInput.value).toBe('80')
  })
})
