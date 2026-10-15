import { beatsPerBar, expandChartBars, type Chart, type TimeSignature } from '../music'
import { buildStyleBarContextFromBars, type StyleEngine } from '../style'
import { countInBeats } from '../variation'
import type { AbsoluteMidiNote } from './types'

export type RealizeMidiOptions = {
  /** Lead-in silence in chart bars (shifts absolute note times). */
  countInBars?: number
}

/** Chart-beat length of one quarter note for a meter (4/4 → 1, 6/8 → 2). */
export function chartBeatsPerQuarter(ts: TimeSignature): number {
  return ts.denominator / 4
}

/** Quarter-note length of one chart beat (4/4 → 1, 6/8 → 0.5). */
export function quartersPerChartBeat(ts: TimeSignature): number {
  return 4 / ts.denominator
}

/**
 * Offline-realize a chart through a style engine into absolute quarter-note MIDI notes.
 * Does not loop the form — one pass through `expandChartBars`.
 * `startBeat` / `durationBeats` on the result are measured in quarter notes.
 */
export function realizeChartMidi(
  chart: Chart,
  style: StyleEngine,
  options: RealizeMidiOptions = {},
): AbsoluteMidiNote[] {
  const bars = expandChartBars(chart)
  const notes: AbsoluteMidiNote[] = []
  const countInBars = Math.max(0, Math.floor(options.countInBars ?? 0))
  const leadBeats = countInBeats(chart, countInBars)
  const openTs = bars[0]?.timeSignature ?? chart.timeSignature
  let quarterCursor = leadBeats * quartersPerChartBeat(openTs)

  for (let barIndex = 0; barIndex < bars.length; barIndex++) {
    const bar = bars[barIndex]!
    const ts = bar.timeSignature ?? chart.timeSignature
    const qPerBeat = quartersPerChartBeat(ts)
    // One-shot export: do not wrap the last bar's approach to the opening chord.
    const ctx = buildStyleBarContextFromBars(chart, bars, barIndex, { wrapNext: false })
    if (!ctx) continue
    for (const note of style.realizeBar(ctx)) {
      notes.push({
        voice: note.voice,
        midi: note.midi,
        startBeat: quarterCursor + note.startBeat * qPerBeat,
        durationBeats: Math.max(1 / 64, note.durationBeats * qPerBeat),
        velocity: note.velocity,
      })
    }
    quarterCursor += beatsPerBar(ts) * qPerBeat
  }

  return notes
}
