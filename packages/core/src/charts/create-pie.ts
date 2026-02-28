// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DrawPieOptions {
  values: number[]
  labels?: string[]
  colors?: string[]
  size?: number
  showLabels?: boolean
  donut?: number
}

const DEFAULT_PIE_COLORS = [
  '#2563eb', '#f59e0b', '#10b981', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
]

// ---------------------------------------------------------------------------
// Pure function: draw pie/donut chart to a canvas
// ---------------------------------------------------------------------------

export function drawPie(canvas: HTMLCanvasElement, options: DrawPieOptions): void {
  const {
    values,
    labels,
    colors = DEFAULT_PIE_COLORS,
    size = 200,
    showLabels = false,
    donut = 0,
  } = options

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  canvas.width = size * dpr
  canvas.height = size * dpr
  ctx.scale(dpr, dpr)

  const total = values.reduce((a, b) => a + b, 0)
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - 10
  const innerRadius = radius * donut

  let startAngle = -Math.PI / 2

  ctx.clearRect(0, 0, size, size)

  values.forEach((value, i) => {
    const sliceAngle = (value / total) * Math.PI * 2
    const endAngle = startAngle + sliceAngle

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, radius, startAngle, endAngle)
    if (donut > 0) {
      ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true)
    }
    ctx.closePath()
    ctx.fillStyle = colors[i % colors.length]
    ctx.fill()

    if (showLabels && labels?.[i]) {
      const midAngle = startAngle + sliceAngle / 2
      const labelRadius = radius * 0.65
      const x = cx + Math.cos(midAngle) * labelRadius
      const y = cy + Math.sin(midAngle) * labelRadius
      ctx.fillStyle = '#fff'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(labels[i], x, y)
    }

    startAngle = endAngle
  })
}

// ---------------------------------------------------------------------------
// Pure function: hit-test which pie slice was clicked
// Returns the slice index, or null if not inside any slice
// ---------------------------------------------------------------------------

export function pieHitTest(
  x: number,
  y: number,
  values: number[],
  size: number,
): number | null {
  // x, y relative to canvas center
  const cx = x - size / 2
  const cy = y - size / 2

  let angle = Math.atan2(cy, cx) + Math.PI / 2
  if (angle < 0) angle += Math.PI * 2

  const total = values.reduce((a, b) => a + b, 0)
  let cumAngle = 0

  for (let i = 0; i < values.length; i++) {
    cumAngle += (values[i] / total) * Math.PI * 2
    if (angle <= cumAngle) {
      return i
    }
  }

  return null
}
