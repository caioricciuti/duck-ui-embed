import { DuckElement } from './base'

const TRACK_HEIGHT = 6
const THUMB_SIZE = 18

const rangeFilterCSS = `
  .range-container {
    position: relative;
    display: inline-block;
    min-width: 180px;
  }
  .filter-label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: var(--duck-text, #374151);
    margin-bottom: 8px;
  }
  .track-wrapper {
    position: relative;
    height: ${THUMB_SIZE}px;
    display: flex;
    align-items: center;
    cursor: pointer;
  }
  .track-bg {
    position: absolute;
    left: 0;
    right: 0;
    height: ${TRACK_HEIGHT}px;
    border-radius: ${TRACK_HEIGHT / 2}px;
    background: var(--duck-border, #e5e7eb);
  }
  .track-fill {
    position: absolute;
    height: ${TRACK_HEIGHT}px;
    border-radius: ${TRACK_HEIGHT / 2}px;
    background: var(--duck-primary, #2563eb);
  }
  .thumb {
    position: absolute;
    width: ${THUMB_SIZE}px;
    height: ${THUMB_SIZE}px;
    border-radius: 50%;
    background: var(--duck-bg, #ffffff);
    border: 2px solid var(--duck-primary, #2563eb);
    box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    transform: translateX(-50%);
    cursor: grab;
    z-index: 2;
    touch-action: none;
    transition: box-shadow 0.15s;
  }
  .thumb:focus-visible {
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--duck-primary, #2563eb) 15%, transparent), 0 1px 3px rgba(0,0,0,0.12);
    outline: none;
  }
  .thumb.active {
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--duck-primary, #2563eb) 15%, transparent), 0 1px 3px rgba(0,0,0,0.12);
    cursor: grabbing;
  }
  .range-labels {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 6px;
    gap: 8px;
  }
  .range-input {
    width: 64px;
    padding: 2px 6px;
    font-size: 12px;
    border: 1px solid var(--duck-border, #e5e7eb);
    border-radius: 4px;
    background: var(--duck-bg, #ffffff);
    color: var(--duck-text, #374151);
    font-variant-numeric: tabular-nums;
    text-align: center;
  }
  .range-sep {
    font-size: 12px;
    color: var(--duck-muted, #6b7280);
  }
`

/**
 * <duck-range-filter> — Dual-thumb range slider filter.
 *
 * Usage:
 *   <duck-range-filter column="total" min="0" max="1000" step="10" label="Total"></duck-range-filter>
 */
export class DuckRangeFilterElement extends DuckElement {
  static observedAttributes = ['column', 'min', 'max', 'step', 'label']

  private container!: HTMLDivElement
  private trackWrapper!: HTMLDivElement
  private trackFill!: HTMLDivElement
  private thumbLo!: HTMLDivElement
  private thumbHi!: HTMLDivElement
  private labelLo!: HTMLSpanElement
  private labelHi!: HTMLSpanElement
  private dragging: 'lo' | 'hi' | null = null

  private get min(): number { return parseFloat(this.getAttribute('min') ?? '0') }
  private get max(): number { return parseFloat(this.getAttribute('max') ?? '100') }
  private get step(): number { return parseFloat(this.getAttribute('step') ?? '1') }

  private get lo(): number {
    const val = this.getCurrentValue()
    return val?.min ?? this.min
  }

  private get hi(): number {
    const val = this.getCurrentValue()
    return val?.max ?? this.max
  }

  render(): void {
    if (!this.container) {
      this.applyStyles(rangeFilterCSS)
      this.buildDOM()
    }
    this.updatePositions()
  }

  private getCurrentValue(): { min: number; max: number } | undefined {
    const column = this.getAttribute('column')
    if (!column) return undefined
    return this.getProvider()?.filters[column] as { min: number; max: number } | undefined
  }

  private buildDOM(): void {
    this.container = document.createElement('div')
    this.container.className = 'range-container'

    const labelText = this.getAttribute('label')
    if (labelText) {
      const label = document.createElement('label')
      label.className = 'filter-label'
      label.textContent = labelText
      this.container.appendChild(label)
    }

    this.trackWrapper = document.createElement('div')
    this.trackWrapper.className = 'track-wrapper'
    this.trackWrapper.addEventListener('click', (e) => this.handleTrackClick(e))

    const trackBg = document.createElement('div')
    trackBg.className = 'track-bg'
    this.trackWrapper.appendChild(trackBg)

    this.trackFill = document.createElement('div')
    this.trackFill.className = 'track-fill'
    this.trackWrapper.appendChild(this.trackFill)

    // Lo thumb
    this.thumbLo = document.createElement('div')
    this.thumbLo.className = 'thumb'
    this.thumbLo.setAttribute('role', 'slider')
    this.thumbLo.tabIndex = 0
    this.thumbLo.addEventListener('pointerdown', (e) => this.startDrag(e, 'lo'))
    this.thumbLo.addEventListener('keydown', (e) => this.handleKeyDown(e, 'lo'))
    this.trackWrapper.appendChild(this.thumbLo)

    // Hi thumb
    this.thumbHi = document.createElement('div')
    this.thumbHi.className = 'thumb'
    this.thumbHi.setAttribute('role', 'slider')
    this.thumbHi.tabIndex = 0
    this.thumbHi.addEventListener('pointerdown', (e) => this.startDrag(e, 'hi'))
    this.thumbHi.addEventListener('keydown', (e) => this.handleKeyDown(e, 'hi'))
    this.trackWrapper.appendChild(this.thumbHi)

    this.container.appendChild(this.trackWrapper)

    // Input fields
    const labelsDiv = document.createElement('div')
    labelsDiv.className = 'range-labels'

    const inputLo = document.createElement('input')
    inputLo.type = 'number'
    inputLo.className = 'range-input'
    inputLo.step = String(this.step)
    inputLo.addEventListener('change', () => {
      const v = parseFloat(inputLo.value)
      if (!isNaN(v)) this.commit(v, this.hi)
    })
    this.labelLo = inputLo as unknown as HTMLSpanElement

    const sep = document.createElement('span')
    sep.className = 'range-sep'
    sep.innerHTML = '&ndash;'

    const inputHi = document.createElement('input')
    inputHi.type = 'number'
    inputHi.className = 'range-input'
    inputHi.step = String(this.step)
    inputHi.addEventListener('change', () => {
      const v = parseFloat(inputHi.value)
      if (!isNaN(v)) this.commit(this.lo, v)
    })
    this.labelHi = inputHi as unknown as HTMLSpanElement

    labelsDiv.appendChild(inputLo)
    labelsDiv.appendChild(sep)
    labelsDiv.appendChild(inputHi)
    this.container.appendChild(labelsDiv)

    this.shadow.appendChild(this.container)
  }

