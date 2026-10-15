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
        durationBeats: Math.min(0.7, ctx.beatsPerBar - beat),
        velocity: 0.55,
      })
    } else {
      const start = beat + 0.5
      if (start >= ctx.beatsPerBar) continue
      notes.push({
        voice: 'bass',
        midi: fifthMidi,
        startBeat: start,
        durationBeats: Math.min(0.45, ctx.beatsPerBar - start),
        velocity: 0.48,
      })
    }
  }
  return notes
}

/** End of the chord slot that contains `startBeat` (bar end if none). */
function chordSlotEnd(ctx: StyleBarContext, startBeat: number): number {
  let cursor = 0
  for (const slot of ctx.bar.slots) {
    const end = cursor + slot.durationBeats
    if (startBeat >= cursor && startBeat < end) return end
    cursor = end
  }
  return ctx.beatsPerBar
}

function realizeBossaPiano(ctx: StyleBarContext): StyleNote[] {
  const notes: StyleNote[] = []
  // Soft comps on the "&" of selected beats — sparse in short meters.
  const compBeats =
    ctx.beatsPerBar >= 4 ? [0, 2] : ctx.beatsPerBar === 3 ? [0] : [0]

  for (const beat of compBeats) {
    if (beat >= ctx.beatsPerBar) continue
    const chord = ctx.beatChords[beat]
    if (!chord) continue
    const start = beat + 0.5
    if (start >= ctx.beatsPerBar) continue
    const durationBeats = Math.min(1.2, chordSlotEnd(ctx, start) - start)
    for (const midi of shellVoicing(chord)) {
      notes.push({
        voice: 'piano',
        midi,
        startBeat: start,
        durationBeats,
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
    if (beat + 0.5 < ctx.beatsPerBar) {
      notes.push({
        voice: 'drums',
        midi: 42,
        drum: 'hat',
        startBeat: beat + 0.5,
        durationBeats: 0.1,
        velocity: 0.22,
      })
    }
    if (beat === 0 || beat === 2) {
      const start = beat + (beat === 2 ? 0.5 : 0)
      if (start < ctx.beatsPerBar) {
        notes.push({
          voice: 'drums',
          midi: 36,
          drum: 'kick',
          startBeat: start,
          durationBeats: 0.12,
          velocity: 0.35,
        })
      }
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
