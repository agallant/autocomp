import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/practiceCharts'
import { expandChartBars } from '../../src/music'
import { buildStyleBarContextFromBars, createJazzSwingStyle } from '../../src/style'
import { applyCompDensity, applyVariation, seedFromString } from '../../src/variation'

describe('applyCompDensity', () => {
  const chart = createAutumnPracticeChart()
  const bars = expandChartBars(chart)
  const ctx = buildStyleBarContextFromBars(chart, bars, 0, { wrapNext: false })!
  const base = createJazzSwingStyle().realizeBar(ctx)

  it('leaves notes unchanged at normal density', () => {
    expect(applyCompDensity(ctx, base, 'normal')).toEqual(base)
  })

  it('keeps only one piano comp beat and drops hats when sparse', () => {
    const sparse = applyCompDensity(ctx, base, 'sparse')
    const pianoBeats = [
      ...new Set(sparse.filter((n) => n.voice === 'piano').map((n) => Math.floor(n.startBeat))),
    ]
    expect(pianoBeats).toEqual([1])
    expect(sparse.some((n) => n.voice === 'drums' && n.drum === 'hat')).toBe(false)
    expect(sparse.filter((n) => n.voice === 'bass').length).toBe(
      base.filter((n) => n.voice === 'bass').length,
    )
  })

  it('adds piano comps on empty beats when dense', () => {
    const dense = applyCompDensity(ctx, base, 'dense')
    const pianoBeats = new Set(
      dense.filter((n) => n.voice === 'piano').map((n) => Math.floor(n.startBeat)),
    )
    expect(pianoBeats.has(0)).toBe(true)
    expect(pianoBeats.has(2)).toBe(true)
    expect(dense.filter((n) => n.voice === 'piano').length).toBeGreaterThan(
      base.filter((n) => n.voice === 'piano').length,
    )
  })

  it('runs through applyVariation with density option', () => {
    const viaApply = applyVariation(ctx, base, {
      fills: false,
      countInBars: 0,
      humanize: false,
      density: 'sparse',
      seed: seedFromString(chart.id),
      tempoBpm: 120,
    })
    expect(viaApply).toEqual(applyCompDensity(ctx, base, 'sparse'))
  })
})
