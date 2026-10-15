import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/autumnPractice'
import {
  barFromSymbols,
  chartBarSymbols,
  chartFromJson,
  chartToJson,
  deserializeChart,
  expandChartBars,
  serializeChart,
  validateChart,
} from '../../src/music'

describe('chart model', () => {
  it('validates the autumn practice demo chart', () => {
    const chart = createAutumnPracticeChart()
    expect(validateChart(chart)).toEqual([])
    expect(expandChartBars(chart)).toHaveLength(8)
    expect(chartBarSymbols(chart)).toEqual([
      'Dm7',
      'G7',
      'Cmaj7',
      'A7',
      'Dm7',
      'G7',
      'Cmaj7',
      'Cmaj7',
    ])
  })

  it('round-trips through JSON including durations and metadata', () => {
    const chart = createAutumnPracticeChart()
    const json = chartToJson(chart)
    const restored = chartFromJson(json)
    expect(chartToJson(restored)).toEqual(json)
    expect(restored.title).toBe(chart.title)
    expect(restored.defaultTempoBpm).toBe(120)
    expect(restored.sections[0]!.bars[0]!.slots[0]!.durationBeats).toBe(4)
    expect(restored.styleHint).toBe('swing')

    const text = serializeChart(chart)
    const fromText = deserializeChart(text)
    expect(chartToJson(fromText)).toEqual(json)
  })

  it('flags bars whose slots do not fill the bar', () => {
    const chart = createAutumnPracticeChart()
    chart.sections[0]!.bars[0]!.slots = [
      { chord: chart.sections[0]!.bars[0]!.slots[0]!.chord, durationBeats: 2 },
    ]
    const issues = validateChart(chart)
    expect(issues.some((i) => i.message.includes('expected 4'))).toBe(true)
  })

  it('rejects more symbols than beats in a bar', () => {
    expect(() => barFromSymbols(['C', 'Dm', 'Em', 'F', 'G'])).toThrow(/More chord symbols/)
  })

  it('rejects empty chord strings and invalid keys in JSON', () => {
    const chart = createAutumnPracticeChart()
    const json = chartToJson(chart)
    json.key = 'Cmaj7'
    expect(() => chartFromJson(json)).toThrow(/Invalid key/)

    const json2 = chartToJson(chart)
    json2.sections[0]!.bars[0]!.slots[0]!.chord = ''
    expect(() => chartFromJson(json2)).toThrow()
  })
})
