import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/practiceCharts'
import {
  assertValidChart,
  chartBarSymbols,
  formatChordCanonical,
  formatRoot,
  parseChordSymbol,
  preferSharpsForKey,
  preferSharpsForKeyPc,
  rootToPc,
  sectionFromBarSymbols,
  transposeChart,
  transposeChord,
  type Chart,
} from '../../src/music'

function minorChart(): Chart {
  const chart: Chart = {
    version: 1,
    id: 'e-minor-vamp',
    title: 'E Minor Vamp',
    key: { letter: 'E', accidental: 0 },
    timeSignature: { numerator: 4, denominator: 4 },
    defaultTempoBpm: 100,
    form: ['A'],
    sections: [
      sectionFromBarSymbols('A', 'A', [['Em7'], ['Am7'], ['B7'], ['Em7']]),
    ],
  }
  assertValidChart(chart)
  return chart
}

function slashChart(): Chart {
  const chart: Chart = {
    version: 1,
    id: 'slash-practice',
    title: 'Slash Practice',
    key: { letter: 'C', accidental: 0 },
    timeSignature: { numerator: 4, denominator: 4 },
    defaultTempoBpm: 100,
    form: ['A'],
    sections: [
      sectionFromBarSymbols('A', 'A', [['Cmaj7/E'], ['Dm7/G'], ['G7'], ['Cmaj7']]),
    ],
  }
  assertValidChart(chart)
  return chart
}

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

  it('uses relative-major preference for minor key centers', () => {
    // F# minor (pc 6) would be "flat" as a major tonic (Gb), but relative major A → sharps.
    expect(preferSharpsForKeyPc(6, true)).toBe(true)
    // D minor → relative F → flats.
    expect(preferSharpsForKeyPc(2, true)).toBe(false)
  })
})

describe('transposeChart', () => {
  it('transposes key and every chord symbol including slash bass', () => {
    const chart = slashChart()
    const next = transposeChart(chart, 2)
    assertValidChart(next)
    expect(formatRoot(next.key)).toBe('D')
    expect(chartBarSymbols(next)).toEqual(['Dmaj7/F#', 'Em7/A', 'A7', 'Dmaj7'])
  })

  it('transposes the autumn practice chart', () => {
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

  it('spells minor destinations with relative-major accidentals', () => {
    const next = transposeChart(minorChart(), 2) // Em → F#m, not Gbm
    expect(formatRoot(next.key)).toBe('F#')
    expect(chartBarSymbols(next)[0]).toBe('F#m7')
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
