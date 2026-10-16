import { describe, expect, it } from 'vitest'
import {
  PROGRESSION_CATALOG,
  degreeRoot,
  generateProgression,
  styleGenerateHints,
} from '../../src/generate'
import { chartBarSymbols, formatRoot, validateChart, type Root } from '../../src/music'
import type { StyleId } from '../../src/style'

const C: Root = { letter: 'C', accidental: 0 }
const F: Root = { letter: 'F', accidental: 0 }
const BB: Root = { letter: 'B', accidental: -1 }

describe('generateProgression', () => {
  it('lists the catalog kinds', () => {
    expect(PROGRESSION_CATALOG.map((p) => p.id)).toEqual([
      'ii-v-i',
      'minor-ii-v-i',
      'turnaround',
      'blues',
      'vamp',
      'random',
    ])
  })

  it('builds a valid major ii–V–I chart in C for jazz swing', () => {
    const chart = generateProgression({
      kind: 'ii-v-i',
      key: C,
      styleId: 'jazz-swing',
    })
    expect(validateChart(chart)).toEqual([])
    expect(chart.styleHint).toBe('jazz-swing')
    expect(chart.defaultTempoBpm).toBe(styleGenerateHints('jazz-swing').suggestedTempoBpm)
    const symbols = chartBarSymbols(chart)
    expect(symbols[0]).toBe('Dm7')
    expect(symbols[1]).toBe('G7')
    expect(symbols[2]).toBe('Cmaj7')
  })

  it('builds a minor ii–V–i in C', () => {
    const chart = generateProgression({
      kind: 'minor-ii-v-i',
      key: C,
      styleId: 'ballad',
    })
    expect(validateChart(chart)).toEqual([])
    const symbols = chartBarSymbols(chart)
    expect(symbols[0]).toBe('Dm7b5')
    expect(symbols[1]).toBe('G7')
    expect(symbols[2]).toBe('Cm7')
  })

  it('builds a 12-bar blues in F', () => {
    const chart = generateProgression({
      kind: 'blues',
      key: F,
      styleId: 'jazz-swing',
      preferSharps: false,
    })
    expect(validateChart(chart)).toEqual([])
    expect(chartBarSymbols(chart)).toHaveLength(12)
    expect(chartBarSymbols(chart)[0]).toBe('F7')
    expect(chartBarSymbols(chart)[4]).toBe('Bb7')
  })

  it('preserves flat-key diatonic spelling (Bb → Eb, not D#)', () => {
    const chart = generateProgression({
      kind: 'ii-v-i',
      key: BB,
      styleId: 'jazz-swing',
      preferSharps: true, // must not force A# / D#
    })
    expect(validateChart(chart)).toEqual([])
    const symbols = chartBarSymbols(chart)
    expect(symbols[0]).toBe('Cm7')
    expect(symbols[1]).toBe('F7')
    expect(symbols[2]).toBe('Bbmaj7')
  })

  it('assigns a unique id per generation', () => {
    const a = generateProgression({ kind: 'vamp', key: C, styleId: 'latin' })
    const b = generateProgression({ kind: 'vamp', key: C, styleId: 'latin' })
    expect(a.id).not.toBe(b.id)
  })

  it('falls back to a spellable enharmonic for extreme keys', () => {
    const dDoubleSharp: Root = { letter: 'D', accidental: 2 }
    const root = degreeRoot(dDoubleSharp, 1, 'major')
    expect(root.accidental).toBeGreaterThanOrEqual(-2)
    expect(root.accidental).toBeLessThanOrEqual(2)
    expect(formatRoot(root).length).toBeGreaterThan(0)
  })

  it('varies vamp harmony by style', () => {
    const styles: StyleId[] = ['jazz-swing', 'bossa', 'ballad', 'latin']
    const sets = styles.map((styleId) =>
      chartBarSymbols(
        generateProgression({
          kind: 'vamp',
          key: BB,
          styleId,
          preferSharps: false,
        }),
      ),
    )
    // Latin minor vamp should differ from ballad major holds.
    expect(sets[3]![0]).not.toBe(sets[2]![0])
    for (const styleId of styles) {
      expect(
        validateChart(
          generateProgression({ kind: 'vamp', key: C, styleId }),
        ),
      ).toEqual([])
    }
  })

  it('turnaround uses two-slot bars for I–vi / ii–V', () => {
    const chart = generateProgression({
      kind: 'turnaround',
      key: C,
      styleId: 'bossa',
    })
    expect(validateChart(chart)).toEqual([])
    expect(chartBarSymbols(chart)[0]).toBe('Cmaj7 Am7')
    expect(chartBarSymbols(chart)[1]).toBe('Dm7 G7')
  })
})
