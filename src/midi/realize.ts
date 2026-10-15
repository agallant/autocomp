import { expandChartBars, type Chart } from '../music'
import { buildStyleBarContext, type StyleEngine } from '../style'
import type { AbsoluteMidiNote } from './types'

/**
 * Offline-realize a chart through a style engine into absolute-beat MIDI notes.
 * Does not loop the form — one pass through `expandChartBars`.
 */
export function realizeChartMidi(chart: Chart, style: StyleEngine): AbsoluteMidiNote[] {
  const bars = expandChartBars(chart)
  const notes: AbsoluteMidiNote[] = []
  let beatCursor = 0

  for (let barIndex = 0; barIndex < bars.length; barIndex++) {
    const ctx = buildStyleBarContext(chart, barIndex)
    if (!ctx) continue
    for (const note of style.realizeBar(ctx)) {
      notes.push({
        voice: note.voice,
        midi: note.midi,
        startBeat: beatCursor + note.startBeat,
        durationBeats: Math.max(1 / 64, note.durationBeats),
        velocity: note.velocity,
      })
    }
    beatCursor += ctx.beatsPerBar
  }

  return notes
}
