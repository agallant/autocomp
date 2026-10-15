import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/practiceCharts'
import { expandChartBars } from '../../src/music'
import { buildStyleBarContextFromBars, createJazzSwingStyle } from '../../src/style'
import {
  applySwingFeel,
  applyVariation,
  DEFAULT_SWING_FEEL,
  seedFromString,
  SWING_RATIO_HARD,
  SWING_RATIO_STRAIGHT,
  SWING_RATIO_TRIPLET,
  swingFeelToRatio,
  swingRatioToFeel,
} from '../../src/variation'

describe('swingFeel', () => {
  it('maps 0 / 67 / 100 to straight, near-triplet, and hard ratios', () => {
    expect(swingFeelToRatio(0)).toBe(SWING_RATIO_STRAIGHT)
    expect(swingFeelToRatio(DEFAULT_SWING_FEEL)).toBeCloseTo(SWING_RATIO_TRIPLET, 2)
    expect(swingFeelToRatio(100)).toBe(SWING_RATIO_HARD)
    expect(swingRatioToFeel(SWING_RATIO_TRIPLET)).toBe(DEFAULT_SWING_FEEL)
  })

  it('clamps out-of-range feel values', () => {
    expect(swingFeelToRatio(-20)).toBe(SWING_RATIO_STRAIGHT)
    expect(swingFeelToRatio(140)).toBe(SWING_RATIO_HARD)
  })

  it('leaves even-eighth upbeats alone when straight', () => {
    const notes = [
      { voice: 'drums' as const, midi: 51, drum: 'ride' as const, startBeat: 1.5, durationBeats: 0.15, velocity: 0.3 },
      { voice: 'drums' as const, midi: 51, drum: 'ride' as const, startBeat: 1, durationBeats: 0.2, velocity: 0.4 },
    ]
    expect(applySwingFeel(notes, 0)).toEqual(notes)
  })

  it('delays only even-eighth upbeats for triplet and hard feel', () => {
    const notes = [
      { voice: 'drums' as const, midi: 51, drum: 'ride' as const, startBeat: 1.5, durationBeats: 0.15, velocity: 0.3 },
      { voice: 'bass' as const, midi: 40, startBeat: 1, durationBeats: 0.9, velocity: 0.6 },
      { voice: 'piano' as const, midi: 60, startBeat: 1.25, durationBeats: 0.4, velocity: 0.4 },
    ]
    const triplet = applySwingFeel(notes, DEFAULT_SWING_FEEL)
    expect(triplet[0]!.startBeat).toBeCloseTo(1 + SWING_RATIO_TRIPLET, 2)
    expect(triplet[1]!.startBeat).toBe(1)
    expect(triplet[2]!.startBeat).toBe(1.25)

    const hard = applySwingFeel(notes, 100)
    expect(hard[0]!.startBeat).toBeCloseTo(1 + SWING_RATIO_HARD, 9)
  })

  it('warps jazz-swing ride skips through applyVariation', () => {
    const chart = createAutumnPracticeChart()
    const bars = expandChartBars(chart)
    const ctx = buildStyleBarContextFromBars(chart, bars, 0, { wrapNext: false })!
    const base = createJazzSwingStyle().realizeBar(ctx)
    const opts = {
      fills: false,
      countInBars: 0,
      humanize: false,
      density: 'normal' as const,
      endings: false,
      swingFeel: DEFAULT_SWING_FEEL,
      seed: seedFromString(chart.id),
      tempoBpm: 120,
    }
    const straight = applyVariation(ctx, base, { ...opts, swingFeel: 0 }, { styleId: 'jazz-swing' })
    const swung = applyVariation(ctx, base, opts, { styleId: 'jazz-swing' })
    const straightSkip = straight.filter((n) => n.drum === 'ride' && Math.abs(n.startBeat - 1.5) < 1e-9)
    const swungSkip = swung.filter(
      (n) => n.drum === 'ride' && Math.abs(n.startBeat - (1 + swingFeelToRatio(DEFAULT_SWING_FEEL))) < 1e-6,
    )
    expect(straightSkip.length).toBeGreaterThan(0)
    expect(swungSkip.length).toBeGreaterThan(0)
  })

  it('does not warp bossa/Latin even-eighth syncopation at default feel', () => {
    const chart = createAutumnPracticeChart()
    const bars = expandChartBars(chart)
    const ctx = buildStyleBarContextFromBars(chart, bars, 0, { wrapNext: false })!
    const syncopated = [
      {
        voice: 'piano' as const,
        midi: 60,
        startBeat: 0.5,
        durationBeats: 0.5,
        velocity: 0.4,
      },
      {
        voice: 'bass' as const,
        midi: 40,
        startBeat: 1.5,
        durationBeats: 0.5,
        velocity: 0.5,
      },
    ]
    const viaBossa = applyVariation(
      ctx,
      syncopated,
      {
        fills: false,
        countInBars: 0,
        humanize: false,
        density: 'normal',
        endings: false,
        swingFeel: DEFAULT_SWING_FEEL,
        seed: seedFromString(chart.id),
        tempoBpm: 120,
      },
      { styleId: 'bossa' },
    )
    expect(viaBossa.map((n) => n.startBeat)).toEqual([0.5, 1.5])
  })
})
