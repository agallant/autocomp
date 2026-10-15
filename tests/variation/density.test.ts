import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/practiceCharts'
import { expandChartBars } from '../../src/music'
import {
  buildStyleBarContextFromBars,
  createBossaStyle,
  createJazzSwingStyle,
} from '../../src/style'
import { applyCompDensity, applyVariation, seedFromString } from '../../src/variation'

describe('applyCompDensity', () => {
  const chart = createAutumnPracticeChart()
  const bars = expandChartBars(chart)
  const ctx = buildStyleBarContextFromBars(chart, bars, 0, { wrapNext: false })!
  const base = createJazzSwingStyle().realizeBar(ctx)

  it('leaves notes unchanged at normal density', () => {
    expect(applyCompDensity(ctx, base, 'normal')).toEqual(base)
  })

  it('keeps the earliest piano onset and drops hats when sparse', () => {
    const sparse = applyCompDensity(ctx, base, 'sparse')
    const pianoStarts = [
      ...new Set(sparse.filter((n) => n.voice === 'piano').map((n) => n.startBeat)),
    ]
    expect(pianoStarts).toEqual([1])
    expect(sparse.some((n) => n.voice === 'drums' && n.drum === 'hat')).toBe(false)
    expect(sparse.filter((n) => n.voice === 'bass').length).toBe(
      base.filter((n) => n.voice === 'bass').length,
    )
  })

  it('thins bossa piano without silencing it', () => {
    const bossa = createBossaStyle().realizeBar(ctx)
    const sparse = applyCompDensity(ctx, bossa, 'sparse')
    const starts = [
      ...new Set(sparse.filter((n) => n.voice === 'piano').map((n) => n.startBeat)),
    ]
    expect(starts.length).toBe(1)
    expect(starts[0]).toBe(Math.min(...bossa.filter((n) => n.voice === 'piano').map((n) => n.startBeat)))
  })

  it('adds piano comps on empty integer beats when dense (bossa &s stay)', () => {
    const bossa = createBossaStyle().realizeBar(ctx)
    const dense = applyCompDensity(ctx, bossa, 'dense')
    const starts = new Set(dense.filter((n) => n.voice === 'piano').map((n) => n.startBeat))
    expect(starts.has(0.5)).toBe(true)
    expect(starts.has(0)).toBe(true)
    expect(starts.has(2)).toBe(true)
    expect(dense.filter((n) => n.voice === 'piano').length).toBeGreaterThan(
      bossa.filter((n) => n.voice === 'piano').length,
    )
  })

  it('adds piano comps on empty beats when dense (swing)', () => {
    const dense = applyCompDensity(ctx, base, 'dense')
    const pianoBeats = new Set(dense.filter((n) => n.voice === 'piano').map((n) => n.startBeat))
    expect(pianoBeats.has(0)).toBe(true)
    expect(pianoBeats.has(2)).toBe(true)
  })

  it('applies density before fills so sparse keeps section snares', () => {
    const lastCtx = buildStyleBarContextFromBars(chart, bars, bars.length - 1, {
      wrapNext: false,
    })!
    const lastBase = createJazzSwingStyle().realizeBar(lastCtx)
    const withFill = applyVariation(lastCtx, lastBase, {
      fills: true,
      countInBars: 0,
      humanize: false,
      density: 'sparse',
      seed: seedFromString(chart.id),
      tempoBpm: 120,
    })
    expect(withFill.some((n) => n.voice === 'drums' && n.drum === 'snare')).toBe(true)
  })
})
