import { shellVoicing } from '../style'
import type { StyleBarContext, StyleNote } from '../style'
import type { CompDensity } from './types'

/** Extra integer-beat comps used for dense density. */
function denseExtraBeats(beatsPerBar: number): number[] {
  if (beatsPerBar >= 4) return [0, 2]
  return beatsPerBar > 1 ? [0] : []
}

/** Ensure solo always has a light kick + ride pulse (styles like ballad may have none). */
function ensureSoloKit(ctx: StyleBarContext, notes: StyleNote[]): StyleNote[] {
  const out = [...notes]
  const hasKick = out.some((n) => n.voice === 'drums' && n.drum === 'kick')
  const hasRide = out.some((n) => n.voice === 'drums' && n.drum === 'ride')
  if (!hasKick) {
    out.push({
      voice: 'drums',
      midi: 36,
      drum: 'kick',
      startBeat: 0,
      durationBeats: 0.2,
      velocity: 0.55,
    })
  }
  if (!hasRide) {
    for (let beat = 0; beat < ctx.beatsPerBar; beat += 2) {
      out.push({
        voice: 'drums',
        midi: 51,
        drum: 'ride',
        startBeat: beat,
        durationBeats: 0.4,
        velocity: 0.42,
      })
    }
  }
  return out
}

/**
 * Thin or thicken accompaniment without rewriting style engines.
 * - solo: no piano, half-time bass, kick+ride only (room to practice)
 * - sparse/dense: piano/drum texture; bass preserved
 */
export function applyCompDensity(
  ctx: StyleBarContext,
  notes: StyleNote[],
  density: CompDensity,
): StyleNote[] {
  if (density === 'normal') return notes

  if (density === 'solo') {
    const thinned = notes
      .filter((n) => {
        if (n.voice === 'piano') return false
        if (n.voice === 'melody') return true // keep optional guide line
        if (n.voice === 'bass') {
          // Keep integer even beats (0, 2, …) for a lighter walk.
          const beat = Math.round(n.startBeat)
          return Math.abs(n.startBeat - beat) <= 1e-9 && beat % 2 === 0
        }
        if (n.voice === 'drums') {
          return n.drum === 'kick' || n.drum === 'ride'
        }
        return true
      })
      .map((n) =>
        n.voice === 'bass' ? { ...n, velocity: Math.min(n.velocity, 0.52) } : n,
      )
    return ensureSoloKit(ctx, thinned)
  }

  if (density === 'sparse') {
    const pianoStarts = notes.filter((n) => n.voice === 'piano').map((n) => n.startBeat)
    const keepStart = pianoStarts.length > 0 ? Math.min(...pianoStarts) : null
    return notes.filter((n) => {
      if (n.voice === 'bass' || n.voice === 'melody') return true
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
