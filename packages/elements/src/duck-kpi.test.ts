import { describe, it, expect, beforeAll } from 'vitest'
import { DuckKPIElement } from './duck-kpi'
import { register } from './register'

beforeAll(() => {
  register()
})

describe('DuckKPIElement', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('duck-kpi')).toBe(DuckKPIElement)
  })

  it('creates element via document.createElement', () => {
    const el = document.createElement('duck-kpi') as DuckKPIElement
    expect(el).toBeInstanceOf(DuckKPIElement)
  })

  it('has shadow DOM after connecting', () => {
    const el = document.createElement('duck-kpi') as DuckKPIElement
    document.body.appendChild(el)
    expect(el.shadowRoot).toBeTruthy()
    document.body.removeChild(el)
  })

  it('shows loading state when no provider', () => {
    const el = document.createElement('duck-kpi') as DuckKPIElement
    el.setAttribute('sql', 'SELECT 1')
    el.setAttribute('label', 'Test')
    document.body.appendChild(el)
    const loading = el.shadowRoot!.querySelector('.duck-loading')
    expect(loading).toBeTruthy()
    document.body.removeChild(el)
  })

  it('observes sql, label, format, currency attributes', () => {
    expect(DuckKPIElement.observedAttributes).toContain('sql')
    expect(DuckKPIElement.observedAttributes).toContain('label')
    expect(DuckKPIElement.observedAttributes).toContain('format')
    expect(DuckKPIElement.observedAttributes).toContain('currency')
  })
})
