import { chordBassPc, pcToMidiNear } from '../midi'
import { shellVoicing } from '../swing/pianoComp'
import type { StyleBarContext, StyleEngine, StyleNote } from '../types'

const BASS_CENTER = 36

/** Sparse half-note bass, sustained shells, soft hat pulse. */
function realizeBalladBass(ctx: StyleBarContext): StyleNote[] {
  const notes: StyleNote[] = []
  for (let beat = 0; beat < ctx.beatsPerBar; beat += 2) {
    const chord = ctx.beatChords[beat]
    if (!chord) continue
    notes.push({
      voice: 'bass',
      midi: pcToMidiNear(chordBassPc(chord), BASS_CENTER),
      startBeat: beat,
      durationBeats: Math.min(1.9, ctx.beatsPerBar - beat),
      velocity: 0.5,
    })
  }
  return notes
}

function realizeBalladPiano(ctx: StyleBarContext): StyleNote[] {
  const notes: StyleNote[] = []
  const hits: number[] = [0]
  if (ctx.beatsPerBar >= 3) hits.push(2)

  for (const start of hits) {
    const chord = ctx.beatChords[start]
    if (!chord) continue
    const nextHit = hits.find((h) => h > start)
    const end = nextHit ?? ctx.beatsPerBar
    const durationBeats = Math.max(0.5, end - start - 0.05)
    for (const midi of shellVoicing(chord)) {
      notes.push({
        voice: 'piano',
        midi,
        startBeat: start,
        durationBeats,
        velocity: start === 0 ? 0.28 : 0.24,
      })
    }
  }
  return notes
}

function realizeBalladDrums(ctx: StyleBarContext): StyleNote[] {
  const notes: StyleNote[] = []
  for (let beat = 0; beat < ctx.beatsPerBar; beat++) {
    notes.push({
      voice: 'drums',
      midi: 42,
      drum: 'hat',
      startBeat: beat,
      durationBeats: 0.15,
      velocity: beat % 2 === 0 ? 0.18 : 0.12,
    })
  }
  return notes
}

export function createBalladStyle(): StyleEngine {
  return {
    id: 'ballad',
    label: 'Ballad',
    realizeBar(ctx: StyleBarContext): StyleNote[] {
      return [...realizeBalladBass(ctx), ...realizeBalladPiano(ctx), ...realizeBalladDrums(ctx)]
    },
  }
}
