import { beatsPerBar, expandChartBars, type Chart } from '../music'
import { countInBeats } from '../variation'

/** Total chart-beat length of one form pass (no loop). */
export function chartFormBeats(chart: Chart): number {
  return expandChartBars(chart).reduce(
    (sum, bar) => sum + beatsPerBar(bar.timeSignature ?? chart.timeSignature),
    0,
  )
}

/** Wall-clock seconds for one form pass at a chart-beat tempo (optional count-in silence). */
export function chartFormDurationSeconds(
  chart: Chart,
  tempoBpm: number,
  countInBars = 0,
): number {
  const bpm = Math.max(1, tempoBpm)
  const beats = chartFormBeats(chart) + countInBeats(chart, countInBars)
  return (beats * 60) / bpm
}
