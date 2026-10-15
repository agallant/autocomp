import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/practiceCharts'
import { expandChartBars } from '../../src/music'
import {
  buildStyleBarContextFromBars,
  createJazzSwingStyle,
  createMutedStyle,
  filterMutedVoices,
  type StyleNote,
  type VoiceMuteState,
} from '../../src/style'

describe('voice mute', () => {
  const sample: StyleNote[] = [
    { voice: 'bass', midi: 36, startBeat: 0, durationBeats: 1, velocity: 0.7 },
    { voice: 'piano', midi: 60, startBeat: 1, durationBeats: 1, velocity: 0.5 },
    { voice: 'drums', midi: 36, startBeat: 0, durationBeats: 0.2, velocity: 0.8, drum: 'kick' },
  ]

  it('filters muted voices', () => {
    const enabled: VoiceMuteState = { bass: true, piano: false, drums: true, melody: false }
    const out = filterMutedVoices(sample, enabled)
    expect(out.map((n) => n.voice)).toEqual(['bass', 'drums'])
  })

  it('keeps all voices when nothing is muted', () => {
    expect(
      filterMutedVoices(sample, { bass: true, piano: true, drums: true, melody: true }),
    ).toHaveLength(3)
  })

  it('wraps realizeBar so muted voices are absent', () => {
    const chart = createAutumnPracticeChart()
    const bars = expandChartBars(chart)
    const ctx = buildStyleBarContextFromBars(chart, bars, 0)!
    const base = createJazzSwingStyle().realizeBar(ctx)
    expect(base.some((n) => n.voice === 'piano')).toBe(true)
    expect(base.some((n) => n.voice === 'bass')).toBe(true)

    const muted = createMutedStyle(createJazzSwingStyle(), {
      bass: true,
      piano: false,
      drums: false,
      melody: false,
    }).realizeBar(ctx)
    expect(muted.every((n) => n.voice === 'bass')).toBe(true)
    expect(muted.length).toBeGreaterThan(0)
  })
})
