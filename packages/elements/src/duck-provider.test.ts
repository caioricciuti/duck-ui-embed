import { describe, it, expect, beforeAll } from 'vitest'
import { DuckProviderElement } from './duck-provider'
import { register } from './register'

beforeAll(() => {
  register()
})

describe('DuckProviderElement', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('duck-provider')).toBe(DuckProviderElement)
  })

  it('creates element via document.createElement', () => {
    const el = document.createElement('duck-provider') as DuckProviderElement
    expect(el).toBeInstanceOf(DuckProviderElement)
  })

  it('has default light theme', () => {
    const el = document.createElement('duck-provider') as DuckProviderElement
    expect(el.theme.background).toBe('#ffffff')
    expect(el.theme.textColor).toBe('#374151')
  })

  it('starts not ready', () => {
    const el = document.createElement('duck-provider') as DuckProviderElement
    expect(el.ready).toBe(false)
  })

  it('starts with empty filters', () => {
    const el = document.createElement('duck-provider') as DuckProviderElement
    expect(el.filters).toEqual({})
    expect(el.filterVersion).toBe(0)
  })

  it('sets and clears filters', () => {
    const el = document.createElement('duck-provider') as DuckProviderElement
    el.setFilter('country', 'USA')
    expect(el.filters.country).toBe('USA')
    expect(el.filterVersion).toBe(1)

    el.clearFilters()
    expect(el.filters).toEqual({})
    expect(el.filterVersion).toBe(0)
  })
})
