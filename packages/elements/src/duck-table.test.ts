import { describe, it, expect, beforeAll } from 'vitest'
import { DuckTableElement } from './duck-table'
import { register } from './register'

beforeAll(() => {
  register()
})

describe('DuckTableElement', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('duck-table')).toBe(DuckTableElement)
  })

  it('creates element via document.createElement', () => {
    const el = document.createElement('duck-table') as DuckTableElement
    expect(el).toBeInstanceOf(DuckTableElement)
  })

  it('has shadow DOM after connecting', () => {
    const el = document.createElement('duck-table') as DuckTableElement
    document.body.appendChild(el)
    expect(el.shadowRoot).toBeTruthy()
    document.body.removeChild(el)
  })

  it('shows loading state when no provider', () => {
    const el = document.createElement('duck-table') as DuckTableElement
    el.setAttribute('sql', 'SELECT * FROM orders')
    document.body.appendChild(el)
    const loading = el.shadowRoot!.querySelector('.duck-loading')
    expect(loading).toBeTruthy()
    document.body.removeChild(el)
  })

  it('observes sql, page-size, sortable, striped attributes', () => {
    expect(DuckTableElement.observedAttributes).toContain('sql')
    expect(DuckTableElement.observedAttributes).toContain('page-size')
    expect(DuckTableElement.observedAttributes).toContain('sortable')
    expect(DuckTableElement.observedAttributes).toContain('striped')
  })
})
