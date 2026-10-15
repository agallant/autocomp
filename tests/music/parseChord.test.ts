import { describe, expect, it } from 'vitest'
import { chordTonePcs } from '../../src/music/chordTones'
import { formatChordCanonical } from '../../src/music/formatChord'
import { parseChordSymbol } from '../../src/music/parseChord'
import { rootToPc } from '../../src/music/pitch'

describe('parseChordSymbol', () => {
  it('parses major triads and sevenths', () => {
    expect(parseChordSymbol('C').quality).toBe('maj')
    expect(parseChordSymbol('Cmaj7').quality).toBe('maj7')
    expect(parseChordSymbol('G7').quality).toBe('dom7')
    expect(parseChordSymbol('Dm7').quality).toBe('min7')
  })

  it('parses accidentals and slash bass', () => {
    const fsharp = parseChordSymbol('F#m7b5')
    expect(fsharp.root).toEqual({ letter: 'F', accidental: 1 })
    expect(fsharp.quality).toBe('halfDim7')

    const slash = parseChordSymbol('C/E')
    expect(slash.bass).toEqual({ letter: 'E', accidental: 0 })
  })

  it('parses alterations and extensions', () => {
    const alt = parseChordSymbol('Bb7alt')
    expect(alt.root).toEqual({ letter: 'B', accidental: -1 })
    expect(alt.quality).toBe('dom7')
    expect(alt.alterations).toContain('alt')

    const nine = parseChordSymbol('D9')
    expect(nine.quality).toBe('dom7')
    expect(nine.extensions).toContain(9)
  })

  it('builds expected chord tones for Dm7', () => {
    const dm7 = parseChordSymbol('Dm7')
    const tones = chordTonePcs(dm7)
    expect(tones).toEqual([
      rootToPc({ letter: 'D', accidental: 0 }),
      rootToPc({ letter: 'F', accidental: 0 }),
      rootToPc({ letter: 'A', accidental: 0 }),
      rootToPc({ letter: 'C', accidental: 0 }),
    ])
  })

  it('round-trips common symbols through canonical format', () => {
    for (const symbol of ['Dm7', 'G7', 'Cmaj7', 'F#m7b5', 'A7sus4']) {
      const parsed = parseChordSymbol(symbol)
      const { symbol: _s, ...structured } = parsed
      expect(formatChordCanonical(structured)).toBe(symbol)
    }
  })
})
