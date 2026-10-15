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

function turnaroundBarChart(): Chart {
  return {
    version: 1,
    id: 'ta-test',
    title: 'TA Test',
    key: C,
    timeSignature: { numerator: 4, denominator: 4 },
    defaultTempoBpm: 120,
    form: ['A'],
    sections: [sectionFromBarSymbols('A', 'A', [['Cmaj7', 'A7'], ['Dm7', 'G7']])],
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
    // Input chart must not be mutated via aliasing.
    expect(chartBarSymbols(chart)[0]).toBe('G7')
  })

  it('replaces a dominant with its tritone substitute', () => {
    const chart = dominantChart()
    const next = reharmBar(chart, 0, 'tritone-sub')
    expect(validateChart(next)).toEqual([])
    expect(chartBarSymbols(next)[0]).toBe('Db7')
    expect(expandChartBars(next)[0]!.slots).toHaveLength(1)
  })

  it('reharms a later dominant slot without dropping earlier chords', () => {
    const chart = turnaroundBarChart()
    const iiV = reharmBar(chart, 0, 'ii-before-v')
    expect(validateChart(iiV)).toEqual([])
    expect(chartBarSymbols(iiV)[0]).toBe('Cmaj7 Em7 A7')

    const sub = reharmBar(chart, 0, 'tritone-sub')
    expect(validateChart(sub)).toEqual([])
    expect(chartBarSymbols(sub)[0]).toBe('Cmaj7 Eb7')
  })

  it('isolates a repeated form section so one A does not rewrite every A', () => {
    const chart: Chart = {
      version: 1,
      id: 'aaba',
      title: 'AABA',
      key: C,
      timeSignature: { numerator: 4, denominator: 4 },
      defaultTempoBpm: 120,
      form: ['A', 'A'],
      sections: [sectionFromBarSymbols('A', 'A', [['G7'], ['Cmaj7']])],
    }
    // Second A starts at expanded index 2.
    const next = reharmBar(chart, 2, 'tritone-sub')
    expect(validateChart(next)).toEqual([])
    const symbols = chartBarSymbols(next)
    expect(symbols[0]).toBe('G7') // first A unchanged
    expect(symbols[2]).toBe('Db7') // second A occurrence reharmed
    expect(next.form[0]).toBe('A')
    expect(next.form[1]).not.toBe('A')
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

  it('honors preferSharps=false for ii-before-V spelling', () => {
    const chart: Chart = {
      version: 1,
      id: 'b7',
      title: 'B7',
      key: C,
      timeSignature: { numerator: 4, denominator: 4 },
      defaultTempoBpm: 120,
      form: ['A'],
      sections: [sectionFromBarSymbols('A', 'A', [['B7']])],
    }
    const next = reharmBar(chart, 0, 'ii-before-v', false)
    expect(chartBarSymbols(next)[0]).toBe('Gbm7 B7')
  })
})
