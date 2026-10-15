import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart, createRhythmLabChart } from '../../src/data/practiceCharts'
import { expandChartBars } from '../../src/music'
import { buildStyleBarContextFromBars, createJazzSwingStyle } from '../../src/style'
import {
  applySectionFill,
  fillStartBeat,
  isSectionBoundary,
  sectionBoundaryFlags,
} from '../../src/variation'

describe('section fills', () => {
  it('marks the last bar of each form section', () => {
    const chart = createRhythmLabChart()
    const flags = sectionBoundaryFlags(chart)
    expect(flags).toHaveLength(expandChartBars(chart).length)
    expect(flags.filter(Boolean).length).toBe(4) // A A B A
    expect(isSectionBoundary(chart, flags.length - 1)).toBe(true)
  })

  it('replaces late-bar drums with snare/kick fill hits', () => {
    const chart = createAutumnPracticeChart()
    const bars = expandChartBars(chart)
    const last = bars.length - 1
    const ctx = buildStyleBarContextFromBars(chart, bars, last, { wrapNext: false })!
    const base = createJazzSwingStyle().realizeBar(ctx)
    const filled = applySectionFill(ctx, base)
    const start = fillStartBeat(ctx.beatsPerBar)
    const lateDrums = filled.filter((n) => n.voice === 'drums' && n.startBeat >= start)
    expect(lateDrums.some((n) => n.drum === 'snare')).toBe(true)
    expect(lateDrums.some((n) => n.drum === 'kick')).toBe(true)
    // Early swing ride/kick pattern should remain.
    expect(filled.some((n) => n.voice === 'drums' && n.startBeat < start)).toBe(true)
    expect(filled.some((n) => n.voice === 'bass')).toBe(true)
  })
})
