import { normalizePc } from '../../music'
import { chordBassPc, pcToMidiNear } from '../midi'
import { shellVoicing } from '../swing/pianoComp'
import type { StyleBarContext, StyleEngine, StyleNote } from '../types'

const BASS_CENTER = 40

/** Soft root–fifth bossa bass with syncopated anticipations. */
function realizeBossaBass(ctx: StyleBarContext): StyleNote[] {
  const notes: StyleNote[] = []
  for (let beat = 0; beat < ctx.beatsPerBar; beat++) {
    const chord = ctx.beatChords[beat]
    if (!chord) continue
    const rootMidi = pcToMidiNear(chordBassPc(chord), BASS_CENTER)
    const fifthMidi = pcToMidiNear(normalizePc(chordBassPc(chord) + 7), BASS_CENTER)

    if (beat % 2 === 0) {
      notes.push({
        voice: 'bass',
        midi: rootMidi,
        startBeat: beat,
        durationBeats: 0.7,
        velocity: 0.55,
      })
    } else {
      notes.push({
        voice: 'bass',
        midi: fifthMidi,
        startBeat: beat + 0.5,
        durationBeats: 0.45,
        velocity: 0.48,
      })
    }
  }
  return notes
}

function realizeBossaPiano(ctx: StyleBarContext): StyleNote[] {
  const notes: StyleNote[] = []
  for (let beat = 0; beat < ctx.beatsPerBar; beat++) {
    // Soft comps on the "&" of 1 and 3 in 4/4.
    if (ctx.beatsPerBar >= 4 && beat !== 0 && beat !== 2) continue
    const chord = ctx.beatChords[beat]
    if (!chord) continue
    for (const midi of shellVoicing(chord)) {
      notes.push({
        voice: 'piano',
        midi,
        startBeat: beat + 0.5,
        durationBeats: 1.2,
        velocity: 0.32,
      })
    }
  }
  return notes
}

function realizeBossaDrums(ctx: StyleBarContext): StyleNote[] {
  const notes: StyleNote[] = []
  for (let beat = 0; beat < ctx.beatsPerBar; beat++) {
    notes.push({
      voice: 'drums',
      midi: 42,
      drum: 'hat',
      startBeat: beat,
      durationBeats: 0.12,
      velocity: 0.28,
    })
    notes.push({
      voice: 'drums',
      midi: 42,
      drum: 'hat',
      startBeat: beat + 0.5,
      durationBeats: 0.1,
      velocity: 0.22,
    })
    if (beat === 0 || beat === 2) {
      notes.push({
        voice: 'drums',
        midi: 36,
        drum: 'kick',
        startBeat: beat + (beat === 2 ? 0.5 : 0),
        durationBeats: 0.12,
        velocity: 0.35,
      })
    }
  }
  return notes
}

export function createBossaStyle(): StyleEngine {
  return {
    id: 'bossa',
    label: 'Bossa Nova',
    realizeBar(ctx: StyleBarContext): StyleNote[] {
      return [...realizeBossaBass(ctx), ...realizeBossaPiano(ctx), ...realizeBossaDrums(ctx)]
    },
  }
}
