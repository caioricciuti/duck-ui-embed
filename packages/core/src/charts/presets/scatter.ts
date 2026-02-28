import type uPlot from 'uplot'
import uPlotModule from 'uplot'

export function scatterPreset(): Partial<uPlot.Options> {
  return {
    cursor: {
      drag: { x: true, y: true },
    },
    scales: {
      x: { time: false },
    },
    series: [
      {},
      {
        paths: uPlotModule.paths.points as uPlot.Series.PathBuilder,
        points: { size: 5, show: true },
      },
    ],
  }
}
