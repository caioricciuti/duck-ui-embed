import { useRef, useEffect } from 'react'
import { drawPie, pieHitTest } from '@duck_ui/core'

export interface PieChartProps {
  values: number[]
  labels?: string[]
  colors?: string[]
  size?: number
  showLabels?: boolean
  donut?: number
  onClick?: (index: number, value: number) => void
}

export function PieChart({
  values,
  labels,
  colors,
  size = 200,
  showLabels = false,
  donut = 0,
  onClick,
}: PieChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    drawPie(canvas, { values, labels, colors, size, showLabels, donut })
  }, [values, labels, colors, size, showLabels, donut])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onClick || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const index = pieHitTest(x, y, values, size)

    if (index !== null) {
      onClick(index, values[index])
    }
  }

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      onClick={handleClick}
    />
  )
}
