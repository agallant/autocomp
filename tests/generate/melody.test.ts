import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/practiceCharts'
import {
  GUIDE_MELODY_CENTER,
  chartBeatsPerQuarter,
  guideTonePcs,
  nearestGuideMidi,
  pickGuideMidi,
  preferredGuidePcs,
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
    const g7 = preferredGuidePcs(parseChordSymbol('G7'))
    const dm7 = preferredGuidePcs(parseChordSymbol('Dm7'))
    // G7: B(11) + F(5); Dm7: F(5) + C(0)
    expect(g7.slice(0, 2).sort((a, b) => a - b)).toEqual([5, 11])
    expect(dm7.slice(0, 2).sort((a, b) => a - b)).toEqual([0, 5])
  })

  it('picks guide tones over the root even when the root is nearer', () => {
    // Cmaj7 at C5 (72): root is exact, but E/B guides should win.
    const midi = pickGuideMidi(parseChordSymbol('Cmaj7'), 72)
    expect(midi).not.toBe(72)
    expect([64, 71, 76, 83]).toContain(midi)
  })

  it('picks the nearest MIDI for smooth voice leading among a pool', () => {
    expect(nearestGuideMidi([0, 4, 7] as const, 60)).toBe(60) // C4
    expect(nearestGuideMidi([11, 5] as const, 71)).toBe(71) // B4 from G7 guides
  })

  it('steps by quarter-note pulse (one chart beat in 4/4)', () => {
    expect(chartBeatsPerQuarter(4)).toBe(1)
    expect(chartBeatsPerQuarter(8)).toBe(2)
    const chart = createAutumnPracticeChart()
    const bars = expandChartBars(chart)
    const ctx = buildStyleBarContextFromBars(chart, bars, 0)!
    const notes = realizeGuideMelody(ctx)
    expect(notes).toHaveLength(ctx.beatsPerBar)
    expect(notes.every((n) => n.voice === 'melody')).toBe(true)
    expect(notes.map((n) => n.startBeat)).toEqual(
      Array.from({ length: ctx.beatsPerBar }, (_, beat) => beat),
    )
    expect(notes[0]!.midi).toBeGreaterThan(GUIDE_MELODY_CENTER - 12)
    expect(notes[0]!.midi).toBeLessThan(GUIDE_MELODY_CENTER + 12)
  })

  it('emits a quarter-note pulse in 6/8 (three notes, not six)', () => {
    const chart = structuredClone(createAutumnPracticeChart())
    chart.timeSignature = { numerator: 6, denominator: 8 }
    for (const section of chart.sections) {
      for (const bar of section.bars) {
        bar.slots = [{ chord: bar.slots[0]?.chord ?? parseChordSymbol('Cmaj7'), durationBeats: 6 }]
      }
    }
    const bars = expandChartBars(chart)
    const ctx = buildStyleBarContextFromBars(chart, bars, 0)!
    expect(ctx.beatsPerBar).toBe(6)
    const notes = realizeGuideMelody(ctx)
    expect(notes).toHaveLength(3)
    expect(notes.map((n) => n.startBeat)).toEqual([0, 2, 4])
  })

  it('caches per bar so repeated realizeBar calls do not jump voice leading', () => {
    const chart = createAutumnPracticeChart()
    const bars = expandChartBars(chart)
    const ctx0 = buildStyleBarContextFromBars(chart, bars, 0)!
    const ctx1 = buildStyleBarContextFromBars(chart, bars, 1)!
    const wrapped = createGuideMelodyStyle(createJazzSwingStyle())
    const first = wrapped.realizeBar(ctx0).filter((n) => n.voice === 'melody')
    const again = wrapped.realizeBar(ctx0).filter((n) => n.voice === 'melody')
    expect(again).toEqual(first)
    const next = wrapped.realizeBar(ctx1).filter((n) => n.voice === 'melody')
    expect(next[0]!.midi).toBeDefined()
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

  it('lists guide tones before other chord tones', () => {
    expect(guideTonePcs(parseChordSymbol('G7'))[0]).toBe(11) // B first among guides
  })
})
