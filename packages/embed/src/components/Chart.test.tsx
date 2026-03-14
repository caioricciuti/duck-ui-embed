import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { lightTheme } from '@duck_ui/core'
import type { QueryResult, QueryExecutor } from '@duck_ui/core'
import { Chart } from './Chart'
import { DuckUIContext, type DuckUIContextValue } from '../provider/context'

// UChart requires uPlot + ResizeObserver, both unavailable in jsdom.
// Mock the whole module so we can assert props instead.
vi.mock('../charts/UChart', () => ({
  UChart: (props: Record<string, unknown>) => (
    <div data-testid="uchart" data-type={props.type ?? 'line'} />
  ),
}))

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

const chartResult: QueryResult = {
  rows: [
    { x: 'Jan', y: 10 },
    { x: 'Feb', y: 20 },
    { x: 'Mar', y: 30 },
  ],
  columns: [
    { name: 'x', type: 'VARCHAR', nullable: false },
    { name: 'y', type: 'INTEGER', nullable: false },
  ],
  rowCount: 3,
  executionTime: 2,
}

const emptyResult: QueryResult = {
  rows: [],
  columns: [
    { name: 'x', type: 'VARCHAR', nullable: false },
    { name: 'y', type: 'INTEGER', nullable: false },
  ],
  rowCount: 0,
  executionTime: 1,
}

function createMockContext(overrides: Partial<DuckUIContextValue> = {}): DuckUIContextValue {
  const mockExecutor = {
    execute: vi.fn(() => Promise.resolve(chartResult)),
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
    tableNames: ['sales'],
    theme: lightTheme,
    ...overrides,
  }
}

function renderWithContext(ui: React.ReactElement, ctx: DuckUIContextValue) {
  return render(
    <DuckUIContext.Provider value={ctx}>{ui}</DuckUIContext.Provider>
  )
}

describe('Chart', () => {
  it('shows skeleton loading when engine is not ready', () => {
    const ctx = createMockContext({ status: 'loading', executor: null })

    const { container } = renderWithContext(
      <Chart sql="SELECT x, y FROM sales" />,
      ctx
    )

    // Skeleton chart renders animated placeholder blocks
    const skeletonBlocks = container.querySelectorAll('[style*="duck-ui-pulse"]')
    expect(skeletonBlocks.length).toBeGreaterThan(0)
  })

  it('shows error display with retry on query failure', async () => {
    const failExecutor = {
      execute: vi.fn(() => Promise.reject(new Error('Table not found'))),
    } as unknown as QueryExecutor

    const ctx = createMockContext({ executor: failExecutor })

    renderWithContext(
      <Chart sql="SELECT x, y FROM missing" />,
      ctx
    )

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
    })

    // Retry button is wired
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('shows empty state when query returns no rows', async () => {
    const emptyExecutor = {
      execute: vi.fn(() => Promise.resolve(emptyResult)),
    } as unknown as QueryExecutor

    const ctx = createMockContext({ executor: emptyExecutor })

    renderWithContext(
      <Chart sql="SELECT x, y FROM sales WHERE 1=0" />,
      ctx
    )

    await waitFor(() => {
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })

  it('renders UChart when data loads successfully', async () => {
    const ctx = createMockContext()

    renderWithContext(
      <Chart sql="SELECT x, y FROM sales" type="bar" />,
      ctx
    )

    await waitFor(() => {
      expect(screen.getByTestId('uchart')).toBeInTheDocument()
    })

    expect(screen.getByTestId('uchart').getAttribute('data-type')).toBe('bar')
  })

  it('applies className to wrapper div', async () => {
    const ctx = createMockContext()

    const { container } = renderWithContext(
      <Chart sql="SELECT x, y FROM sales" className="my-chart" />,
      ctx
    )

    await waitFor(() => {
      expect(screen.getByTestId('uchart')).toBeInTheDocument()
    })

    const wrapper = container.querySelector('.my-chart')
    expect(wrapper).toBeTruthy()
  })
})
