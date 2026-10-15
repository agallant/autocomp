import type { StyleNote } from '../style'

/** Straight eighths (1:1). */
export const SWING_RATIO_STRAIGHT = 0.5
/** Classic triplet swing (2:1). */
export const SWING_RATIO_TRIPLET = 2 / 3
/** Hard shuffle ceiling (3:1). */
export const SWING_RATIO_HARD = 0.75

/**
 * Default feel (0–100) matching triplet swing.
 * Maps through {@link swingFeelToRatio} → {@link SWING_RATIO_TRIPLET}.
 */
export const DEFAULT_SWING_FEEL = 67

/** Even-eighth upbeat written by style engines before swing is applied. */
const EIGHTH_UPBEAT = 0.5
/** Only warp notes authored as even eighth upbeats (leave syncopation alone). */
const UPBEAT_WINDOW = 0.02

/** Clamp UI feel 0–100 → first partial of the beat (0.5…0.75). */
export function swingFeelToRatio(feel: number): number {
  const clamped = Math.min(100, Math.max(0, Math.round(feel)))
  return SWING_RATIO_STRAIGHT + (clamped / 100) * (SWING_RATIO_HARD - SWING_RATIO_STRAIGHT)
}

/** Inverse of {@link swingFeelToRatio} for readouts / tests. */
export function swingRatioToFeel(ratio: number): number {
  const clamped = Math.min(SWING_RATIO_HARD, Math.max(SWING_RATIO_STRAIGHT, ratio))
  return Math.round(
    ((clamped - SWING_RATIO_STRAIGHT) / (SWING_RATIO_HARD - SWING_RATIO_STRAIGHT)) * 100,
  )
}

/**
 * Delay even-eighth upbeats according to swing feel.
 * On-beat and non-eighth syncopation are left unchanged.
 */
export function applySwingFeel(notes: StyleNote[], swingFeel: number): StyleNote[] {
  const ratio = swingFeelToRatio(swingFeel)
  if (Math.abs(ratio - SWING_RATIO_STRAIGHT) < 1e-12) return notes

  return notes.map((note) => {
    const beat = Math.floor(note.startBeat + 1e-12)
    const frac = note.startBeat - beat
    if (Math.abs(frac - EIGHTH_UPBEAT) > UPBEAT_WINDOW) return note
    return { ...note, startBeat: beat + ratio }
  })
}
