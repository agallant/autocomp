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

/** Chart beats that make one quarter note for the given denominator (4 → 1, 8 → 2). */
export function chartBeatsPerQuarter(denominator: number): number {
  if (!Number.isFinite(denominator) || denominator <= 0) return 1
  return Math.max(1, denominator / 4)
}

/**
 * Prefer guide tones (3rd / 7th) only. Empty when the chord has neither
 * (caller falls back to all chord tones).
 */
export function preferredGuidePcs(chord: Chord): PitchClass[] {
  const root = rootToPc(chord.root)
  const tones = chordTonePcs(chord).map((pc) => normalizePc(pc))
  const intervals = new Set(tones.map((pc) => normalizePc(pc - root)))
  const preferred: PitchClass[] = []
  for (const iv of [4, 3, 11, 10]) {
    if (intervals.has(normalizePc(iv))) preferred.push(normalizePc(root + iv))
  }
  return preferred
}

/**
 * Guide tones first (3rd / 7th), then remaining chord tones.
 * Prefer {@link preferredGuidePcs} + {@link nearestGuideMidi} for selection.
 */
export function guideTonePcs(chord: Chord): PitchClass[] {
  const root = rootToPc(chord.root)
  const preferred = preferredGuidePcs(chord)
  const rest = chordTonePcs(chord)
    .map((pc) => normalizePc(pc))
    .filter((pc) => !preferred.includes(pc))
  const out = [...preferred, ...rest]
  return out.length > 0 ? out : [root]
}

/** Pick the MIDI nearest `prefer` among the given pitch classes. */
export function nearestGuideMidi(pcs: readonly PitchClass[], prefer: number): number {
  if (pcs.length === 0) return Math.round(prefer)
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

/** Nearest among preferred guide tones; falls back to any chord tone. */
export function pickGuideMidi(chord: Chord, prefer: number): number {
  const guides = preferredGuidePcs(chord)
  const pool = guides.length > 0 ? guides : guideTonePcs(chord)
  return nearestGuideMidi(pool, prefer)
}

export type RealizeGuideMelodyOptions = {
  /** Previous bar's last melody MIDI for voice leading. */
  prevMidi?: number | null
}

/**
 * Quarter-note guide-tone melody for one bar (practice / solo outline).
 * In 6/8 (etc.) steps by chart-beats-per-quarter so the pulse stays crochets.
 * Returns notes tagged `voice: 'melody'`.
 */
export function realizeGuideMelody(
  ctx: StyleBarContext,
  options: RealizeGuideMelodyOptions = {},
): StyleNote[] {
  const notes: StyleNote[] = []
  let prev = options.prevMidi ?? GUIDE_MELODY_CENTER
  const ts = ctx.bar.timeSignature ?? ctx.chart.timeSignature
  const step = chartBeatsPerQuarter(ts.denominator)
  const duration = step * 0.85

  for (let beat = 0; beat < ctx.beatsPerBar; beat += step) {
    const chordIndex = Math.min(ctx.beatsPerBar - 1, Math.floor(beat))
    const chord = ctx.beatChords[chordIndex]
    if (!chord) continue
    const midi = pickGuideMidi(chord, prev)
    notes.push({
      voice: 'melody',
      midi,
      startBeat: beat,
      durationBeats: duration,
      velocity: beat === 0 ? 0.48 : 0.4,
    })
    prev = midi
  }
  return notes
}
