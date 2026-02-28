import type uPlot from 'uplot'

export interface TooltipOptions {
  formatValue?: (value: number, seriesIdx: number) => string
  formatX?: (value: number) => string
  className?: string
}

export function tooltipPlugin(opts: TooltipOptions = {}): uPlot.Plugin {
  let tooltipEl: HTMLDivElement | null = null
  let over: HTMLElement | null = null

  function init(u: uPlot) {
    over = u.over

    tooltipEl = document.createElement('div')
    tooltipEl.style.cssText = [
      'display: none',
      'position: absolute',
      'pointer-events: none',
      'z-index: 100',
      'background: rgba(255,255,255,0.96)',
      'border: 1px solid #e5e7eb',
      'border-radius: 6px',
      'padding: 8px 12px',
      'font-size: 12px',
      'line-height: 1.5',
      'box-shadow: 0 4px 12px rgba(0,0,0,0.1)',
      'font-family: system-ui, -apple-system, sans-serif',
      'min-width: 120px',
      'white-space: nowrap',
    ].join(';')

    if (opts.className) {
      tooltipEl.className = opts.className
    }

    over.appendChild(tooltipEl)
  }

  function setCursor(u: uPlot) {
    if (!tooltipEl || !over) return

    const { idx } = u.cursor
    if (idx == null) {
      tooltipEl.style.display = 'none'
      return
    }

    const xVal = u.data[0][idx]
    const xLabel = opts.formatX
      ? opts.formatX(xVal)
      : typeof xVal === 'number' && xVal > 1e9
        ? new Date(xVal * 1000).toLocaleDateString()
        : String(xVal)

    let html = `<div style="font-weight:600;margin-bottom:4px;color:#374151">${xLabel}</div>`

    for (let i = 1; i < u.series.length; i++) {
      const s = u.series[i]
      if (!s.show) continue

      const yVal = u.data[i][idx]
      if (yVal == null) continue

      const color = typeof s.stroke === 'function'
        ? (s.stroke as (self: uPlot, seriesIdx: number) => string)(u, i)
        : (s.stroke as string) ?? '#374151'
      const label = s.label ?? `Series ${i}`
      const formatted = opts.formatValue
        ? opts.formatValue(yVal, i)
        : typeof yVal === 'number'
          ? yVal.toLocaleString(undefined, { maximumFractionDigits: 2 })
          : String(yVal)

      html += `<div style="display:flex;align-items:center;gap:6px">`
      html += `<span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0"></span>`
      html += `<span style="color:#6b7280">${label}:</span>`
      html += `<span style="font-weight:600;color:#111827;margin-left:auto">${formatted}</span>`
      html += `</div>`
    }

    tooltipEl.innerHTML = html
    tooltipEl.style.display = 'block'

    const { left, top } = u.cursor
    if (left == null || top == null) return

    const overRect = over.getBoundingClientRect()
    const ttRect = tooltipEl.getBoundingClientRect()

    let x = left + 12
    let y = top - 12

    if (x + ttRect.width > overRect.width) {
      x = left - ttRect.width - 12
    }

    if (y < 0) {
      y = top + 12
    }

    if (y + ttRect.height > overRect.height) {
      y = overRect.height - ttRect.height
    }

    tooltipEl.style.left = x + 'px'
    tooltipEl.style.top = y + 'px'
  }

  function destroy() {
    if (tooltipEl && tooltipEl.parentElement) {
      tooltipEl.parentElement.removeChild(tooltipEl)
    }
    tooltipEl = null
    over = null
  }

  return {
    hooks: {
      init,
      setCursor,
      destroy,
    },
  }
}
