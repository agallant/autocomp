import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/autumnPractice'
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
    const first = piano.find((n) => n.startBeat === 0)!
    expect(first.durationBeats).toBeLessThan(2.1)
    expect(first.startBeat + first.durationBeats).toBeLessThanOrEqual(2)
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
