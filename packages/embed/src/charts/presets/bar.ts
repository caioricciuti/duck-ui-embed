import type uPlot from 'uplot'

export function barPreset(): Partial<uPlot.Options> {
  return {
    cursor: {
      drag: { x: false, y: false },
      points: { show: false },
    },
    scales: {
      x: {
        time: false,
        distr: 2,
      },
    },
  }
}
