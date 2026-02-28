import { describe, it, expect, beforeAll } from 'vitest'
import { DuckChartElement } from './duck-chart'
import { register } from './register'

beforeAll(() => {
  register()
})

describe('DuckChartElement', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('duck-chart')).toBe(DuckChartElement)
  })

  it('creates element via document.createElement', () => {
    const el = document.createElement('duck-chart') as DuckChartElement
    expect(el).toBeInstanceOf(DuckChartElement)
  })

  it('has shadow DOM after connecting', () => {
    const el = document.createElement('duck-chart') as DuckChartElement
    document.body.appendChild(el)
    expect(el.shadowRoot).toBeTruthy()
    document.body.removeChild(el)
  })

  it('shows loading state when no provider', () => {
    const el = document.createElement('duck-chart') as DuckChartElement
    el.setAttribute('sql', 'SELECT 1')
    document.body.appendChild(el)
    const loading = el.shadowRoot!.querySelector('.duck-loading')
    expect(loading).toBeTruthy()
    document.body.removeChild(el)
  })

  it('observes sql, type, height, width, title attributes', () => {
    expect(DuckChartElement.observedAttributes).toContain('sql')
    expect(DuckChartElement.observedAttributes).toContain('type')
    expect(DuckChartElement.observedAttributes).toContain('height')
  })
})
