import type uPlot from 'uplot'

export interface ChartData {
  data: uPlot.AlignedData
  labels?: string[]
  xLabels?: string[]
}

export interface ChartOptions {
  width?: number
  height?: number
  title?: string
  type?: 'line' | 'bar' | 'area' | 'scatter'
  colors?: string[]
  legend?: boolean
  axes?: {
    x?: AxisOptions
    y?: AxisOptions
  }
  onPointClick?: (seriesIdx: number, dataIdx: number, value: number) => void
  onRangeSelect?: (min: number, max: number) => void
}

export interface AxisOptions {
  label?: string
  format?: 'number' | 'currency' | 'percent' | 'date' | ((value: number) => string)
}
