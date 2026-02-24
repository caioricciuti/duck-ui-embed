import { useRef, useEffect, useCallback } from 'react'
import uPlot from 'uplot'
import uPlotModule from 'uplot'
import 'uplot/dist/uPlot.min.css'
import type { ChartData, ChartOptions } from './types'
import { linePreset } from './presets/line'
import { barPreset } from './presets/bar'
import { areaPreset } from './presets/area'
import { scatterPreset } from './presets/scatter'
import { useResizeObserver } from './utils/responsive'
import { defaultPalette } from './utils/colors'
import { buildAxisFormatter } from './utils/format'
import { tooltipPlugin, type TooltipOptions } from './plugins/tooltip'
import type { ChartTheme } from './theme'
import { lightTheme } from './theme'

export interface UChartProps extends ChartOptions {
  data: ChartData['data']
  labels?: string[]
  xLabels?: string[]
  className?: string
  theme?: ChartTheme
  tooltip?: boolean | TooltipOptions
}

function getPreset(type: ChartOptions['type']): Partial<uPlot.Options> {
  switch (type) {
    case 'bar':
      return barPreset()
    case 'area':
      return areaPreset()
    case 'scatter':
      return scatterPreset()
    case 'line':
    default:
      return linePreset()
  }
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
    const palette = colors ?? theme.palette ?? defaultPalette
    const preset = getPreset(type)
    const chartWidth = width ?? size.width ?? 400

    const isBar = type === 'bar'
    const isCategorical = !!xLabels && xLabels.length > 0

    const seriesCount = data.length - 1
    const series: uPlot.Series[] = [
      { label: labels?.[0] ?? 'x' },
      ...Array.from({ length: seriesCount }, (_, i) => {
        const color = palette[i % palette.length]
        const presetSeries = (preset as { series?: uPlot.Series[] }).series?.[1]

        if (isBar) {
          return {
            label: labels?.[i + 1] ?? `Series ${i + 1}`,
            stroke: color,
            width: 0,
            fill: color + 'cc',
            paths: uPlotModule.paths.bars?.({
              size: [0.6, 100],
              radius: 0,
            }) as uPlot.Series.PathBuilder,
            points: { show: false },
          } as uPlot.Series
        }

        return {
          label: labels?.[i + 1] ?? `Series ${i + 1}`,
          stroke: color,
          width: 2,
          fill: type === 'area' ? color + '30' : undefined,
          points: {
            show: type === 'scatter' || type === 'line',
            size: type === 'scatter' ? 6 : 4,
            fill: color,
          },
          ...presetSeries,
        } as uPlot.Series
      }),
    ]

    const plugins: uPlot.Plugin[] = []

    if (tooltip) {
      const tooltipOpts: TooltipOptions = typeof tooltip === 'object' ? { ...tooltip } : {}
      if (isCategorical && !tooltipOpts.formatX) {
        const capturedLabels = xLabels
        tooltipOpts.formatX = (val: number) => capturedLabels[Math.round(val)] ?? String(val)
      }
      plugins.push(tooltipPlugin(tooltipOpts))
    }

    const showLegend = tooltip ? false : legend

    const chartAxes: uPlot.Axis[] = [
      {
        label: axes?.x?.label,
        values: isCategorical
          ? (_u: uPlot, ticks: number[]) => ticks.map((v) => xLabels[Math.round(v)] ?? '')
          : axes?.x?.format
            ? buildAxisFormatter(axes.x.format)
            : undefined,
        stroke: theme.axisColor,
        grid: { stroke: theme.gridColor, width: 1 },
        ticks: { stroke: theme.gridColor, width: 1 },
        font: `${theme.fontSize}px ${theme.fontFamily}`,
        labelFont: `bold ${theme.fontSize}px ${theme.fontFamily}`,
        labelSize: 20,
        gap: 8,
        rotate: isCategorical && xLabels.length > 6 ? -45 : 0,
        size: isCategorical && xLabels.length > 6 ? 60 : undefined,
      },
      {
        label: axes?.y?.label,
        values: axes?.y?.format ? buildAxisFormatter(axes.y.format) : undefined,
        stroke: theme.axisColor,
        grid: { stroke: theme.gridColor, width: 1 },
        ticks: { stroke: theme.gridColor, width: 1 },
        font: `${theme.fontSize}px ${theme.fontFamily}`,
        labelFont: `bold ${theme.fontSize}px ${theme.fontFamily}`,
        labelSize: 20,
        size: 60,
      },
    ]

    const scales: uPlot.Scales = {
      ...(preset as { scales?: uPlot.Scales }).scales,
    }

    if (isCategorical) {
      const catCount = xLabels.length
      scales.x = {
        ...scales.x,
        time: false,
        distr: 2,
        range: (_u: uPlot, _min: number, _max: number): [number, number] => [-0.5, catCount - 0.5],
      }
    }

    const hooks: uPlot.Options['hooks'] = {}

    if (onPointClick) {
      hooks.setCursor = [
        (u: uPlot) => {
          const idx = u.cursor.idx
          if (idx == null) return
        },
      ]

      hooks.drawClear = [
        (u: uPlot) => {
          const el = u.over
          if (el && !(el as HTMLElement & { __duckClick?: boolean }).__duckClick) {
            ;(el as HTMLElement & { __duckClick?: boolean }).__duckClick = true
            el.addEventListener('click', () => {
              const idx = u.cursor.idx
              if (idx == null) return
              for (let si = 1; si < u.data.length; si++) {
                const val = u.data[si][idx]
                if (val != null) {
                  onPointClick(si, idx, val)
                  break
                }
              }
            })
          }
        },
      ]
    }

    if (onRangeSelect) {
      hooks.setSelect = [
        (u: uPlot) => {
          const min = u.posToVal(u.select.left, 'x')
          const max = u.posToVal(u.select.left + u.select.width, 'x')
          if (min !== max) {
            onRangeSelect(min, max)
          }
        },
      ]
    }

    return {
      width: chartWidth,
      height,
      title,
      series,
      plugins,
      legend: {
        show: showLegend,
        live: true,
      },
      cursor: {
        focus: { prox: 16 },
        ...((preset as { cursor?: uPlot.Cursor }).cursor ?? {}),
      },
      axes: chartAxes,
      scales,
      padding: [12, 16, 0, 16],
      hooks: Object.keys(hooks).length > 0 ? hooks : undefined,
    }
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
