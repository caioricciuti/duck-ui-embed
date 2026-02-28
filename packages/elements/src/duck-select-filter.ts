import { DuckElement } from './base'
import { escapeHTML } from './styles'

const selectFilterCSS = `
  .filter-container {
    position: relative;
    display: inline-block;
  }
  .filter-label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: var(--duck-text, #374151);
    margin-bottom: 4px;
  }
  .trigger {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    font-size: 13px;
    color: var(--duck-text, #374151);
    background: var(--duck-bg, #ffffff);
    border: 1px solid var(--duck-border, #e5e7eb);
    border-radius: 6px;
    cursor: pointer;
    outline: none;
    min-width: 120px;
    line-height: 1.5;
    box-sizing: border-box;
    transition: border-color 0.15s;
  }
  .trigger:focus-visible {
    border-color: var(--duck-primary, #2563eb);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--duck-primary, #2563eb) 20%, transparent);
  }
  .trigger.placeholder {
    color: var(--duck-muted, #6b7280);
  }
  .trigger-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .search-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 13px;
    line-height: 1.5;
    color: var(--duck-text, #374151);
    background: transparent;
    padding: 0;
    min-width: 0;
    width: 100%;
  }
  .clear-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border: none;
    background: var(--duck-border, #e5e7eb);
    border-radius: 50%;
    cursor: pointer;
    padding: 0;
    font-size: 10px;
    line-height: 1;
    color: var(--duck-muted, #6b7280);
    flex-shrink: 0;
  }
  .clear-btn:hover {
    background: var(--duck-muted, #6b7280);
    color: white;
  }
  .chevron {
    flex-shrink: 0;
    transition: transform 200ms ease;
    color: var(--duck-muted, #6b7280);
    display: flex;
    align-items: center;
  }
  .chevron.open {
    transform: rotate(180deg);
  }
  .dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background: var(--duck-bg, #ffffff);
    border: 1px solid var(--duck-border, #e5e7eb);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.10);
    max-height: 220px;
    overflow-y: auto;
    z-index: 50;
    padding: 4px 0;
    list-style: none;
    margin-block-start: 4px;
    margin-block-end: 0;
    padding-inline-start: 0;
    opacity: 0;
    transform: translateY(-4px);
    transition: opacity 150ms ease, transform 150ms ease;
    pointer-events: none;
  }
  .dropdown.open {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }
  .dropdown li {
    padding: 6px 10px;
    font-size: 13px;
    cursor: pointer;
    border-radius: 4px;
    margin: 0 4px;
    user-select: none;
  }
  .dropdown li.highlighted {
    background: color-mix(in srgb, var(--duck-primary, #2563eb) 12%, transparent);
  }
  .dropdown li.selected {
    color: var(--duck-primary, #2563eb);
    font-weight: 500;
  }
  .dropdown li.empty {
    color: var(--duck-muted, #6b7280);
    cursor: default;
    text-align: center;
  }
`

/**
 * <duck-select-filter> — Searchable dropdown filter.
 *
 * Usage:
 *   <duck-select-filter column="status" source="orders" label="Status"></duck-select-filter>
 */
export class DuckSelectFilterElement extends DuckElement {
  static observedAttributes = ['column', 'source', 'label', 'placeholder', 'options']

  private container!: HTMLDivElement
  private trigger!: HTMLDivElement
  private dropdown!: HTMLUListElement
  private searchInput!: HTMLInputElement

  private open = false
  private search = ''
  private highlightedIndex = 0
  private resolvedOptions: string[] = []
  private filteredOptions: string[] = []
  private optionsLoaded = false

  render(): void {
    if (!this.container) {
      this.applyStyles(selectFilterCSS)
      this.buildDOM()
    }

    this.loadOptions()
    this.updateDisplay()
  }

  private buildDOM(): void {
    this.container = document.createElement('div')
    this.container.className = 'filter-container'

    // Label
    const labelText = this.getAttribute('label')
    if (labelText) {
      const label = document.createElement('label')
      label.className = 'filter-label'
      label.textContent = labelText
      this.container.appendChild(label)
    }

    // Trigger
    this.trigger = document.createElement('div')
    this.trigger.className = 'trigger placeholder'
    this.trigger.setAttribute('role', 'combobox')
    this.trigger.setAttribute('aria-expanded', 'false')
    this.trigger.setAttribute('aria-haspopup', 'listbox')
    this.trigger.tabIndex = 0
    this.trigger.addEventListener('click', () => this.handleOpen())
    this.trigger.addEventListener('keydown', (e) => this.handleKeyDown(e))
    this.container.appendChild(this.trigger)

    // Dropdown
    this.dropdown = document.createElement('ul')
    this.dropdown.className = 'dropdown'
    this.dropdown.setAttribute('role', 'listbox')
    this.container.appendChild(this.dropdown)

    // Search input (created but not yet attached)
    this.searchInput = document.createElement('input')
    this.searchInput.type = 'text'
    this.searchInput.className = 'search-input'
    this.searchInput.setAttribute('aria-autocomplete', 'list')
    this.searchInput.addEventListener('input', () => {
      this.search = this.searchInput.value
      this.highlightedIndex = 0
      this.updateFilteredOptions()
      this.renderDropdown()
    })
    this.searchInput.addEventListener('keydown', (e) => this.handleKeyDown(e))

    // Click outside to close
    document.addEventListener('mousedown', (e) => {
      if (this.open && !this.container.contains(e.target as Node)) {
        this.close()
      }
    })

    this.shadow.appendChild(this.container)
  }

