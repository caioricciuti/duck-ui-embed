import { describe, it, expect, beforeAll } from 'vitest'
import { DuckDashboardElement, DuckPanelElement } from './duck-dashboard'
import { DuckProviderElement } from './duck-provider'
import { register } from './register'

beforeAll(() => {
  register()
})

describe('DuckDashboardElement', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('duck-dashboard')).toBe(DuckDashboardElement)
  })

  it('creates element via document.createElement', () => {
    const el = document.createElement('duck-dashboard') as DuckDashboardElement
    expect(el).toBeInstanceOf(DuckDashboardElement)
  })

  it('has shadow DOM with slot', () => {
    const el = document.createElement('duck-dashboard') as DuckDashboardElement
    document.body.appendChild(el)
    expect(el.shadowRoot).toBeTruthy()
    const slot = el.shadowRoot!.querySelector('slot')
    expect(slot).toBeTruthy()
    document.body.removeChild(el)
  })

  it('reads columns/gap/padding attributes', () => {
    const el = document.createElement('duck-dashboard') as DuckDashboardElement
    el.setAttribute('columns', '3')
    el.setAttribute('gap', '20')
    el.setAttribute('padding', '32')
    document.body.appendChild(el)
    const grid = el.shadowRoot!.querySelector('.dashboard-grid') as HTMLDivElement
    expect(grid).toBeTruthy()
    expect(grid.style.gap).toBe('20px')
    expect(grid.style.padding).toBe('32px')
    document.body.removeChild(el)
  })
})

describe('DuckPanelElement', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('duck-panel')).toBe(DuckPanelElement)
  })

  it('creates element via document.createElement', () => {
    const el = document.createElement('duck-panel') as DuckPanelElement
    expect(el).toBeInstanceOf(DuckPanelElement)
  })

  it('has shadow DOM with slot', () => {
    const el = document.createElement('duck-panel') as DuckPanelElement
    document.body.appendChild(el)
    expect(el.shadowRoot).toBeTruthy()
    const slot = el.shadowRoot!.querySelector('slot')
    expect(slot).toBeTruthy()
    document.body.removeChild(el)
  })

  it('sets grid-column span from attribute', () => {
    const el = document.createElement('duck-panel') as DuckPanelElement
    el.setAttribute('span', '2')
    document.body.appendChild(el)
    expect(el.style.gridColumn).toBe('span 2')
    document.body.removeChild(el)
  })
})
