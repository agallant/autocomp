import type { Chart } from '../music'

/** Deep-clone a chart using `structuredClone`. */
export function cloneChart(chart: Chart): Chart {
  return structuredClone(chart)
}