  private getCurrentValue(): string | undefined {
    const column = this.getAttribute('column')
    if (!column) return undefined
    return this.getProvider()?.filters[column] as string | undefined
  }

  private async loadOptions(): Promise<void> {
    // Check explicit options attribute
    const optionsAttr = this.getAttribute('options')
    if (optionsAttr) {
      try {
        this.resolvedOptions = JSON.parse(optionsAttr)
      } catch {
        this.resolvedOptions = optionsAttr.split(',').map((s) => s.trim())
      }
      this.filteredOptions = this.resolvedOptions
      this.optionsLoaded = true
      return
    }

    // Query for distinct values
    const source = this.getAttribute('source')
    const column = this.getAttribute('column')
    const provider = this.getProvider()

    if (!source || !column || !provider?.ready || this.optionsLoaded) return

    try {
      const result = await provider.duckUI.query(
        `SELECT DISTINCT "${column}" FROM "${source}" ORDER BY 1`
      )
      this.resolvedOptions = result.rows
        .map((row) => String(row[column] ?? ''))
        .filter(Boolean)
      this.filteredOptions = this.resolvedOptions
      this.optionsLoaded = true
    } catch {
      // Silently fail - options will be empty
    }
  }

  private updateDisplay(): void {
    if (!this.trigger) return

    const value = this.getCurrentValue()
    const placeholder = this.getAttribute('placeholder') ?? 'All'

    this.trigger.innerHTML = ''

    if (this.open) {
      this.searchInput.placeholder = value || placeholder
      this.searchInput.value = this.search
      this.trigger.appendChild(this.searchInput)
      this.trigger.className = 'trigger'
      this.trigger.tabIndex = -1
      requestAnimationFrame(() => this.searchInput.focus())
    } else {
      const span = document.createElement('span')
      span.className = 'trigger-text'
      span.textContent = value || placeholder
      this.trigger.appendChild(span)
      this.trigger.className = value ? 'trigger' : 'trigger placeholder'
      this.trigger.tabIndex = 0

      // Clear button
      if (value) {
        const clearBtn = document.createElement('button')
        clearBtn.type = 'button'
        clearBtn.className = 'clear-btn'
        clearBtn.innerHTML = '&#x2715;'
        clearBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          this.handleClear()
        })
        this.trigger.appendChild(clearBtn)
      }
    }

    // Chevron
    const chevron = document.createElement('span')
    chevron.className = this.open ? 'chevron open' : 'chevron'
    chevron.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
    this.trigger.appendChild(chevron)

    // Update dropdown
    this.dropdown.className = this.open ? 'dropdown open' : 'dropdown'
    this.trigger.setAttribute('aria-expanded', String(this.open))

    if (this.open) {
      this.renderDropdown()
    }
  }

  private updateFilteredOptions(): void {
    if (!this.search) {
      this.filteredOptions = this.resolvedOptions
    } else {
      const lower = this.search.toLowerCase()
      this.filteredOptions = this.resolvedOptions.filter((opt) =>
        opt.toLowerCase().includes(lower)
      )
    }
  }

  private renderDropdown(): void {
    this.dropdown.innerHTML = ''
    const value = this.getCurrentValue()

    if (this.filteredOptions.length === 0) {
      const li = document.createElement('li')
      li.className = 'empty'
      li.textContent = this.optionsLoaded ? 'No results' : 'Loading\u2026'
      this.dropdown.appendChild(li)
      return
    }

    this.filteredOptions.forEach((opt, i) => {
      const li = document.createElement('li')
      li.setAttribute('role', 'option')
      li.textContent = opt

      const classes: string[] = []
      if (i === this.highlightedIndex) classes.push('highlighted')
      if (opt === value) classes.push('selected')
      if (classes.length) li.className = classes.join(' ')

      li.setAttribute('aria-selected', String(opt === value))
      li.addEventListener('mouseenter', () => {
        this.highlightedIndex = i
        this.renderDropdown()
      })
      li.addEventListener('mousedown', (e) => {
        e.preventDefault()
        this.handleSelect(opt)
      })

      this.dropdown.appendChild(li)
    })

    // Scroll highlighted into view
    const highlighted = this.dropdown.children[this.highlightedIndex] as HTMLElement
    highlighted?.scrollIntoView({ block: 'nearest' })
  }

  private handleOpen(): void {
    if (this.open) return
    this.open = true
    this.search = ''
    this.highlightedIndex = 0
    this.filteredOptions = this.resolvedOptions
    this.updateDisplay()
  }

  private close(): void {
    this.open = false
    this.search = ''
    this.updateDisplay()
  }

  private handleSelect(opt: string): void {
    const column = this.getAttribute('column')
    if (!column) return

    const provider = this.getProvider()
    provider?.setFilter(column, opt || null)
    this.close()
  }

  private handleClear(): void {
    const column = this.getAttribute('column')
    if (!column) return

    this.getProvider()?.setFilter(column, null)
    this.search = ''
    this.close()
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        this.handleOpen()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        this.highlightedIndex = Math.min(this.highlightedIndex + 1, this.filteredOptions.length - 1)
        this.renderDropdown()
        break
      case 'ArrowUp':
        e.preventDefault()
        this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0)
        this.renderDropdown()
        break
      case 'Enter':
        e.preventDefault()
        if (this.filteredOptions[this.highlightedIndex]) {
          this.handleSelect(this.filteredOptions[this.highlightedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        this.close()
        break
    }
  }
}
