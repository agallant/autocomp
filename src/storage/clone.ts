import type { Chart } from '../music'

/** Deep-clone a chart via JSON (charts are JSON-serializable). */
export function cloneChart(chart: Chart): Chart {
  return structuredClone(chart)
}
