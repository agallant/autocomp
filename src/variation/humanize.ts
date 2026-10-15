import type { StyleNote } from '../style'
import { hashSeed, mulberry32 } from './rng'

const VELOCITY_SPREAD = 0.12
/** Peak-to-peak timing jitter in milliseconds. */
const TIMING_MS = 24

/**
 * Light velocity / onset humanization. Deterministic for (seed, barIndex, noteIndex).
 * Timing jitter is capped so notes stay inside the bar.
 */
export function humanizeNotes(
  notes: StyleNote[],
  seed: number,
  barIndex: number,
  tempoBpm: number,
  beatsPerBar: number,
): StyleNote[] {
  const bpm = Math.max(1, tempoBpm)
  const secondsPerBeat = 60 / bpm
  const maxJitterBeats = TIMING_MS / 1000 / 2 / secondsPerBeat

  return notes.map((note, index) => {
    const rng = mulberry32(hashSeed(seed, barIndex, index, note.midi))
    const velScale = 1 + (rng() - 0.5) * VELOCITY_SPREAD
    const timeBeats = (rng() - 0.5) * 2 * maxJitterBeats
    const startBeat = Math.min(
      Math.max(0, note.startBeat + timeBeats),
      Math.max(0, beatsPerBar - 0.01),
    )
    return {
      ...note,
      startBeat,
      velocity: Math.min(1, Math.max(0.05, note.velocity * velScale)),
    }
  })
}
