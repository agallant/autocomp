import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/practiceCharts'
import {
  GUIDE_MELODY_CENTER,
  guideTonePcs,
  nearestGuideMidi,
  realizeGuideMelody,
} from '../../src/generate'
import { expandChartBars, parseChordSymbol } from '../../src/music'
import {
  buildStyleBarContextFromBars,
  createGuideMelodyStyle,
  createJazzSwingStyle,
  createMutedStyle,
} from '../../src/style'

describe('guide melody', () => {
  it('prefers 3rd/7th guide tones on dominant and minor-seventh chords', () => {
    const g7 = guideTonePcs(parseChordSymbol('G7'))
    const dm7 = guideTonePcs(parseChordSymbol('Dm7'))
    // G7: B(11) + F(5); Dm7: F(5) + C(0)
    expect(g7.slice(0, 2).sort((a, b) => a - b)).toEqual([5, 11])
    expect(dm7.slice(0, 2).sort((a, b) => a - b)).toEqual([0, 5])
  })

  it('picks the nearest MIDI for smooth voice leading', () => {
    expect(nearestGuideMidi([0, 4, 7] as const, 60)).toBe(60) // C4
    expect(nearestGuideMidi([11, 5] as const, 71)).toBe(71) // B4 from G7 guides
  })

  it('realizes one melody note per sounding beat', () => {
    const chart = createAutumnPracticeChart()
    const bars = expandChartBars(chart)
    const ctx = buildStyleBarContextFromBars(chart, bars, 0)!
    const notes = realizeGuideMelody(ctx)
    expect(notes).toHaveLength(ctx.beatsPerBar)
    expect(notes.every((n) => n.voice === 'melody')).toBe(true)
    expect(notes[0]!.midi).toBeGreaterThan(GUIDE_MELODY_CENTER - 12)
    expect(notes[0]!.midi).toBeLessThan(GUIDE_MELODY_CENTER + 12)
  })

  it('wraps a style and stays silent until the Guide voice is enabled', () => {
    const chart = createAutumnPracticeChart()
    const bars = expandChartBars(chart)
    const ctx = buildStyleBarContextFromBars(chart, bars, 0)!
    const wrapped = createGuideMelodyStyle(createJazzSwingStyle())
    expect(wrapped.realizeBar(ctx).some((n) => n.voice === 'melody')).toBe(true)

    const muted = createMutedStyle(wrapped).realizeBar(ctx)
    expect(muted.some((n) => n.voice === 'melody')).toBe(false)

    const heard = createMutedStyle(wrapped, {
      bass: true,
      piano: true,
      drums: true,
      melody: true,
    }).realizeBar(ctx)
    expect(heard.some((n) => n.voice === 'melody')).toBe(true)
  })
})
