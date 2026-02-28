import { baseStyles } from './styles'
import type { DuckProviderElement } from './duck-provider'
import type { DuckTheme } from '@duck_ui/core'
import { lightTheme } from '@duck_ui/core'

/**
 * Shared base class for all duck-* custom elements.
 * Provides Shadow DOM setup, theme access, and provider lookup.
 */
export abstract class DuckElement extends HTMLElement {
  protected shadow: ShadowRoot
  private _providerRef: DuckProviderElement | null = null

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }

  /** Walk up the DOM tree to find the nearest <duck-provider> ancestor. */
  protected getProvider(): DuckProviderElement | null {
    if (this._providerRef) return this._providerRef

    let el: HTMLElement | null = this.parentElement
    while (el) {
      if (el.tagName === 'DUCK-PROVIDER') {
        this._providerRef = el as unknown as DuckProviderElement
        return this._providerRef
      }
      el = el.parentElement
    }

    return null
  }

  /** Get the resolved theme from the nearest provider, or lightTheme as fallback. */
  protected getTheme(): DuckTheme {
    return this.getProvider()?.theme ?? lightTheme
  }

  /** Apply base styles + component-specific CSS to shadow DOM. */
  protected applyStyles(componentCSS: string): void {
    const style = document.createElement('style')
    style.textContent = baseStyles + '\n' + componentCSS
    this.shadow.appendChild(style)
  }

  /** Create a container div inside shadow DOM, return it for rendering. */
  protected createContainer(className?: string): HTMLDivElement {
    const container = document.createElement('div')
    if (className) container.className = className
    this.shadow.appendChild(container)
    return container
  }

  /** Override in subclass to render content. Called on connectedCallback and attribute changes. */
  abstract render(): void

  connectedCallback(): void {
    this.render()

    // Listen for filter changes from the provider
    const provider = this.getProvider()
    if (provider) {
      provider.addEventListener('duck-filter-change', () => this.render())
      provider.addEventListener('duck-ready', () => this.render())
    }
  }

  disconnectedCallback(): void {
    this._providerRef = null
  }

  attributeChangedCallback(): void {
    if (this.isConnected) {
      this.render()
    }
  }
}
