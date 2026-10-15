import { describe, expect, it, vi } from 'vitest'
import { scheduleStyleNote } from '../../src/audio/synth'
import { midiToFrequency } from '../../src/style/midi'
import type { StyleNote } from '../../src/style'

function createFakeContext() {
  const osc = {
    type: 'sine' as OscillatorType,
    frequency: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }
  const gain = {
    gain: {
      value: 0,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  }
  const filter = {
    type: 'lowpass' as BiquadFilterType,
    frequency: { value: 0, setValueAtTime: vi.fn() },
    connect: vi.fn(),
  }
  let lastBuffer: Float32Array | null = null
  const bufferSource = {
    buffer: null as AudioBuffer | null,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }
  const ctx = {
    sampleRate: 44100,
    destination: {} as AudioDestinationNode,
    createOscillator: vi.fn(() => osc as unknown as OscillatorNode),
    createGain: vi.fn(() => gain as unknown as GainNode),
    createBiquadFilter: vi.fn(() => filter as unknown as BiquadFilterNode),
    createBuffer: vi.fn((channels: number, length: number, rate: number) => {
      const data = new Float32Array(length)
      lastBuffer = data
      return {
        numberOfChannels: channels,
        length,
        sampleRate: rate,
        getChannelData: () => data,
      } as unknown as AudioBuffer
    }),
    createBufferSource: vi.fn(() => bufferSource as unknown as AudioBufferSourceNode),
    getLastBuffer: () => lastBuffer,
  }
  return { ctx: ctx as unknown as BaseAudioContext & { getLastBuffer: () => Float32Array | null }, osc, bufferSource }
}

describe('scheduleStyleNote', () => {
  it('schedules a bass note at the MIDI frequency', () => {
    const { ctx, osc } = createFakeContext()
    const note: StyleNote = {
      voice: 'bass',
      midi: 40,
      startBeat: 0,
      durationBeats: 1,
      velocity: 0.7,
    }
    const sources = scheduleStyleNote(ctx, note, 1, 0.5)
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(midiToFrequency(40), 1)
    expect(osc.start).toHaveBeenCalledWith(1)
    expect(sources).toHaveLength(1)
  })

  it('skips zero-velocity notes', () => {
    const { ctx, osc } = createFakeContext()
    const note: StyleNote = {
      voice: 'bass',
      midi: 40,
      startBeat: 0,
      durationBeats: 1,
      velocity: 0,
    }
    expect(scheduleStyleNote(ctx, note, 0, 0.5)).toEqual([])
    expect(osc.start).not.toHaveBeenCalled()
  })

  it('schedules a drum hit with a nonzero noise buffer', () => {
    const { ctx, bufferSource } = createFakeContext()
    const note: StyleNote = {
      voice: 'drums',
      midi: 51,
      drum: 'ride',
      startBeat: 0,
      durationBeats: 0.2,
      velocity: 0.5,
    }
    scheduleStyleNote(ctx, note, 0.5, 0.5)
    expect(bufferSource.start).toHaveBeenCalledWith(0.5)
    const data = ctx.getLastBuffer()
    expect(data).not.toBeNull()
    expect(data!.some((sample) => sample !== 0)).toBe(true)
  })
})
