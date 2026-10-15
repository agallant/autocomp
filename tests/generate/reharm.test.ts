import { describe, expect, it } from 'vitest'
import { generateProgression, reharmBar, secondaryIiV } from '../../src/generate'
import {
  chartBarSymbols,
  expandChartBars,
  sectionFromBarSymbols,
  validateChart,
  type Chart,
  type Root,
} from '../../src/music'

const C: Root = { letter: 'C', accidental: 0 }

function dominantChart(): Chart {
  return {
    version: 1,
    id: 'dom-test',
    title: 'Dom Test',
    key: C,
    timeSignature: { numerator: 4, denominator: 4 },
    defaultTempoBpm: 120,
    form: ['A'],
    sections: [sectionFromBarSymbols('A', 'A', [['G7'], ['Cmaj7'], ['Dm7'], ['G7']])],
  }
}

describe('reharmBar', () => {
  it('splits a dominant bar into ii–V', () => {
    const chart = dominantChart()
    const next = reharmBar(chart, 0, 'ii-before-v')
    expect(validateChart(next)).toEqual([])
    expect(chartBarSymbols(next)[0]).toBe('Dm7 G7')
    // Non-dominant bars stay put when targeted.
    const onTonic = reharmBar(chart, 1, 'ii-before-v')
    expect(chartBarSymbols(onTonic)[1]).toBe('Cmaj7')
  })

  it('replaces a dominant with its tritone substitute', () => {
    const chart = dominantChart()
    const next = reharmBar(chart, 0, 'tritone-sub')
    expect(validateChart(next)).toEqual([])
    expect(chartBarSymbols(next)[0]).toBe('Db7')
    expect(expandChartBars(next)[0]!.slots).toHaveLength(1)
  })

  it('works on a generated blues chart without breaking meter', () => {
    const blues = generateProgression({
      kind: 'blues',
      key: C,
      styleId: 'jazz-swing',
    })
    // Bar 8 is V7 in the blues form (0-based: bar 8 = V7).
    const next = reharmBar(blues, 8, 'ii-before-v')
    expect(validateChart(next)).toEqual([])
    expect(chartBarSymbols(next)[8]).toMatch(/m7 .+7/)
  })

  it('builds a secondary ii–V toward I', () => {
    expect(secondaryIiV(C, 1)).toEqual(['Dm7', 'G7'])
  })
})
