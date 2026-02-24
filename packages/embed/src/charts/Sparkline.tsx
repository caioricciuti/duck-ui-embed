import { useRef, useEffect } from 'react'
import uPlot from 'uplot'

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

    const xData = data.map((_, i) => i)
    const plotData: uPlot.AlignedData = [xData, data]

    const opts: uPlot.Options = {
      width,
      height,
      cursor: { show: false },
      select: { show: false, left: 0, top: 0, width: 0, height: 0 },
      legend: { show: false },
      axes: [{ show: false }, { show: false }],
      series: [
        {},
        {
          stroke: color,
          width: 1.5,
          fill: fill ? color + '30' : undefined,
        },
      ],
    }

    if (chartRef.current) {
      chartRef.current.destroy()
    }

    chartRef.current = new uPlot(opts, plotData, containerRef.current)

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [data, width, height, color, fill])

  return <div ref={containerRef} style={{ display: 'inline-block' }} />
}
