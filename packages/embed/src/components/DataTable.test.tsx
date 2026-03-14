import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { lightTheme } from '@duck_ui/core'
import type { QueryResult, QueryExecutor } from '@duck_ui/core'
import { DataTable } from './DataTable'
import { DuckUIContext, type DuckUIContextValue } from '../provider/context'

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

const pageResult: QueryResult = {
  rows: [
    { id: 1, name: 'Widget', total: 99.5 },
    { id: 2, name: 'Gadget', total: 149.0 },
    { id: 3, name: 'Doohickey', total: 29.99 },
  ],
  columns: [
    { name: 'id', type: 'INTEGER', nullable: false },
    { name: 'name', type: 'VARCHAR', nullable: false },
    { name: 'total', type: 'DOUBLE', nullable: false },
  ],
  rowCount: 3,
  executionTime: 2,
}

const countResult: QueryResult = {
  rows: [{ _total: 50 }],
  columns: [{ name: '_total', type: 'BIGINT', nullable: false }],
  rowCount: 1,
  executionTime: 1,
}

function createMockContext(overrides: Partial<DuckUIContextValue> = {}): DuckUIContextValue {
  const mockExecutor = {
    execute: vi.fn((sql: string) => {
      if (sql.includes('COUNT(*)')) return Promise.resolve(countResult)
      return Promise.resolve(pageResult)
    }),
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

describe('DataTable', () => {
  it('shows skeleton loading when engine is not ready', () => {
    const ctx = createMockContext({ status: 'loading', executor: null })

    const { container } = renderWithContext(
      <DataTable sql="SELECT * FROM orders" />,
      ctx
    )

    const skeletonBlocks = container.querySelectorAll('[style*="duck-ui-pulse"]')
    expect(skeletonBlocks.length).toBeGreaterThan(0)
  })

  it('shows error display with retry on query failure', async () => {
    const failExecutor = {
      execute: vi.fn(() => Promise.reject(new Error('Catalog Error: Table with name orders does not exist'))),
    } as unknown as QueryExecutor

    const ctx = createMockContext({ executor: failExecutor })

    renderWithContext(
      <DataTable sql="SELECT * FROM orders" />,
      ctx
    )

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
    })

    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('renders table with role="grid"', async () => {
    const ctx = createMockContext()

    renderWithContext(
      <DataTable sql="SELECT * FROM orders" />,
      ctx
    )

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })
  })

  it('renders column headers', async () => {
    const ctx = createMockContext()

    renderWithContext(
      <DataTable sql="SELECT * FROM orders" />,
      ctx
    )

    await waitFor(() => {
      expect(screen.getByText('id')).toBeInTheDocument()
      expect(screen.getByText('name')).toBeInTheDocument()
      expect(screen.getByText('total')).toBeInTheDocument()
    })
  })

  it('sets aria-sort on sorted column', async () => {
    const ctx = createMockContext()

    renderWithContext(
      <DataTable sql="SELECT * FROM orders" />,
      ctx
    )

    await waitFor(() => {
      expect(screen.getByText('name')).toBeInTheDocument()
    })

    // Click name header to sort ascending
    const nameHeader = screen.getByText('name').closest('th')!
    fireEvent.click(nameHeader)

    expect(nameHeader.getAttribute('aria-sort')).toBe('ascending')

    // Click again to sort descending
    fireEvent.click(nameHeader)
    expect(nameHeader.getAttribute('aria-sort')).toBe('descending')
  })

  it('has aria-label on pagination buttons', async () => {
    const ctx = createMockContext()

    renderWithContext(
      <DataTable sql="SELECT * FROM orders" pageSize={10} />,
      ctx
    )

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })

    expect(screen.getByLabelText('Go to previous page')).toBeInTheDocument()
    expect(screen.getByLabelText('Go to next page')).toBeInTheDocument()
  })

  it('has aria-live="polite" on row count', async () => {
    const ctx = createMockContext()

    const { container } = renderWithContext(
      <DataTable sql="SELECT * FROM orders" />,
      ctx
    )

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })

    const liveRegion = container.querySelector('[aria-live="polite"]')
    expect(liveRegion).toBeTruthy()
    expect(liveRegion!.textContent).toContain('50')
  })

  it('navigates to next page on button click', async () => {
    const ctx = createMockContext()

    renderWithContext(
      <DataTable sql="SELECT * FROM orders" pageSize={10} />,
      ctx
    )

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 5')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText('Go to next page'))

    await waitFor(() => {
      expect(screen.getByText('Page 2 of 5')).toBeInTheDocument()
    })
  })

  it('resets to page 0 on page size change', async () => {
    const ctx = createMockContext()

    renderWithContext(
      <DataTable sql="SELECT * FROM orders" pageSize={10} />,
      ctx
    )

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 5')).toBeInTheDocument()
    })

    // Navigate to page 2
    fireEvent.click(screen.getByLabelText('Go to next page'))
    await waitFor(() => {
      expect(screen.getByText('Page 2 of 5')).toBeInTheDocument()
    })

    // Change page size — should reset to page 1
    const select = screen.getByRole('combobox') as HTMLSelectElement
    fireEvent.change(select, { target: { value: '25' } })

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
    })
  })
})
