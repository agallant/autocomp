import { describe, expect, it } from 'vitest'
import {
  INSTRUMENTS,
  instrumentSemitones,
  isInstrumentId,
  writtenRoot,
} from '../../src/music'

describe('transposing instruments', () => {
  it('maps concert C to written D for B♭ horns', () => {
    expect(instrumentSemitones('bb')).toBe(2)
    expect(writtenRoot({ letter: 'C', accidental: 0 }, 2, false)).toEqual({
      letter: 'D',
      accidental: 0,
    })
  })

  it('maps concert C to written A for E♭ horns', () => {
    expect(instrumentSemitones('eb')).toBe(9)
    expect(writtenRoot({ letter: 'C', accidental: 0 }, 9, false)).toEqual({
      letter: 'A',
      accidental: 0,
    })
  })

  it('keeps concert pitch at zero offset', () => {
    const c = { letter: 'C' as const, accidental: 0 as const }
    expect(writtenRoot(c, 0, false)).toEqual(c)
    expect(isInstrumentId('concert')).toBe(true)
    expect(isInstrumentId('clarinet')).toBe(false)
    expect(INSTRUMENTS.map((item) => item.id)).toContain('f')
  })
})
