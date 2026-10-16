import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/autumnPractice'
import { parseChordSymbol } from '../../src/music'
import {
  STYLE_PACK,
  buildStyleBarContext,
  createStyleById,
  getStyleDescriptor,
  isStyleId,
} from '../../src/style'

describe('style pack', () => {
  it('registers jazz swing, bossa, ballad, and latin', () => {
    expect(STYLE_PACK.map((s) => s.id)).toEqual(['jazz-swing', 'bossa', 'ballad', 'latin'])
    expect(isStyleId('bossa')).toBe(true)
    expect(isStyleId('funk')).toBe(false)
  })

  it('declares per-style default swing feels', () => {
    expect(getStyleDescriptor('jazz-swing').defaultSwingFeel).toBe(67)
    expect(getStyleDescriptor('bossa').defaultSwingFeel).toBe(0)
    expect(getStyleDescriptor('latin').defaultSwingFeel).toBe(0)
    expect(getStyleDescriptor('ballad').defaultSwingFeel).toBeGreaterThan(0)
    expect(getStyleDescriptor('ballad').defaultSwingFeel).toBeLessThan(67)
    for (const desc of STYLE_PACK) {
      expect(desc.defaultSwingFeel).toBeGreaterThanOrEqual(0)
      expect(desc.defaultSwingFeel).toBeLessThanOrEqual(100)
    }
  })

  it('realizes distinctive voices for each style', () => {
    const ctx = buildStyleBarContext(createAutumnPracticeChart(), 0)!
    for (const desc of STYLE_PACK) {
      const notes = desc.create().realizeBar(ctx)
      expect(notes.some((n) => n.voice === 'bass'), desc.id).toBe(true)
      expect(notes.some((n) => n.voice === 'piano'), desc.id).toBe(true)
      expect(notes.some((n) => n.voice === 'drums'), desc.id).toBe(true)
    }
  })

  it('bossa places syncopated bass on the and of odd beats', () => {
    const ctx = buildStyleBarContext(createAutumnPracticeChart(), 0)!
    const bass = createStyleById('bossa')
      .realizeBar(ctx)
      .filter((n) => n.voice === 'bass')
    expect(bass.some((n) => Math.abs(n.startBeat - 1.5) < 1e-9)).toBe(true)
  })

  it('ballad ends each piano shell before the next chord hit', () => {
    const ctx = buildStyleBarContext(createAutumnPracticeChart(), 0)!
    const piano = createStyleById('ballad')
      .realizeBar(ctx)
      .filter((n) => n.voice === 'piano')
    for (const note of piano) {
      const nextHit = note.startBeat < 2 ? 2 : ctx.beatsPerBar
      expect(note.startBeat + note.durationBeats).toBeLessThanOrEqual(nextHit)
    }
  })

  it('bossa piano comps end before the next chord slot', () => {
    const chart = createAutumnPracticeChart()
    // Four one-beat slots so a long shell would bleed into the next chord.
    chart.sections[0]!.bars[0] = {
      ...chart.sections[0]!.bars[0]!,
      slots: [
        { chord: parseChordSymbol('Cmaj7'), durationBeats: 1 },
        { chord: parseChordSymbol('Am7'), durationBeats: 1 },
        { chord: parseChordSymbol('Dm7'), durationBeats: 1 },
        { chord: parseChordSymbol('G7'), durationBeats: 1 },
      ],
    }
    const ctx = buildStyleBarContext(chart, 0)!
    const piano = createStyleById('bossa')
      .realizeBar(ctx)
      .filter((n) => n.voice === 'piano')
    expect(piano.length).toBeGreaterThan(0)
    for (const note of piano) {
      const slotBeat = Math.floor(note.startBeat)
      const slotEnd = slotBeat + 1
      expect(note.startBeat + note.durationBeats).toBeLessThanOrEqual(slotEnd)
    }
  })

  it('latin uses clave hits with short hats (not ride wash)', () => {
    const ctx = buildStyleBarContext(createAutumnPracticeChart(), 0)!
    const notes = createStyleById('latin').realizeBar(ctx)
    expect(notes.some((n) => n.drum === 'clave')).toBe(true)
    expect(notes.some((n) => n.drum === 'hat')).toBe(true)
    expect(notes.every((n) => n.drum !== 'ride')).toBe(true)
  })

  it('latin anticipates bass on the and of 2/4', () => {
    const ctx = buildStyleBarContext(createAutumnPracticeChart(), 0)!
    const bass = createStyleById('latin')
      .realizeBar(ctx)
      .filter((n) => n.voice === 'bass')
    expect(bass.some((n) => Math.abs(n.startBeat - 1.5) < 1e-9)).toBe(true)
    expect(bass.some((n) => Math.abs(n.startBeat - 3.5) < 1e-9)).toBe(true)
  })

  it('exposes suggested tempos per style', () => {
    expect(getStyleDescriptor('ballad').suggestedTempoBpm).toBe(70)
    expect(getStyleDescriptor('latin').suggestedTempoBpm).toBe(180)
  })
})
