import {
  chordTonePcs,
  normalizePc,
  rootToPc,
  type Chord,
  type PitchClass,
} from '../music'
import { pcToMidiNear } from '../style/midi'
import type { StyleBarContext, StyleNote } from '../style'

/** Comfortable guide-line register (around C5). */
export const GUIDE_MELODY_CENTER = 72

/**
 * Prefer guide tones (3rd / 7th) then other chord tones for a practice line.
 * Returns absolute pitch classes (not interval-from-root).
 */
export function guideTonePcs(chord: Chord): PitchClass[] {
  const root = rootToPc(chord.root)
  const tones = chordTonePcs(chord).map((pc) => normalizePc(pc))
  const intervals = new Set(tones.map((pc) => normalizePc(pc - root)))
  const preferred: PitchClass[] = []
  for (const iv of [4, 3, 11, 10]) {
    if (intervals.has(normalizePc(iv))) preferred.push(normalizePc(root + iv))
  }
  for (const pc of tones) {
    if (!preferred.includes(pc)) preferred.push(pc)
  }
  return preferred.length > 0 ? preferred : [root]
}

/** Pick the MIDI nearest `prefer` among the given pitch classes. */
export function nearestGuideMidi(pcs: readonly PitchClass[], prefer: number): number {
  let best = pcToMidiNear(pcs[0]!, prefer)
  let bestDist = Math.abs(best - prefer)
  for (let i = 1; i < pcs.length; i++) {
    const midi = pcToMidiNear(pcs[i]!, prefer)
    const dist = Math.abs(midi - prefer)
    if (dist < bestDist) {
      best = midi
      bestDist = dist
    }
  }
  return best
}

export type RealizeGuideMelodyOptions = {
  /** Previous bar's last melody MIDI for voice leading. */
  prevMidi?: number | null
}

/**
 * Quarter-note guide-tone melody for one bar (practice / solo outline).
 * Returns notes tagged `voice: 'melody'`.
 */
export function realizeGuideMelody(
  ctx: StyleBarContext,
  options: RealizeGuideMelodyOptions = {},
): StyleNote[] {
  const notes: StyleNote[] = []
  let prev = options.prevMidi ?? GUIDE_MELODY_CENTER

  for (let beat = 0; beat < ctx.beatsPerBar; beat++) {
    const chord = ctx.beatChords[beat]
    if (!chord) continue
    const midi = nearestGuideMidi(guideTonePcs(chord), prev)
    notes.push({
      voice: 'melody',
      midi,
      startBeat: beat,
      durationBeats: 0.85,
      velocity: beat === 0 ? 0.48 : 0.4,
    })
    prev = midi
  }
  return notes
}
