import type { StyleBarContext, StyleNote } from '../style'
import { applySectionFill } from './fills'

/**
 * Form-end flags aligned with `expandChartBars`.
 * Penultimate bar gets a setup fill; final bar gets a held cadence.
 */
export function formEndingFlags(barCount: number): {
  penultimate: boolean[]
  final: boolean[]
} {
  const penultimate = Array.from({ length: barCount }, () => false)
  const final = Array.from({ length: barCount }, () => false)
  if (barCount <= 0) return { penultimate, final }
  final[barCount - 1] = true
  if (barCount >= 2) penultimate[barCount - 2] = true
  return { penultimate, final }
}

/** Held last bar: thin texture, downbeat kick+ride, stretched piano. */
export function applyFinalBarEnding(ctx: StyleBarContext, notes: StyleNote[]): StyleNote[] {
  const out: StyleNote[] = []
  for (const note of notes) {
    if (note.voice === 'drums') continue
    if (note.voice === 'bass' && note.startBeat >= 1 - 1e-9) continue
    if (note.voice === 'piano') {
      out.push({
        ...note,
        durationBeats: Math.max(note.durationBeats, ctx.beatsPerBar - note.startBeat),
        velocity: Math.min(0.62, note.velocity + 0.08),
      })
      continue
    }
    out.push(note)
  }
  out.push({
    voice: 'drums',
    midi: 51,
    drum: 'ride',
    startBeat: 0,
    durationBeats: 0.5,
    velocity: 0.68,
  })
  out.push({
    voice: 'drums',
    midi: 36,
    drum: 'kick',
    startBeat: 0,
    durationBeats: 0.2,
    velocity: 0.72,
  })
  return out
}

/**
 * Apply ending treatment for the form's last two bars.
 * Penultimate → section-style fill; final → held cadence.
 */
export function applyFormEnding(
  ctx: StyleBarContext,
  notes: StyleNote[],
  flags: { penultimate: boolean; final: boolean },
): StyleNote[] {
  if (flags.final) return applyFinalBarEnding(ctx, notes)
  if (flags.penultimate) return applySectionFill(ctx, notes)
  return notes
}
