import { GUIDE_MELODY_CENTER, realizeGuideMelody } from '../generate/melody'
import type { StyleEngine, StyleNote } from './types'

/**
 * Wrap a style so each bar also realizes a guide-tone melody line.
 * Mute / levels still decide whether it is heard (default: muted off).
 *
 * Live transport calls `realizeBar` once per beat and keeps only that beat's
 * notes, so we cache one realization per `barIndex` and advance voice-leading
 * from the previous bar's last pitch (not on every beat callback).
 */
export function createGuideMelodyStyle(base: StyleEngine): StyleEngine {
  /** Last melody MIDI written for each expanded bar index. */
  const lastMidiByBar = new Map<number, number>()
  let cached: { barIndex: number; notes: StyleNote[] } | null = null

  return {
    id: base.id,
    label: base.label,
    realizeBar(ctx) {
      const accompaniment = base.realizeBar(ctx)
      if (!cached || cached.barIndex !== ctx.barIndex) {
        const prev =
          ctx.barIndex > 0
            ? (lastMidiByBar.get(ctx.barIndex - 1) ?? GUIDE_MELODY_CENTER)
            : GUIDE_MELODY_CENTER
        const melody = realizeGuideMelody(ctx, { prevMidi: prev })
        if (melody.length > 0) {
          lastMidiByBar.set(ctx.barIndex, melody[melody.length - 1]!.midi)
        }
        cached = { barIndex: ctx.barIndex, notes: melody }
      }
      return [...accompaniment, ...cached.notes]
    },
  }
}
