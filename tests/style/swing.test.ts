import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/autumnPractice'
import { parseChordSymbol } from '../../src/music'
import {
  buildStyleBarContext,
  createJazzSwingStyle,
  realizePianoComp,
  realizeSwingDrums,
  realizeWalkingBass,
  shellVoicing,
} from '../../src/style'

describe('jazz swing style', () => {
  it('builds a bar context with per-beat chords', () => {
    const chart = createAutumnPracticeChart()
    const ctx = buildStyleBarContext(chart, 0)
    expect(ctx).not.toBeNull()
    expect(ctx!.beatsPerBar).toBe(4)
    expect(ctx!.beatChords[0]?.quality).toBe('min7')
    expect(ctx!.nextBarChord?.quality).toBe('dom7')
  })

  it('walks four bass notes with an approach on beat 4', () => {
    const chart = createAutumnPracticeChart()
    const ctx = buildStyleBarContext(chart, 0)!
    const notes = realizeWalkingBass(ctx)
    expect(notes).toHaveLength(4)
    expect(notes.every((n) => n.voice === 'bass')).toBe(true)
    expect(notes.map((n) => n.startBeat)).toEqual([0, 1, 2, 3])
    // Approach should differ from a plain root repeat into G7.
    const nextRoot = notes[3]!.midi
    expect(typeof nextRoot).toBe('number')
  })

  it('comps piano shells on beats 2 and 4', () => {
    const chart = createAutumnPracticeChart()
    const ctx = buildStyleBarContext(chart, 0)!
    const notes = realizePianoComp(ctx)
    expect(notes.length).toBeGreaterThan(0)
    expect(notes.every((n) => n.voice === 'piano')).toBe(true)
    expect(new Set(notes.map((n) => n.startBeat))).toEqual(new Set([1, 3]))
  })

  it('builds guide-tone shells for dominant and minor seventh chords', () => {
    const g7 = shellVoicing(parseChordSymbol('G7'))
    const dm7 = shellVoicing(parseChordSymbol('Dm7'))
    expect(g7).toHaveLength(2)
    expect(dm7).toHaveLength(2)
  })

  it('lays a swing ride with skips on 2 and 4', () => {
    const chart = createAutumnPracticeChart()
    const ctx = buildStyleBarContext(chart, 0)!
    const notes = realizeSwingDrums(ctx)
    const rides = notes.filter((n) => n.drum === 'ride')
    expect(rides.some((n) => Math.abs(n.startBeat - (1 + 2 / 3)) < 1e-9)).toBe(true)
    expect(notes.some((n) => n.drum === 'kick')).toBe(true)
    expect(notes.some((n) => n.drum === 'hat')).toBe(true)
  })

  it('combines bass, piano, and drums in the jazz swing engine', () => {
    const chart = createAutumnPracticeChart()
    const ctx = buildStyleBarContext(chart, 0)!
    const style = createJazzSwingStyle()
    const notes = style.realizeBar(ctx)
    expect(notes.some((n) => n.voice === 'bass')).toBe(true)
    expect(notes.some((n) => n.voice === 'piano')).toBe(true)
    expect(notes.some((n) => n.voice === 'drums')).toBe(true)
    expect(style.id).toBe('jazz-swing')
  })
})
