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
        distr: 2, // evenly spaced discrete (categorical)
      },
    },
    // Series are built dynamically in UChart — no series config here
  }
}
