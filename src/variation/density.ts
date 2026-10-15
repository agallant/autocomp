import { shellVoicing } from '../style'
import type { StyleBarContext, StyleNote } from '../style'
import type { CompDensity } from './types'

/** Extra integer-beat comps used for dense density. */
function denseExtraBeats(beatsPerBar: number): number[] {
  if (beatsPerBar >= 4) return [0, 2]
  return beatsPerBar > 1 ? [0] : []
}

/**
 * Thin or thicken piano/drum texture without rewriting style engines.
 * Bass lines are always preserved.
 */
export function applyCompDensity(
  ctx: StyleBarContext,
  notes: StyleNote[],
  density: CompDensity,
): StyleNote[] {
  if (density === 'normal') return notes

  if (density === 'sparse') {
    const pianoStarts = notes.filter((n) => n.voice === 'piano').map((n) => n.startBeat)
    const keepStart = pianoStarts.length > 0 ? Math.min(...pianoStarts) : null
    return notes.filter((n) => {
      if (n.voice === 'bass') return true
      if (n.voice === 'piano') return keepStart !== null && n.startBeat === keepStart
      if (n.voice === 'drums') {
        // Keep pulse + clave; drop busy hats/snares.
        return n.drum === 'kick' || n.drum === 'ride' || n.drum === 'clave'
      }
      return true
    })
  }

  // dense: add shell comps on integer beats the base style left bare (exact start).
  const occupied = new Set(
    notes.filter((n) => n.voice === 'piano').map((n) => n.startBeat),
  )
  const extras: StyleNote[] = []
  for (const beat of denseExtraBeats(ctx.beatsPerBar)) {
    if (occupied.has(beat)) continue
    const chord = ctx.beatChords[beat]
    if (!chord) continue
    for (const midi of shellVoicing(chord)) {
      extras.push({
        voice: 'piano',
        midi,
        startBeat: beat,
        durationBeats: 0.9,
        velocity: 0.38,
      })
    }
  }
  return extras.length === 0 ? notes : [...notes, ...extras]
}
