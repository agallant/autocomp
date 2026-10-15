import { beatsPerBar, expandChartBars, type Chart } from '../music'

/** Total chart-beat length of one form pass (no loop). */
export function chartFormBeats(chart: Chart): number {
  return expandChartBars(chart).reduce(
    (sum, bar) => sum + beatsPerBar(bar.timeSignature ?? chart.timeSignature),
    0,
  )
}

/** Wall-clock seconds for one form pass at a chart-beat tempo. */
export function chartFormDurationSeconds(chart: Chart, tempoBpm: number): number {
  const bpm = Math.max(1, tempoBpm)
  return (chartFormBeats(chart) * 60) / bpm
}
