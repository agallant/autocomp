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

  it('walks four bass notes with a chromatic approach on beat 4', () => {
    const chart = createAutumnPracticeChart()
    const ctx = buildStyleBarContext(chart, 0)!
    const notes = realizeWalkingBass(ctx)
    expect(notes).toHaveLength(4)
    expect(notes.every((n) => n.voice === 'bass')).toBe(true)
    expect(notes.map((n) => n.startBeat)).toEqual([0, 1, 2, 3])
    // Dm7 → G7: approach should be F# (MIDI 42) into G (43), not the G root itself.
    expect(notes[0]!.midi).toBe(38) // D2
    expect(notes[3]!.midi).toBe(42)
    // Mid-bar tones should move (not stick on the root).
    expect(notes[1]!.midi).not.toBe(notes[0]!.midi)
  })

  it('comps piano shells on beats 2 and 4', () => {
    const chart = createAutumnPracticeChart()
    const ctx = buildStyleBarContext(chart, 0)!
    const notes = realizePianoComp(ctx)
    expect(notes.length).toBeGreaterThan(0)
    expect(notes.every((n) => n.voice === 'piano')).toBe(true)
    expect(new Set(notes.map((n) => n.startBeat))).toEqual(new Set([1, 3]))
  })

  it('builds guide-tone shells for dominant, minor seventh, and major triad', () => {
    // G7: B + F ; Dm7: F + C ; Cmaj: E + G
    expect(shellVoicing(parseChordSymbol('G7')).sort((a, b) => a - b)).toEqual([59, 65])
    expect(shellVoicing(parseChordSymbol('Dm7')).sort((a, b) => a - b)).toEqual([60, 65])
    expect(shellVoicing(parseChordSymbol('C')).sort((a, b) => a - b)).toEqual([55, 64])
  })

  it('lays a swing ride with even-eighth skips on both 2 and 4', () => {
    const chart = createAutumnPracticeChart()
    const ctx = buildStyleBarContext(chart, 0)!
    const notes = realizeSwingDrums(ctx)
    const rides = notes.filter((n) => n.drum === 'ride')
    expect(rides.some((n) => Math.abs(n.startBeat - 1.5) < 1e-9)).toBe(true)
    expect(rides.some((n) => Math.abs(n.startBeat - 3.5) < 1e-9)).toBe(true)
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
