import { beatsPerBar, expandChartBars, type Chart } from '../music'

/** Chart-beat length of a count-in using the first form bar's meter. */
export function countInBeats(chart: Chart, countInBars: number): number {
  const bars = Number.isFinite(countInBars) ? Math.max(0, Math.floor(countInBars)) : 0
  if (bars === 0) return 0
  const expanded = expandChartBars(chart)
  const first = expanded[0]
  if (!first) return 0
  return bars * beatsPerBar(first.timeSignature ?? chart.timeSignature)
}
