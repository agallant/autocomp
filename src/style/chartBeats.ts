import { beatsPerBar, expandChartBars, type Bar, type Chart, type Chord } from '../music'
import type { StyleBarContext } from './types'

/** Chord sounding at a beat offset within a bar (0-based beat). */
export function chordAtBeat(bar: Bar, beatIndex: number): Chord | null {
  let cursor = 0
  for (const slot of bar.slots) {
    const end = cursor + slot.durationBeats
    if (beatIndex >= cursor && beatIndex < end) {
      return slot.chord
    }
    cursor = end
  }
  // Fall back to last non-null chord in the bar.
  for (let i = bar.slots.length - 1; i >= 0; i--) {
    if (bar.slots[i]!.chord) return bar.slots[i]!.chord
  }
  return null
}

export function firstChord(bar: Bar): Chord | null {
  return bar.slots.find((s) => s.chord)?.chord ?? null
}

export function buildStyleBarContext(chart: Chart, barIndex: number): StyleBarContext | null {
  const bars = expandChartBars(chart)
  const bar = bars[barIndex]
  if (!bar) return null
  const bpb = beatsPerBar(bar.timeSignature ?? chart.timeSignature)
  const beatChords: Array<Chord | null> = []
  for (let b = 0; b < bpb; b++) {
    beatChords.push(chordAtBeat(bar, b))
  }
  const next = bars[(barIndex + 1) % bars.length] ?? null
  return {
    chart,
    barIndex,
    bar,
    beatChords,
    nextBarChord: next ? firstChord(next) : null,
    beatsPerBar: bpb,
  }
}
