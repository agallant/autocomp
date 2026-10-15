import { normalizePc } from '../../music'
import { chordBassPc, pcToMidiNear } from '../midi'
import { shellVoicing } from '../swing/pianoComp'
import type { StyleBarContext, StyleEngine, StyleNote } from '../types'

const BASS_CENTER = 41

/**
 * Simplified salsa-lite: tumbao-ish bass (anticipated on the "&" of 2 and 4),
 * montuno-ish piano shells, kick/hat clave skeleton.
 */
function realizeLatinBass(ctx: StyleBarContext): StyleNote[] {
  const notes: StyleNote[] = []
  for (let beat = 0; beat < ctx.beatsPerBar; beat++) {
    const chord = ctx.beatChords[beat]
    if (!chord) continue
    const root = pcToMidiNear(chordBassPc(chord), BASS_CENTER)
    const fifth = pcToMidiNear(normalizePc(chordBassPc(chord) + 7), BASS_CENTER)

    if (beat === 0 || beat === 2) {
      notes.push({
        voice: 'bass',
        midi: root,
        startBeat: beat,
        durationBeats: 0.55,
        velocity: 0.7,
      })
    }
    if (ctx.beatsPerBar >= 4 && (beat === 1 || beat === 3)) {
      notes.push({
        voice: 'bass',
        midi: fifth,
        startBeat: beat + 0.5,
        durationBeats: 0.4,
        velocity: 0.58,
      })
    }
  }
  return notes
}

function realizeLatinPiano(ctx: StyleBarContext): StyleNote[] {
  const notes: StyleNote[] = []
  // Offbeat shells every beat for a light montuno feel.
  for (let beat = 0; beat < ctx.beatsPerBar; beat++) {
    const chord = ctx.beatChords[beat]
    if (!chord) continue
    for (const midi of shellVoicing(chord)) {
      notes.push({
        voice: 'piano',
        midi,
        startBeat: beat + 0.5,
        durationBeats: 0.45,
        velocity: 0.4,
      })
    }
  }
  return notes
}

function realizeLatinDrums(ctx: StyleBarContext): StyleNote[] {
  const notes: StyleNote[] = []
  for (let beat = 0; beat < ctx.beatsPerBar; beat++) {
    notes.push({
      voice: 'drums',
      midi: 51,
      drum: 'ride',
      startBeat: beat,
      durationBeats: 0.12,
      velocity: 0.35,
    })
    // 2-3 clave-ish accents in 4/4: hits on 1, 1.5, 2.5 / 3.5, 4
    if (ctx.beatsPerBar >= 4) {
      const clave = [0, 0.5, 1.5, 3.5]
      for (const t of clave) {
        if (Math.floor(t) === beat) {
          notes.push({
            voice: 'drums',
            midi: 42,
            drum: 'hat',
            startBeat: t,
            durationBeats: 0.08,
            velocity: 0.45,
          })
        }
      }
    }
    if (beat === 0 || beat === 3) {
      notes.push({
        voice: 'drums',
        midi: 36,
        drum: 'kick',
        startBeat: beat,
        durationBeats: 0.12,
        velocity: 0.5,
      })
    }
  }
  return notes
}

export function createLatinStyle(): StyleEngine {
  return {
    id: 'latin',
    label: 'Latin',
    realizeBar(ctx: StyleBarContext): StyleNote[] {
      return [...realizeLatinBass(ctx), ...realizeLatinPiano(ctx), ...realizeLatinDrums(ctx)]
    },
  }
}
