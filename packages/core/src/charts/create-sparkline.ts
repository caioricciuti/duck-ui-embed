import uPlot from 'uplot'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SparklineOptions {
  width?: number
  height?: number
  color?: string
  fill?: boolean
}

// ---------------------------------------------------------------------------
// Factory: creates a sparkline uPlot instance in a container
// ---------------------------------------------------------------------------

export function createSparkline(
  container: HTMLElement,
  data: number[],
  options?: SparklineOptions,
): uPlot {
  const {
    width = 100,
    height = 30,
    color = '#2563eb',
    fill = false,
  } = options ?? {}

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

  return new uPlot(opts, plotData, container)
}
