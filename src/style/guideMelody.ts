import { formatChordCanonical } from '../music'
import { GUIDE_MELODY_CENTER, realizeGuideMelody } from '../generate/melody'
import type { StyleBarContext, StyleEngine, StyleNote } from './types'

/** Fingerprint of the harmony that feeds the guide line for this bar. */
function melodyContextKey(ctx: StyleBarContext): string {
  return JSON.stringify({
    bar: ctx.barIndex,
    beats: ctx.beatsPerBar,
    chords: ctx.beatChords.map((c) => (c ? formatChordCanonical(c) : null)),
    next: ctx.nextBarChord ? formatChordCanonical(ctx.nextBarChord) : null,
    denom: (ctx.bar.timeSignature ?? ctx.chart.timeSignature).denominator,
  })
}

/**
 * Wrap a style so each bar also realizes a guide-tone melody line.
 * Mute / levels still decide whether it is heard (default: muted off).
 *
 * Live transport calls `realizeBar` once per beat and keeps only that beat's
 * notes, so we cache one realization per harmony fingerprint and advance
 * voice-leading from the previous bar's last pitch (not on every beat callback).
 */
export function createGuideMelodyStyle(base: StyleEngine): StyleEngine {
  /** Last melody MIDI written for each expanded bar index. */
  const lastMidiByBar = new Map<number, number>()
  let cached: { key: string; barIndex: number; notes: StyleNote[] } | null = null

  const dropFrom = (barIndex: number): void => {
    for (const b of [...lastMidiByBar.keys()]) {
      if (b >= barIndex) lastMidiByBar.delete(b)
    }
    if (cached && cached.barIndex >= barIndex) cached = null
  }

  return {
    id: base.id,
    label: base.label,
    realizeBar(ctx) {
      const accompaniment = base.realizeBar(ctx)
      const key = melodyContextKey(ctx)
      if (!cached || cached.key !== key) {
        // Chord edits at this bar invalidate this and later voice-leading.
        if (cached && cached.barIndex === ctx.barIndex && cached.key !== key) {
          dropFrom(ctx.barIndex)
        }
        const prev =
          ctx.barIndex > 0
            ? (lastMidiByBar.get(ctx.barIndex - 1) ?? GUIDE_MELODY_CENTER)
            : GUIDE_MELODY_CENTER
        const melody = realizeGuideMelody(ctx, { prevMidi: prev })
        if (melody.length > 0) {
          lastMidiByBar.set(ctx.barIndex, melody[melody.length - 1]!.midi)
        } else {
          lastMidiByBar.delete(ctx.barIndex)
        }
        cached = { key, barIndex: ctx.barIndex, notes: melody }
      }
      return [...accompaniment, ...cached.notes]
    },
  }
}
