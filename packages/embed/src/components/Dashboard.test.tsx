import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { lightTheme } from '@duck_ui/core'
import type { QueryExecutor } from '@duck_ui/core'
import { Dashboard } from './Dashboard'
import { DuckUIContext, type DuckUIContextValue } from '../provider/context'

// jsdom doesn't provide ResizeObserver
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

function createMockContext(overrides: Partial<DuckUIContextValue> = {}): DuckUIContextValue {
  return {
    query: vi.fn(),
    executor: { execute: vi.fn() } as unknown as QueryExecutor,
    inspector: null,
    cache: null,
    status: 'ready',
    error: null,
    filters: {},
    setFilter: vi.fn(),
    clearFilters: vi.fn(),
    filterVersion: 0,
    tableNames: [],
    license: null,
    theme: lightTheme,
    ...overrides,
  }
}

function renderWithContext(ui: React.ReactElement, ctx: DuckUIContextValue) {
  return render(<DuckUIContext.Provider value={ctx}>{ui}</DuckUIContext.Provider>)
}

describe('Dashboard', () => {
  it('renders children', () => {
    const ctx = createMockContext()

    renderWithContext(
      <Dashboard>
        <Dashboard.Panel>
          <span>Panel content</span>
        </Dashboard.Panel>
      </Dashboard>,
      ctx,
    )

    expect(screen.getByText('Panel content')).toBeInTheDocument()
  })

  it('renders multiple panels', () => {
    const ctx = createMockContext()

    renderWithContext(
      <Dashboard columns={3}>
        <Dashboard.Panel>
          <span>First</span>
        </Dashboard.Panel>
        <Dashboard.Panel>
          <span>Second</span>
        </Dashboard.Panel>
        <Dashboard.Panel>
          <span>Third</span>
        </Dashboard.Panel>
      </Dashboard>,
      ctx,
    )

    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
    expect(screen.getByText('Third')).toBeInTheDocument()
  })

  it('applies grid display to container', () => {
    const ctx = createMockContext()

    const { container } = renderWithContext(
      <Dashboard columns={2}>
        <Dashboard.Panel>
          <span>A</span>
        </Dashboard.Panel>
      </Dashboard>,
      ctx,
    )

    const grid = container.firstElementChild as HTMLElement
    expect(grid.style.display).toBe('grid')
  })

  it('applies theme background', () => {
    const ctx = createMockContext()

    const { container } = renderWithContext(
      <Dashboard>
        <Dashboard.Panel>
          <span>Themed</span>
        </Dashboard.Panel>
      </Dashboard>,
      ctx,
    )

    const grid = container.firstElementChild as HTMLElement
    // jsdom normalizes hex to rgb
    expect(grid.style.background).toBeTruthy()
  })

  it('applies panel border from theme', () => {
    const ctx = createMockContext()

    const { container } = renderWithContext(
      <Dashboard>
        <Dashboard.Panel>
          <span>Bordered</span>
        </Dashboard.Panel>
      </Dashboard>,
      ctx,
    )

    const panel = screen.getByText('Bordered').parentElement as HTMLElement
    expect(panel.style.border).toContain('1px solid')
  })

  it('applies span to panel', () => {
    const ctx = createMockContext()

    const { container } = renderWithContext(
      <Dashboard columns={3}>
        <Dashboard.Panel span={2}>
          <span>Wide</span>
        </Dashboard.Panel>
      </Dashboard>,
      ctx,
    )

    const panel = screen.getByText('Wide').parentElement as HTMLElement
    expect(panel.style.gridColumn).toBe('span 2')
  })

  it('applies className to container and panel', () => {
    const ctx = createMockContext()

    const { container } = renderWithContext(
      <Dashboard className="my-dashboard">
        <Dashboard.Panel className="my-panel">
          <span>Custom</span>
        </Dashboard.Panel>
      </Dashboard>,
      ctx,
    )

    const grid = container.firstElementChild as HTMLElement
    expect(grid.className).toBe('my-dashboard')

    const panel = screen.getByText('Custom').parentElement as HTMLElement
    expect(panel.className).toBe('my-panel')
  })
})
