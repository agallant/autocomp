import { describe, expect, it, vi } from 'vitest'
import { clampClickLevel, scheduleMetronomeClick } from '../../src/audio/metronome'

function createFakeContext() {
  const osc = {
    type: 'sine' as OscillatorType,
    frequency: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }
  const gain = {
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  }
  const ctx = {
    destination: {} as AudioDestinationNode,
    createOscillator: vi.fn(() => osc as unknown as OscillatorNode),
    createGain: vi.fn(() => gain as unknown as GainNode),
  }
  return { ctx: ctx as unknown as BaseAudioContext, osc, gain }
}

describe('scheduleMetronomeClick', () => {
  it('schedules an accented downbeat click', () => {
    const { ctx, osc, gain } = createFakeContext()
    scheduleMetronomeClick(ctx, 1.25, true)
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(1200, 1.25)
    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.28, 1.252)
    expect(osc.start).toHaveBeenCalledWith(1.25)
    expect(osc.stop).toHaveBeenCalled()
  })

  it('uses a lower pitch for off-beats', () => {
    const { ctx, osc } = createFakeContext()
    scheduleMetronomeClick(ctx, 0, false)
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(900, 0)
  })

  it('scales peak gain by click level', () => {
    const { ctx, gain } = createFakeContext()
    scheduleMetronomeClick(ctx, 1, true, 0.5)
    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.14, 1.002)
  })

  it('schedules nothing at zero click level', () => {
    const { ctx, osc } = createFakeContext()
    expect(scheduleMetronomeClick(ctx, 0, true, 0)).toBeNull()
    expect(osc.start).not.toHaveBeenCalled()
  })

  it('clamps click level to 0–1', () => {
    expect(clampClickLevel(-1)).toBe(0)
    expect(clampClickLevel(2)).toBe(1)
    expect(clampClickLevel(Number.NaN)).toBe(1)
  })
})
