import { useRef, useEffect } from 'react'
import uPlot from 'uplot'
import { createSparkline } from '@duck_ui/core'

export interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  fill?: boolean
}

export function Sparkline({
  data,
  width = 100,
  height = 30,
  color = '#2563eb',
  fill = false,
}: SparklineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<uPlot | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    if (chartRef.current) {
      chartRef.current.destroy()
    }

    chartRef.current = createSparkline(containerRef.current, data, {
      width,
      height,
      color,
      fill,
    })

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [data, width, height, color, fill])

  return <div ref={containerRef} style={{ display: 'inline-block' }} />
}