  private toPercent(v: number): number {
    return ((v - this.min) / (this.max - this.min)) * 100
  }

  private posToValue(clientX: number): number {
    const rect = this.trackWrapper.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const raw = this.min + ratio * (this.max - this.min)
    return Math.round(raw / this.step) * this.step
  }

  private commit(newLo: number, newHi: number): void {
    const column = this.getAttribute('column')
    if (!column) return

    let clamped = {
      min: Math.max(this.min, Math.min(newLo, this.max)),
      max: Math.min(this.max, Math.max(newHi, this.min)),
    }
    if (clamped.min > clamped.max) {
      const tmp = clamped.min
      clamped.min = clamped.max
      clamped.max = tmp
    }

    const provider = this.getProvider()
    if (clamped.min <= this.min && clamped.max >= this.max) {
      provider?.setFilter(column, null)
    } else {
      provider?.setFilter(column, clamped)
    }

    this.updatePositions()
  }

  private updatePositions(): void {
    if (!this.trackFill) return

    const loPercent = this.toPercent(this.lo)
    const hiPercent = this.toPercent(this.hi)

    this.trackFill.style.left = `${loPercent}%`
    this.trackFill.style.width = `${hiPercent - loPercent}%`
    this.thumbLo.style.left = `${loPercent}%`
    this.thumbHi.style.left = `${hiPercent}%`

    const fmt = (v: number) =>
      Number.isInteger(v) ? v.toLocaleString() : v.toLocaleString(undefined, { maximumFractionDigits: 2 })

    // Update input values
    const loInput = this.labelLo as unknown as HTMLInputElement
    const hiInput = this.labelHi as unknown as HTMLInputElement
    if (document.activeElement !== loInput) loInput.value = fmt(this.lo)
    if (document.activeElement !== hiInput) hiInput.value = fmt(this.hi)

    // ARIA
    const column = this.getAttribute('column') ?? ''
    const label = this.getAttribute('label') ?? column
    this.thumbLo.setAttribute('aria-label', `${label} minimum`)
    this.thumbLo.setAttribute('aria-valuemin', String(this.min))
    this.thumbLo.setAttribute('aria-valuemax', String(this.hi))
    this.thumbLo.setAttribute('aria-valuenow', String(this.lo))
    this.thumbHi.setAttribute('aria-label', `${label} maximum`)
    this.thumbHi.setAttribute('aria-valuemin', String(this.lo))
    this.thumbHi.setAttribute('aria-valuemax', String(this.max))
    this.thumbHi.setAttribute('aria-valuenow', String(this.hi))
  }

  private startDrag(e: PointerEvent, which: 'lo' | 'hi'): void {
    e.preventDefault()
    e.stopPropagation()
    this.dragging = which

    const thumb = which === 'lo' ? this.thumbLo : this.thumbHi
    thumb.classList.add('active')

    const onMove = (ev: PointerEvent) => {
      const v = this.posToValue(ev.clientX)
      if (this.dragging === 'lo') {
        this.commit(v, this.hi)
      } else {
        this.commit(this.lo, v)
      }
    }

    const onUp = () => {
      thumb.classList.remove('active')
      this.dragging = null
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }

  private handleTrackClick(e: MouseEvent): void {
    if (this.dragging) return
    const v = this.posToValue(e.clientX)
    const distLo = Math.abs(v - this.lo)
    const distHi = Math.abs(v - this.hi)
    if (distLo <= distHi) {
      this.commit(v, this.hi)
    } else {
      this.commit(this.lo, v)
    }
  }

  private handleKeyDown(e: KeyboardEvent, which: 'lo' | 'hi'): void {
    let delta = 0
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') delta = this.step
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') delta = -this.step
    else return

    e.preventDefault()
    if (which === 'lo') {
      this.commit(this.lo + delta, this.hi)
    } else {
      this.commit(this.lo, this.hi + delta)
    }
  }
}
