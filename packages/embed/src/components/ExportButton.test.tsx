import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { lightTheme } from '@duck_ui/core'
import type { QueryResult } from '@duck_ui/core'
import { ExportButton } from './ExportButton'
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
    theme: lightTheme,
    ...overrides,
  }
}

const mockData: QueryResult = {
  rows: [
    { id: 1, name: 'Widget', total: 99.5 },
    { id: 2, name: 'Gadget', total: 149.0 },
  ],
  columns: [
    { name: 'id', type: 'INTEGER', nullable: false },
    { name: 'name', type: 'VARCHAR', nullable: false },
    { name: 'total', type: 'DOUBLE', nullable: false },
  ],
  rowCount: 2,
  executionTime: 5,
}

function renderWithContext(ui: React.ReactElement, ctx: DuckUIContextValue) {
  return render(
    <DuckUIContext.Provider value={ctx}>{ui}</DuckUIContext.Provider>
  )
}

describe('ExportButton', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the export button', () => {
    const ctx = createMockContext()
    renderWithContext(<ExportButton data={mockData} />, ctx)
    expect(screen.getByText('Export')).toBeInTheDocument()
  })

  it('is disabled when no data', () => {
    const ctx = createMockContext()
    renderWithContext(<ExportButton data={null} />, ctx)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('is enabled when has data', () => {
    const ctx = createMockContext()
    renderWithContext(<ExportButton data={mockData} />, ctx)
    const button = screen.getByRole('button')
    expect(button).not.toBeDisabled()
  })

  it('triggers download on click', () => {
    const ctx = createMockContext()

    const mockCreateObjectURL = vi.fn(() => 'blob:test')
    const mockRevokeObjectURL = vi.fn()
    global.URL.createObjectURL = mockCreateObjectURL
    global.URL.revokeObjectURL = mockRevokeObjectURL

    renderWithContext(<ExportButton data={mockData} />, ctx)
    fireEvent.click(screen.getByRole('button'))

    expect(mockCreateObjectURL).toHaveBeenCalled()
    expect(mockRevokeObjectURL).toHaveBeenCalled()
  })

  it('renders custom label', () => {
    const ctx = createMockContext()
    renderWithContext(<ExportButton data={mockData} label="Download CSV" />, ctx)
    expect(screen.getByText('Download CSV')).toBeInTheDocument()
  })
})
