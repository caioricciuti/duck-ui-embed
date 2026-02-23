import type uPlot from 'uplot'

export interface ChartData {
  /** Array of arrays: first is x-values, rest are series y-values */
  data: uPlot.AlignedData
  /** Series labels */
  labels?: string[]
  /** Category labels for categorical x-axis (bar charts with string categories) */
  xLabels?: string[]
}

export interface ChartOptions {
  /** Chart width (auto if not set) */
  width?: number
  /** Chart height */
  height?: number
  /** Chart title */
  title?: string
  /** Chart type preset */
  type?: 'line' | 'bar' | 'area' | 'scatter'
  /** Color palette override */
  colors?: string[]
  /** Show legend */
  legend?: boolean
  /** Axis format options */
  axes?: {
    x?: AxisOptions
    y?: AxisOptions
  }
  /** Event handlers */
  onPointClick?: (seriesIdx: number, dataIdx: number, value: number) => void
  onRangeSelect?: (min: number, max: number) => void
}

export interface AxisOptions {
  label?: string
  format?: 'number' | 'currency' | 'percent' | 'date' | ((value: number) => string)
}
