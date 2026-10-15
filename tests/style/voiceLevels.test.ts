import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/practiceCharts'
import { expandChartBars } from '../../src/music'
import {
  applyVoiceLevels,
  buildStyleBarContextFromBars,
  clampVoiceLevel,
  createJazzSwingStyle,
  createLeveledStyle,
  DEFAULT_VOICE_LEVELS,
  normalizeVoiceLevels,
  type StyleNote,
} from '../../src/style'

describe('voice levels', () => {
  const sample: StyleNote[] = [
    { voice: 'bass', midi: 36, startBeat: 0, durationBeats: 1, velocity: 0.8 },
    { voice: 'piano', midi: 60, startBeat: 1, durationBeats: 1, velocity: 0.5 },
    { voice: 'drums', midi: 36, startBeat: 0, durationBeats: 0.2, velocity: 0.6, drum: 'kick' },
  ]

  it('clamps and normalizes levels', () => {
    expect(clampVoiceLevel(1.5)).toBe(1)
    expect(clampVoiceLevel(-0.2)).toBe(0)
    expect(normalizeVoiceLevels({ bass: 0.5 })).toEqual({
      bass: 0.5,
      piano: 1,
      drums: 1,
    })
  })

  it('scales velocities and drops silent voices', () => {
    const out = applyVoiceLevels(sample, {
      bass: 0.5,
      piano: 0,
      drums: 1,
    })
    expect(out.map((n) => n.voice)).toEqual(['bass', 'drums'])
    expect(out[0]!.velocity).toBeCloseTo(0.4, 9)
    expect(out[1]!.velocity).toBe(0.6)
  })

  it('is a no-op at default levels', () => {
    expect(applyVoiceLevels(sample, DEFAULT_VOICE_LEVELS)).toEqual(sample)
  })

  it('wraps realizeBar so levels scale every voice', () => {
    const chart = createAutumnPracticeChart()
    const bars = expandChartBars(chart)
    const ctx = buildStyleBarContextFromBars(chart, bars, 0)!
    const base = createJazzSwingStyle().realizeBar(ctx)
    const leveled = createLeveledStyle(createJazzSwingStyle(), {
      bass: 0.5,
      piano: 0.25,
      drums: 1,
    }).realizeBar(ctx)

    const baseBass = base.filter((n) => n.voice === 'bass')
    const leveledBass = leveled.filter((n) => n.voice === 'bass')
    expect(leveledBass).toHaveLength(baseBass.length)
    expect(leveledBass[0]!.velocity).toBeCloseTo(baseBass[0]!.velocity * 0.5, 9)

    const basePiano = base.filter((n) => n.voice === 'piano')
    const leveledPiano = leveled.filter((n) => n.voice === 'piano')
    expect(leveledPiano[0]!.velocity).toBeCloseTo(basePiano[0]!.velocity * 0.25, 9)
  })
})
