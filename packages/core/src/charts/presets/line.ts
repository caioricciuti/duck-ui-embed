import type uPlot from 'uplot'

export function linePreset(): Partial<uPlot.Options> {
  return {
    cursor: {
      drag: { x: true, y: false },
      points: {
        size: 6,
        fill: '#fff',
        width: 2,
      },
    },
    scales: {
      x: { time: false },
    },
  }
}
