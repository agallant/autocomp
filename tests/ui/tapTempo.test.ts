import { describe, expect, it } from 'vitest'
import { createTapTempoState, tapTempo } from '../../src/ui/tapTempo'

describe('tap tempo', () => {
  it('needs two taps before estimating', () => {
    const state = createTapTempoState()
    expect(tapTempo(state, 1000)).toBeNull()
    expect(tapTempo(state, 1500)).toBe(120)
  })

  it('averages a sliding window of intervals', () => {
    const state = createTapTempoState()
    // 500ms intervals → 120 BPM
    expect(tapTempo(state, 0)).toBeNull()
    expect(tapTempo(state, 500)).toBe(120)
    expect(tapTempo(state, 1000)).toBe(120)
    // 500+500+400 → avg 466.7ms → ~129 BPM
    expect(tapTempo(state, 1400)).toBe(129)
  })

  it('resets after a long gap', () => {
    const state = createTapTempoState()
    tapTempo(state, 0)
    tapTempo(state, 500)
    expect(tapTempo(state, 3000)).toBeNull()
    expect(tapTempo(state, 3500)).toBe(120)
  })

  it('clamps to the transport range', () => {
    const state = createTapTempoState()
    // 50ms → 1200 BPM → clamp 300
    tapTempo(state, 0)
    expect(tapTempo(state, 50)).toBe(300)
    const slow = createTapTempoState()
    tapTempo(slow, 0)
    // 2000ms → 30 BPM → clamp 40
    expect(tapTempo(slow, 2000, { resetMs: 5000 })).toBe(40)
  })
})
