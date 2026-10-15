import type { StyleBarContext, StyleNote } from '../types'

/** Swing ride: ding on each beat; skipped "and" after beats 2 and 4 (2:1 swing). */
export function realizeSwingDrums(ctx: StyleBarContext): StyleNote[] {
  const notes: StyleNote[] = []
  for (let beat = 0; beat < ctx.beatsPerBar; beat++) {
    notes.push({
      voice: 'drums',
      midi: 51,
      drum: 'ride',
      startBeat: beat,
      durationBeats: 0.2,
      velocity: beat === 0 ? 0.55 : 0.4,
    })

    // Swung skip note (~2/3 into the beat) on 2 & 4 in 4/4.
    if (ctx.beatsPerBar >= 4 && (beat === 1 || beat === 3)) {
      notes.push({
        voice: 'drums',
        midi: 51,
        drum: 'ride',
        startBeat: beat + 2 / 3,
        durationBeats: 0.15,
        velocity: 0.32,
      })
    }

    // Hi-hat foot on 2 & 4
    if (ctx.beatsPerBar >= 4 && (beat === 1 || beat === 3)) {
      notes.push({
        voice: 'drums',
        midi: 42,
        drum: 'hat',
        startBeat: beat,
        durationBeats: 0.1,
        velocity: 0.5,
      })
    }

    // Light kick on 1 and 3
    if (beat === 0 || (ctx.beatsPerBar >= 3 && beat === 2)) {
      notes.push({
        voice: 'drums',
        midi: 36,
        drum: 'kick',
        startBeat: beat,
        durationBeats: 0.15,
        velocity: beat === 0 ? 0.55 : 0.4,
      })
    }
  }
  return notes
}
