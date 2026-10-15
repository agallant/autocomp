import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/practiceCharts'
import { expandChartBars } from '../../src/music'
import { buildStyleBarContextFromBars, createJazzSwingStyle } from '../../src/style'
import {
  applyFormEnding,
  applyVariation,
  formEndingFlags,
  seedFromString,
} from '../../src/variation'

describe('form endings', () => {
  const chart = createAutumnPracticeChart()
  const bars = expandChartBars(chart)

  it('marks penultimate and final bars', () => {
    const flags = formEndingFlags(bars.length)
    expect(flags.final[bars.length - 1]).toBe(true)
    expect(flags.penultimate[bars.length - 2]).toBe(true)
    expect(flags.final.filter(Boolean)).toHaveLength(1)
    expect(flags.penultimate.filter(Boolean)).toHaveLength(1)
  })

  it('adds a snare fill on the penultimate bar', () => {
    const ctx = buildStyleBarContextFromBars(chart, bars, bars.length - 2, {
      wrapNext: false,
    })!
    const base = createJazzSwingStyle().realizeBar(ctx)
    const ended = applyFormEnding(ctx, base, { penultimate: true, final: false })
    const snares = ended.filter((n) => n.voice === 'drums' && n.drum === 'snare')
    const baseSnares = base.filter((n) => n.voice === 'drums' && n.drum === 'snare')
    expect(snares.length).toBeGreaterThan(baseSnares.length)
  })

  it('holds only the last piano voicing to the bar boundary', () => {
    const ctx = buildStyleBarContextFromBars(chart, bars, bars.length - 1, {
      wrapNext: false,
    })!
    const base = createJazzSwingStyle().realizeBar(ctx)
    const ended = applyFormEnding(ctx, base, { penultimate: false, final: true })
    expect(ended.some((n) => n.voice === 'drums' && n.drum === 'ride')).toBe(true)
    expect(ended.some((n) => n.voice === 'drums' && n.drum === 'kick')).toBe(true)
    expect(ended.some((n) => n.voice === 'bass' && n.startBeat >= 1)).toBe(false)
    const piano = ended.filter((n) => n.voice === 'piano')
    expect(piano.length).toBeGreaterThan(0)
    const lastStart = Math.max(...piano.map((n) => n.startBeat))
    expect(
      piano.some(
        (n) =>
          Math.abs(n.startBeat - lastStart) <= 1e-9 &&
          n.startBeat + n.durationBeats >= ctx.beatsPerBar - 1e-9,
      ),
    ).toBe(true)
  })

  it('wires through applyVariation when endings are on', () => {
    const ctx = buildStyleBarContextFromBars(chart, bars, bars.length - 1, {
      wrapNext: false,
    })!
    const base = createJazzSwingStyle().realizeBar(ctx)
    const via = applyVariation(ctx, base, {
      fills: false,
      countInBars: 0,
      humanize: false,
      density: 'normal',
      endings: true,
      swingFeel: 0,
      seed: seedFromString(chart.id),
      tempoBpm: 120,
    })
    expect(via.some((n) => n.voice === 'bass' && n.startBeat >= 1)).toBe(false)
  })
})
