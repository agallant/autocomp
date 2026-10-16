import { describe, expect, it } from 'vitest'
import {
  coltraneBars,
  generateEngine,
  iiVChainBars,
  rhythmABars,
} from '../../src/generate'
import { chartBarSymbols, validateChart, type Root } from '../../src/music'

const C: Root = { letter: 'C', accidental: 0 }
const BB: Root = { letter: 'B', accidental: -1 }

describe('harmonic engines', () => {
  it('builds a valid ii–V chain of the requested length', () => {
    const chart = generateEngine({
      kind: 'ii-v-chain',
      key: C,
      styleId: 'jazz-swing',
      length: 12,
    })
    expect(validateChart(chart)).toEqual([])
    expect(chart.sections[0]!.bars).toHaveLength(12)
    expect(chart.styleHint).toBe('jazz-swing')
    const symbols = chartBarSymbols(chart)
    expect(symbols[0]).toBe('Dm7')
    expect(symbols[1]).toBe('G7')
  })

  it('cycles tonics by fourths in iiVChainBars', () => {
    const bars = iiVChainBars(C, 4, 'major', true)
    expect(bars).toHaveLength(4)
    expect(bars[0]).toEqual(['Dm7'])
    expect(bars[1]).toEqual(['G7'])
    // Next tonic F → Gm7 C7
    expect(bars[2]).toEqual(['Gm7'])
    expect(bars[3]).toEqual(['C7'])
  })

  it('builds an 8-bar rhythm-changes A lab in Bb', () => {
    const chart = generateEngine({
      kind: 'rhythm-a',
      key: BB,
      styleId: 'jazz-swing',
      length: 8,
    })
    expect(validateChart(chart)).toEqual([])
    expect(chart.sections[0]!.bars).toHaveLength(8)
    const symbols = chartBarSymbols(chart)
    expect(symbols[0]).toContain('Bbmaj7')
    expect(rhythmABars(BB, 8, false)).toHaveLength(8)
  })

  it('builds a Coltrane major-thirds matrix', () => {
    const chart = generateEngine({
      kind: 'coltrane',
      key: C,
      styleId: 'jazz-swing',
      length: 8,
    })
    expect(validateChart(chart)).toEqual([])
    expect(chart.sections[0]!.bars).toHaveLength(8)
    const bars = coltraneBars(C, 8, true)
    // V–I of C, Ab, E then ii–V home
    expect(bars[0]).toEqual(['G7'])
    expect(bars[1]).toEqual(['Cmaj7'])
    expect(bars[2]).toEqual(['Eb7'])
    expect(bars[3]).toEqual(['Abmaj7'])
  })
})
