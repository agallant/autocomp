import { describe, expect, it } from 'vitest'
import { chordTonePcs } from '../../src/music/chordTones'
import { formatChordCanonical } from '../../src/music/formatChord'
import { parseChordSymbol } from '../../src/music/parseChord'

describe('parseChordSymbol', () => {
  it('parses major triads and sevenths', () => {
    expect(parseChordSymbol('C').quality).toBe('maj')
    expect(parseChordSymbol('Cmaj7').quality).toBe('maj7')
    expect(parseChordSymbol('G7').quality).toBe('dom7')
    expect(parseChordSymbol('Dm7').quality).toBe('min7')
  })

  it('parses accidentals and slash bass including 6/9/E', () => {
    const fsharp = parseChordSymbol('F#m7b5')
    expect(fsharp.root).toEqual({ letter: 'F', accidental: 1 })
    expect(fsharp.quality).toBe('halfDim7')

    const slash = parseChordSymbol('C/E')
    expect(slash.bass).toEqual({ letter: 'E', accidental: 0 })

    const sixNineSlash = parseChordSymbol('C6/9/E')
    expect(sixNineSlash.quality).toBe('maj6')
    expect(sixNineSlash.extensions).toContain('add9')
    expect(sixNineSlash.bass).toEqual({ letter: 'E', accidental: 0 })
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

  it('rejects unbalanced parentheses', () => {
    expect(() => parseChordSymbol('C7)b9(')).toThrow(/unbalanced parentheses/)
  })

  it('includes original symbol in parse errors', () => {
    expect(() => parseChordSymbol('Cfoo')).toThrow(/Invalid chord "Cfoo"/)
  })

  it('builds expected chord tones for Dm7', () => {
    const dm7 = parseChordSymbol('Dm7')
    expect(chordTonePcs(dm7)).toEqual([0, 2, 5, 9])
  })

  it('stacks 9 and 11 under a 13th', () => {
    const g13 = parseChordSymbol('G13')
    // G B D F A C E → 7,11,2,5,9,0,4
    expect(chordTonePcs(g13)).toEqual([0, 2, 4, 5, 7, 9, 11])
  })

  it('round-trips common symbols through canonical format', () => {
    for (const symbol of ['Dm7', 'G7', 'Cmaj7', 'F#m7b5', 'A7sus4', 'Cm7add9']) {
      const parsed = parseChordSymbol(symbol)
      const { symbol: _s, ...structured } = parsed
      expect(formatChordCanonical(structured)).toBe(symbol)
    }
  })
})
