import { describe, expect, it } from 'vitest'
import type { StyleNote } from '../../src/style'
import { humanizeNotes } from '../../src/variation'

const base: StyleNote[] = [
  {
    voice: 'bass',
    midi: 48,
    startBeat: 0,
    durationBeats: 1,
    velocity: 0.6,
  },
  {
    voice: 'drums',
    midi: 51,
    drum: 'ride',
    startBeat: 1,
    durationBeats: 0.2,
    velocity: 0.4,
  },
]

describe('humanizeNotes', () => {
  it('is deterministic for the same seed', () => {
    const a = humanizeNotes(base, 99, 3, 120, 4)
    const b = humanizeNotes(base, 99, 3, 120, 4)
    expect(a).toEqual(b)
  })

  it('changes velocity and/or timing vs the original', () => {
    const out = humanizeNotes(base, 7, 0, 120, 4)
    const changed = out.some(
      (note, i) =>
        note.velocity !== base[i]!.velocity || note.startBeat !== base[i]!.startBeat,
    )
    expect(changed).toBe(true)
  })

  it('keeps notes inside the bar', () => {
    const out = humanizeNotes(base, 12345, 2, 40, 4)
    for (const note of out) {
      expect(note.startBeat).toBeGreaterThanOrEqual(0)
      expect(note.startBeat).toBeLessThan(4)
      expect(note.velocity).toBeGreaterThanOrEqual(0.05)
      expect(note.velocity).toBeLessThanOrEqual(1)
    }
  })
})
