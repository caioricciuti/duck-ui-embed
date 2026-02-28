import { describe, it, expect, vi, beforeAll } from 'vitest'
import { observeSize } from './observe-size'

let observedElements: Element[] = []
let observerCallback: ResizeObserverCallback | null = null

beforeAll(() => {
  observedElements = []
  observerCallback = null

  globalThis.ResizeObserver = class {
    constructor(cb: ResizeObserverCallback) {
      observerCallback = cb
    }
    observe(el: Element) {
      observedElements.push(el)
    }
    unobserve() {}
    disconnect() {
      observedElements = []
    }
  } as unknown as typeof ResizeObserver
})

describe('observeSize', () => {
  it('calls callback with size from ResizeObserver', () => {
    const el = document.createElement('div')
    const cb = vi.fn()

    observeSize(el, cb)

    // Simulate resize event
    observerCallback?.([
      { contentRect: { width: 500, height: 300 } } as unknown as ResizeObserverEntry,
    ], {} as ResizeObserver)

    expect(cb).toHaveBeenCalledWith({ width: 500, height: 300 })
  })

  it('returns cleanup function that disconnects', () => {
    const el = document.createElement('div')
    const cb = vi.fn()

    const cleanup = observeSize(el, cb)
    expect(observedElements).toContain(el)

    cleanup()
    expect(observedElements).toEqual([])
  })

  it('rounds width and height', () => {
    const el = document.createElement('div')
    const cb = vi.fn()

    observeSize(el, cb)

    observerCallback?.([
      { contentRect: { width: 499.7, height: 300.3 } } as unknown as ResizeObserverEntry,
    ], {} as ResizeObserver)

    expect(cb).toHaveBeenCalledWith({ width: 500, height: 300 })
  })
})
