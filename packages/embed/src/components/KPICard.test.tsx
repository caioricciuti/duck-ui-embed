import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { lightTheme } from '@duck_ui/core'
import type { QueryResult } from '@duck_ui/core'
import { QueryExecutor } from '@duck_ui/core'
import { KPICard } from './KPICard'
import { DuckUIContext, type DuckUIContextValue } from '../provider/context'

const defaultResult: QueryResult = {
  rows: [{ value: 1234 }],
  columns: [{ name: 'value', type: 'INTEGER', nullable: false }],
  rowCount: 1,
  executionTime: 1,
}

const nullResult: QueryResult = {
  rows: [{ 'NULL': null }],
  columns: [{ name: 'NULL', type: 'NULL', nullable: true }],
  rowCount: 1,
  executionTime: 0,
}

function createMockContext(overrides: Partial<DuckUIContextValue> = {}): DuckUIContextValue {
  const mockExecutor = {
    execute: vi.fn((sql: string) => {
      if (sql.includes('SELECT NULL')) return Promise.resolve(nullResult)
      return Promise.resolve(defaultResult)
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

describe('KPICard', () => {
  it('renders label after data loads', async () => {
    const ctx = createMockContext()

    renderWithContext(
      <KPICard sql="SELECT sum(total) as value FROM orders" label="Revenue" />,
      ctx
    )

    await waitFor(() => {
      expect(screen.getByText('Revenue')).toBeInTheDocument()
    })
  })

  it('renders the value', async () => {
    const ctx = createMockContext()

    renderWithContext(
      <KPICard sql="SELECT sum(total) as value FROM orders" label="Count" />,
      ctx
    )

    await waitFor(() => {
      // Value is 1234, rendered via toLocaleString (may or may not have comma in jsdom)
      expect(screen.getByText(/1,?234/)).toBeInTheDocument()
    })
  })

  it('shows skeleton loading state when engine not ready', () => {
    const ctx = createMockContext({ status: 'loading', executor: null })

    const { container } = renderWithContext(
      <KPICard sql="SELECT 1" label="Test" />,
      ctx
    )

    // Skeleton KPI renders animated placeholder divs instead of "Loading..." text
    const skeletonBlocks = container.querySelectorAll('[style*="duck-ui-pulse"]')
    expect(skeletonBlocks.length).toBeGreaterThan(0)
  })
})
