import { useRef, useEffect, useCallback } from 'react'
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import { buildChartOptions, lightTheme } from '@duck_ui/core'
import type { ChartData, ChartOptions, ChartTheme, TooltipOptions } from '@duck_ui/core'
import { useResizeObserver } from './utils/responsive'

export interface UChartProps extends ChartOptions {
  data: ChartData['data']
  labels?: string[]
  xLabels?: string[]
  className?: string
  theme?: ChartTheme
  tooltip?: boolean | TooltipOptions
}

export function UChart({
  data,
  labels,
  xLabels,
  type = 'line',
  width,
  height = 300,
  title,
  colors,
  legend = true,
  axes,
  onPointClick,
  onRangeSelect,
  className,
  theme = lightTheme,
  tooltip = true,
}: UChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<uPlot | null>(null)
  const size = useResizeObserver(containerRef)

  const buildOptions = useCallback((): uPlot.Options => {
    return buildChartOptions({
      data,
      labels,
      xLabels,
      type,
      width: width ?? size.width ?? 400,
      height,
      title,
      colors,
      legend,
      axes,
      tooltip,
      theme,
      onPointClick,
      onRangeSelect,
    })
  }, [data, labels, xLabels, type, width, height, title, colors, legend, axes, onPointClick, onRangeSelect, size.width, theme, tooltip])

  useEffect(() => {
    if (!containerRef.current) return

    if (chartRef.current) {
      chartRef.current.destroy()
      chartRef.current = null
    }

    const opts = buildOptions()
    chartRef.current = new uPlot(opts, data, containerRef.current)

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [data, buildOptions])

  useEffect(() => {
    if (chartRef.current && size.width) {
      chartRef.current.setSize({ width: width ?? size.width, height })
    }
  }, [size.width, width, height])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        background: theme.background,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    />
  )
}
