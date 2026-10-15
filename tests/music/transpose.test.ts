import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/practiceCharts'
import {
  assertValidChart,
  chartBarSymbols,
  formatChordCanonical,
  formatRoot,
  parseChordSymbol,
  preferSharpsForKey,
  rootToPc,
  transposeChart,
  transposeChord,
} from '../../src/music'

describe('transposeChord', () => {
  it('shifts root and bass by semitones', () => {
    const chord = parseChordSymbol('Dm7/G')
    const up = transposeChord(chord, 2, true)
    expect(formatChordCanonical(up)).toBe('Em7/A')
    const down = transposeChord(chord, -2, false)
    expect(formatChordCanonical(down)).toBe('Cm7/F')
  })

  it('is a no-op at zero semitones', () => {
    const chord = parseChordSymbol('G7b9')
    expect(transposeChord(chord, 0)).toBe(chord)
  })
})

describe('preferSharpsForKey', () => {
  it('prefers flats in flat keys and sharps otherwise', () => {
    expect(preferSharpsForKey({ letter: 'F', accidental: 0 })).toBe(false)
    expect(preferSharpsForKey({ letter: 'B', accidental: -1 })).toBe(false)
    expect(preferSharpsForKey({ letter: 'G', accidental: 0 })).toBe(true)
    expect(preferSharpsForKey({ letter: 'C', accidental: 0 })).toBe(true)
  })
})

describe('transposeChart', () => {
  it('transposes key and every chord symbol', () => {
    const chart = createAutumnPracticeChart()
    const next = transposeChart(chart, 2)
    assertValidChart(next)
    expect(formatRoot(next.key)).toBe('D')
    expect(rootToPc(next.key)).toBe((rootToPc(chart.key) + 2) % 12)
    expect(chartBarSymbols(next)).toEqual([
      'Em7',
      'A7',
      'Dmaj7',
      'B7',
      'Em7',
      'A7',
      'Dmaj7',
      'Dmaj7',
    ])
  })

  it('uses flat spelling when landing in a flat key', () => {
    const chart = createAutumnPracticeChart()
    const next = transposeChart(chart, -2) // C → Bb
    expect(formatRoot(next.key)).toBe('Bb')
    expect(chartBarSymbols(next).slice(0, 3)).toEqual(['Cm7', 'F7', 'Bbmaj7'])
  })

  it('round-trips twelve semitones to the same pitch classes', () => {
    const chart = createAutumnPracticeChart()
    const next = transposeChart(chart, 12)
    assertValidChart(next)
    expect(rootToPc(next.key)).toBe(rootToPc(chart.key))
    const original = chartBarSymbols(chart)
    const shifted = chartBarSymbols(next)
    expect(shifted.map((s) => rootToPc(parseChordSymbol(s).root))).toEqual(
      original.map((s) => rootToPc(parseChordSymbol(s).root)),
    )
  })

  it('rejects non-integer semitone deltas', () => {
    expect(() => transposeChart(createAutumnPracticeChart(), 1.5)).toThrow(/integer/)
  })
})
