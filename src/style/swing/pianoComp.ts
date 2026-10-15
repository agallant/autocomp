import { chordTonePcs, normalizePc, rootToPc, type Chord } from '../../music'
import { pcToMidiNear } from '../midi'
import type { StyleBarContext, StyleNote } from '../types'

const PIANO_CENTER = 60

/**
 * Guide-tone shell voicings (3rd + 7th when available) on beats 2 and 4.
 */
export function realizePianoComp(ctx: StyleBarContext): StyleNote[] {
  const notes: StyleNote[] = []
  for (let beat = 0; beat < ctx.beatsPerBar; beat++) {
    // Classic jazz piano comps on 2 & 4 in 4/4; on beat 2 only in triple meters.
    const isCompBeat =
      ctx.beatsPerBar >= 4 ? beat === 1 || beat === 3 : beat === Math.min(1, ctx.beatsPerBar - 1)
    if (!isCompBeat) continue
    const chord = ctx.beatChords[beat]
    if (!chord) continue
    for (const midi of shellVoicing(chord)) {
      notes.push({
        voice: 'piano',
        midi,
        startBeat: beat,
        durationBeats: 1.1,
        velocity: 0.45,
      })
    }
  }
  return notes
}

export function shellVoicing(chord: Chord): number[] {
  const root = rootToPc(chord.root)
  const tones = new Set(chordTonePcs(chord).map((pc) => normalizePc(pc - root)))
  const third = tones.has(4) ? 4 : tones.has(3) ? 3 : tones.has(5) ? 5 : null
  const seventh = tones.has(11) ? 11 : tones.has(10) ? 10 : tones.has(9) ? 9 : null

  const intervals: number[] = []
  if (third !== null) intervals.push(third)
  if (seventh !== null) intervals.push(seventh)
  if (intervals.length === 0) {
    intervals.push(0, 7)
  }

  return intervals.map((iv) => pcToMidiNear(normalizePc(root + iv), PIANO_CENTER))
}
