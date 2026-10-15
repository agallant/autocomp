import { chordTonePcs, normalizePc, type Chord } from '../../music'
import { chordBassPc, pcToMidiNear } from '../midi'
import type { StyleBarContext, StyleNote } from '../types'

const BASS_CENTER = 38 // around low D

/**
 * Quarter-note walking bass: root on beat 1, chord tones mid-bar,
 * chromatic approach into the next bar on the last beat.
 */
export function realizeWalkingBass(ctx: StyleBarContext): StyleNote[] {
  const notes: StyleNote[] = []
  let prevMidi: number | null = null

  for (let beat = 0; beat < ctx.beatsPerBar; beat++) {
    const chord = ctx.beatChords[beat]
    if (!chord) continue

    let midi: number
    const isLast = beat === ctx.beatsPerBar - 1
    if (beat === 0) {
      midi = pcToMidiNear(chordBassPc(chord), BASS_CENTER)
    } else if (isLast && ctx.nextBarChord) {
      const target = pcToMidiNear(chordBassPc(ctx.nextBarChord), prevMidi ?? BASS_CENTER)
      midi = approachMidi(prevMidi ?? pcToMidiNear(chordBassPc(chord), BASS_CENTER), target, chord)
    } else {
      const tones = chordTonePcs(chord)
      midi =
        prevMidi !== null
          ? nearestChordToneMidi(tones, prevMidi)
          : pcToMidiNear(tones[beat % tones.length]!, BASS_CENTER)
    }

    notes.push({
      voice: 'bass',
      midi,
      startBeat: beat,
      durationBeats: 0.95,
      velocity: beat === 0 ? 0.75 : 0.62,
    })
    prevMidi = midi
  }
  return notes
}

function approachMidi(from: number, target: number, chord: Chord): number {
  const delta = target - from
  if (delta === 0) return target - 1
  const step = delta > 0 ? 1 : -1
  const approach = target - step
  if (Math.abs(approach - from) <= 7) return approach
  return nearestChordToneMidi(chordTonePcs(chord), target - step)
}

function nearestChordToneMidi(tones: number[], fromMidi: number): number {
  let best = pcToMidiNear(normalizePc(tones[0]!), fromMidi)
  let bestDist = Math.abs(best - fromMidi)
  for (const pc of tones) {
    const midi = pcToMidiNear(normalizePc(pc), fromMidi)
    const dist = Math.abs(midi - fromMidi)
    if (dist < bestDist) {
      best = midi
      bestDist = dist
    }
  }
  return best
}
