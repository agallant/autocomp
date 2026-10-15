import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/autumnPractice'
import {
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

  it('round-trips through JSON serialize/deserialize', () => {
    const chart = createAutumnPracticeChart()
    const json = chartToJson(chart)
    const restored = chartFromJson(json)
    expect(chartBarSymbols(restored)).toEqual(chartBarSymbols(chart))
    expect(restored.title).toBe(chart.title)
    expect(restored.defaultTempoBpm).toBe(120)

    const text = serializeChart(chart)
    const fromText = deserializeChart(text)
    expect(chartBarSymbols(fromText)).toEqual(chartBarSymbols(chart))
  })

  it('flags bars whose slots do not fill the bar', () => {
    const chart = createAutumnPracticeChart()
    chart.sections[0]!.bars[0]!.slots = [
      { chord: chart.sections[0]!.bars[0]!.slots[0]!.chord, durationBeats: 2 },
    ]
    const issues = validateChart(chart)
    expect(issues.some((i) => i.message.includes('expected 4'))).toBe(true)
  })
})
