import { describe, expect, it } from 'vitest'
import { generateProgression, generateRandomChart } from '../../src/generate'
import { validateChart, type Root } from '../../src/music'

const C: Root = { letter: 'C', accidental: 0 }

describe('generateRandomChart', () => {
  it('is deterministic for the same seed', () => {
    const a = generateRandomChart({ key: C, seed: 42, barCount: 12 })
    const b = generateRandomChart({ key: C, seed: 42, barCount: 12 })
    expect(a.sections[0]!.bars.map((bar) => bar.slots.map((s) => s.chord))).toEqual(
      b.sections[0]!.bars.map((bar) => bar.slots.map((s) => s.chord)),
    )
    expect(a.key).toEqual(b.key)
  })

  it('honors bar count, meter, and density knobs', () => {
    const chart = generateRandomChart({
      key: C,
      seed: 7,
      barCount: 16,
      chordDensity: 1,
      timeSignature: { numerator: 3, denominator: 4 },
      preferIiV: true,
      maxNonDiatonicStreak: 1,
    })
    expect(validateChart(chart)).toEqual([])
    expect(chart.sections[0]!.bars).toHaveLength(16)
    expect(chart.timeSignature).toEqual({ numerator: 3, denominator: 4 })
    expect(chart.sections[0]!.bars.every((bar) => bar.slots.length === 1)).toBe(true)
  })

  it('stays valid with wilder settings', () => {
    for (const seed of [1, 2, 3, 99, 12345]) {
      const chart = generateRandomChart({
        seed,
        barCount: 12,
        chordDensity: 2,
        majorBias: 0.4,
        preferIiV: false,
        maxNonDiatonicStreak: 3,
      })
      expect(validateChart(chart)).toEqual([])
      expect(chart.sections[0]!.bars).toHaveLength(12)
    }
  })

  it('is reachable from generateProgression as kind random', () => {
    const chart = generateProgression({
      kind: 'random',
      key: C,
      styleId: 'jazz-swing',
    })
    expect(validateChart(chart)).toEqual([])
    expect(chart.title.toLowerCase()).toContain('random')
  })

  it('honors barCount and chordDensity via generateProgression', () => {
    const chart = generateProgression({
      kind: 'random',
      key: C,
      styleId: 'jazz-swing',
      barCount: 8,
      chordDensity: 2,
    })
    expect(validateChart(chart)).toEqual([])
    expect(chart.sections[0]!.bars).toHaveLength(8)
  })
})
