import type { StyleBarContext, StyleNote } from '../style'

/** Last two beats (or one in short meters) become a snare/kick fill. */
export function fillStartBeat(beatsPerBar: number): number {
  if (beatsPerBar <= 1) return 0
  if (beatsPerBar === 2) return 1
  return beatsPerBar - 2
}

/** Fixed drum fill for the end of a section (style-agnostic skeleton). */
export function sectionFillNotes(ctx: StyleBarContext): StyleNote[] {
  const start = fillStartBeat(ctx.beatsPerBar)
  const span = Math.max(0.25, ctx.beatsPerBar - start)
  const notes: StyleNote[] = []
  const hits = Math.max(2, Math.round(span * 2))

  for (let i = 0; i < hits; i++) {
    const t = start + (i * span) / hits
    notes.push({
      voice: 'drums',
      midi: 38,
      drum: 'snare',
      startBeat: t,
      durationBeats: 0.12,
      velocity: 0.42 + (i / Math.max(1, hits - 1)) * 0.28,
    })
  }

  // Kick on the last eighth of the bar for a landing.
  notes.push({
    voice: 'drums',
    midi: 36,
    drum: 'kick',
    startBeat: Math.max(start, ctx.beatsPerBar - 0.5),
    durationBeats: 0.15,
    velocity: 0.7,
  })

  return notes
}

/** Keep non-drum + early drum notes; splice in the section fill. */
export function applySectionFill(ctx: StyleBarContext, notes: StyleNote[]): StyleNote[] {
  const start = fillStartBeat(ctx.beatsPerBar)
  const kept = notes.filter((n) => n.voice !== 'drums' || n.startBeat < start - 1e-9)
  return [...kept, ...sectionFillNotes(ctx)]
}
