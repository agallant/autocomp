import { realizeGuideMelody } from '../generate/melody'
import type { StyleEngine, StyleNote } from './types'

/**
 * Wrap a style so each bar also realizes a guide-tone melody line.
 * Mute / levels still decide whether it is heard (default: muted off).
 */
export function createGuideMelodyStyle(base: StyleEngine): StyleEngine {
  let prevMidi: number | null = null
  return {
    id: base.id,
    label: base.label,
    realizeBar(ctx) {
      const accompaniment = base.realizeBar(ctx)
      const melody = realizeGuideMelody(ctx, { prevMidi })
      if (melody.length > 0) {
        prevMidi = melody[melody.length - 1]!.midi
      }
      return [...accompaniment, ...melody] as StyleNote[]
    },
  }
}
