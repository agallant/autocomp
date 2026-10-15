import { beatsPerBar, expandChartBars, type Chart } from '../music'

/** Practical upper bound for count-in length (UI + clamp). */
export const MAX_COUNT_IN_BARS = 8

/** Common count-in lengths offered in the toolbar. */
export const COUNT_IN_BAR_OPTIONS = [0, 1, 2, 4] as const

export function clampCountInBars(bars: number): number {
  if (!Number.isFinite(bars)) return 0
  return Math.min(MAX_COUNT_IN_BARS, Math.max(0, Math.floor(bars)))
}

/** Chart-beat length of a count-in using the first form bar's meter. */
export function countInBeats(chart: Chart, countInBars: number): number {
  const bars = clampCountInBars(countInBars)
  if (bars === 0) return 0
  const expanded = expandChartBars(chart)
  const first = expanded[0]
  if (!first) return 0
  return bars * beatsPerBar(first.timeSignature ?? chart.timeSignature)
}
