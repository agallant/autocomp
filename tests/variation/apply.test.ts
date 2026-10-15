import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/practiceCharts'
import { expandChartBars } from '../../src/music'
import { buildStyleBarContextFromBars, createJazzSwingStyle } from '../../src/style'
import {
  applyVariation,
  chartLayoutKey,
  createVariedStyle,
  seedFromString,
  type VariationOptions,
} from '../../src/variation'

describe('applyVariation / createVariedStyle', () => {
  const chart = createAutumnPracticeChart()
  const bars = expandChartBars(chart)
  const lastCtx = buildStyleBarContextFromBars(chart, bars, bars.length - 1, {
    wrapNext: false,
  })!
  const opts: VariationOptions = {
    fills: true,
    countInBars: 0,
    humanize: true,
    density: 'normal',
    seed: seedFromString(chart.id),
    tempoBpm: 120,
  }

  it('wrapStyle matches direct applyVariation', () => {
    const base = createJazzSwingStyle()
    const wrapped = createVariedStyle(base, opts)
    const direct = applyVariation(lastCtx, base.realizeBar(lastCtx), opts)
    expect(wrapped.realizeBar(lastCtx)).toEqual(direct)
  })

  it('adds fill snares on the section-end bar when fills are on', () => {
    const base = createJazzSwingStyle().realizeBar(lastCtx)
    const withFill = applyVariation(lastCtx, base, { ...opts, humanize: false })
    const without = applyVariation(lastCtx, base, {
      ...opts,
      fills: false,
      humanize: false,
    })
    const snareFill = withFill.filter((n) => n.voice === 'drums' && n.drum === 'snare')
    const baseSnares = without.filter((n) => n.voice === 'drums' && n.drum === 'snare')
    expect(snareFill.length).toBeGreaterThan(baseSnares.length)
  })

  it('leaves mid-form bars without fills when fills are on', () => {
    const midCtx = buildStyleBarContextFromBars(chart, bars, 1, { wrapNext: false })!
    const base = createJazzSwingStyle()
    const varied = createVariedStyle(base, { ...opts, humanize: false })
    expect(varied.realizeBar(midCtx)).toEqual(base.realizeBar(midCtx))
  })

  it('invalidates fill boundaries when form layout changes in place', () => {
    const mutable = structuredClone(chart)
    const base = createJazzSwingStyle()
    const varied = createVariedStyle(base, { ...opts, humanize: false })
    const beforeKey = chartLayoutKey(mutable)
    // Warm the cache on the original layout.
    const warmBars = expandChartBars(mutable)
    const warmCtx = buildStyleBarContextFromBars(mutable, warmBars, warmBars.length - 1, {
      wrapNext: false,
    })!
    expect(varied.realizeBar(warmCtx).some((n) => n.drum === 'snare')).toBe(true)

    // Mutate the same object: append a bar so the previous last bar is no longer a boundary.
    mutable.sections[0]!.bars.push({
      slots: [{ chord: null, durationBeats: 4 }],
    })
    expect(chartLayoutKey(mutable)).not.toBe(beforeKey)
    const nextBars = expandChartBars(mutable)
    const oldEnd = buildStyleBarContextFromBars(mutable, nextBars, warmBars.length - 1, {
      wrapNext: false,
    })!
    const newEnd = buildStyleBarContextFromBars(mutable, nextBars, nextBars.length - 1, {
      wrapNext: false,
    })!
    const oldEndNotes = varied.realizeBar(oldEnd)
    const newEndNotes = varied.realizeBar(newEnd)
    // Old end should no longer get a fill; the new last bar should.
    const oldFillSnares = oldEndNotes.filter((n) => n.voice === 'drums' && n.drum === 'snare')
    const newFillSnares = newEndNotes.filter((n) => n.voice === 'drums' && n.drum === 'snare')
    expect(newFillSnares.length).toBeGreaterThan(oldFillSnares.length)
  })
})
