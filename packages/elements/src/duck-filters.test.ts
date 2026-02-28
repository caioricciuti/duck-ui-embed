import { describe, it, expect, beforeAll } from 'vitest'
import { DuckSelectFilterElement } from './duck-select-filter'
import { DuckRangeFilterElement } from './duck-range-filter'
import { DuckDateFilterElement } from './duck-date-filter'
import { DuckFilterBarElement } from './duck-filter-bar'
import { DuckExportElement } from './duck-export'
import { register } from './register'

beforeAll(() => {
  register()
})

describe('DuckSelectFilterElement', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('duck-select-filter')).toBe(DuckSelectFilterElement)
  })

  it('creates element with shadow DOM', () => {
    const el = document.createElement('duck-select-filter') as DuckSelectFilterElement
    el.setAttribute('column', 'status')
    el.setAttribute('label', 'Status')
    document.body.appendChild(el)
    expect(el.shadowRoot).toBeTruthy()
    expect(el.shadowRoot!.querySelector('.filter-container')).toBeTruthy()
    document.body.removeChild(el)
  })

  it('renders label when attribute set', () => {
    const el = document.createElement('duck-select-filter') as DuckSelectFilterElement
    el.setAttribute('column', 'status')
    el.setAttribute('label', 'Status')
    document.body.appendChild(el)
    const label = el.shadowRoot!.querySelector('.filter-label')
    expect(label?.textContent).toBe('Status')
    document.body.removeChild(el)
  })
})

describe('DuckRangeFilterElement', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('duck-range-filter')).toBe(DuckRangeFilterElement)
  })

  it('creates element with range controls', () => {
    const el = document.createElement('duck-range-filter') as DuckRangeFilterElement
    el.setAttribute('column', 'price')
    el.setAttribute('min', '0')
    el.setAttribute('max', '100')
    el.setAttribute('label', 'Price')
    document.body.appendChild(el)
    expect(el.shadowRoot).toBeTruthy()
    expect(el.shadowRoot!.querySelector('.range-container')).toBeTruthy()
    const thumbs = el.shadowRoot!.querySelectorAll('.thumb')
    expect(thumbs.length).toBe(2)
    document.body.removeChild(el)
  })

  it('shows min/max labels', () => {
    const el = document.createElement('duck-range-filter') as DuckRangeFilterElement
    el.setAttribute('column', 'price')
    el.setAttribute('min', '0')
    el.setAttribute('max', '1000')
    document.body.appendChild(el)
    const labels = el.shadowRoot!.querySelectorAll('.range-labels span')
    expect(labels[0]?.textContent).toBe('0')
    // toLocaleString may not add commas in jsdom
    expect(labels[1]?.textContent).toMatch(/1,?000/)
    document.body.removeChild(el)
  })
})

describe('DuckDateFilterElement', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('duck-date-filter')).toBe(DuckDateFilterElement)
  })

  it('creates element with trigger button', () => {
    const el = document.createElement('duck-date-filter') as DuckDateFilterElement
    el.setAttribute('column', 'date')
    el.setAttribute('label', 'Date')
    document.body.appendChild(el)
    expect(el.shadowRoot).toBeTruthy()
    const trigger = el.shadowRoot!.querySelector('.date-trigger')
    expect(trigger).toBeTruthy()
    document.body.removeChild(el)
  })

  it('shows placeholder text', () => {
    const el = document.createElement('duck-date-filter') as DuckDateFilterElement
    el.setAttribute('column', 'date')
    document.body.appendChild(el)
    const span = el.shadowRoot!.querySelector('.date-trigger span')
    expect(span?.textContent).toBe('Select dates')
    document.body.removeChild(el)
  })
})

describe('DuckFilterBarElement', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('duck-filter-bar')).toBe(DuckFilterBarElement)
  })

  it('creates element with slot for children', () => {
    const el = document.createElement('duck-filter-bar') as DuckFilterBarElement
    document.body.appendChild(el)
    expect(el.shadowRoot).toBeTruthy()
    const slot = el.shadowRoot!.querySelector('slot')
    expect(slot).toBeTruthy()
    document.body.removeChild(el)
  })
})

describe('DuckExportElement', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('duck-export')).toBe(DuckExportElement)
  })

  it('creates element with export button', () => {
    const el = document.createElement('duck-export') as DuckExportElement
    document.body.appendChild(el)
    expect(el.shadowRoot).toBeTruthy()
    const button = el.shadowRoot!.querySelector('.export-btn')
    expect(button).toBeTruthy()
    document.body.removeChild(el)
  })

  it('renders custom label', () => {
    const el = document.createElement('duck-export') as DuckExportElement
    el.setAttribute('label', 'Download CSV')
    document.body.appendChild(el)
    const button = el.shadowRoot!.querySelector('.export-btn')
    expect(button?.textContent).toContain('Download CSV')
    document.body.removeChild(el)
  })
})
