import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  nearestPitchedSample,
  playbackRateForMidi,
  resetSampleKitForTests,
  sampleAssetUrl,
  scheduleStyleNote,
  setSampleKitForTests,
  type SampleKit,
} from '../../src/audio'
import type { StyleNote } from '../../src/style'

function fakeBuffer(length = 8): AudioBuffer {
  return {
    duration: length / 44100,
    length,
    numberOfChannels: 1,
    sampleRate: 44100,
    getChannelData: () => new Float32Array(length),
  } as unknown as AudioBuffer
}

function createFakeContext() {
  const bufferSource = {
    buffer: null as AudioBuffer | null,
    playbackRate: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }
  const gain = {
    gain: {
      value: 0,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  }
  const ctx = {
    sampleRate: 44100,
    destination: {} as AudioDestinationNode,
    createBufferSource: vi.fn(() => bufferSource as unknown as AudioBufferSourceNode),
    createGain: vi.fn(() => gain as unknown as GainNode),
    createOscillator: vi.fn(() => {
      throw new Error('oscillator fallback should not run when kit is present')
    }),
    createBiquadFilter: vi.fn(),
    createBuffer: vi.fn(),
  }
  return { ctx: ctx as unknown as BaseAudioContext, bufferSource }
}

describe('sample kit helpers', () => {
  afterEach(() => {
    resetSampleKitForTests()
  })

  it('builds sample URLs under the Vite base path', () => {
    expect(sampleAssetUrl('drums/kick.m4a')).toMatch(/samples\/drums\/kick\.m4a$/)
  })

  it('picks the nearest pitched sample and computes playback rate', () => {
    const samples = [
      { midi: 48, buffer: fakeBuffer() },
      { midi: 60, buffer: fakeBuffer() },
    ]
    expect(nearestPitchedSample(samples, 50)?.midi).toBe(48)
    expect(nearestPitchedSample(samples, 58)?.midi).toBe(60)
    expect(playbackRateForMidi(60, 62)).toBeCloseTo(2 ** (2 / 12), 5)
  })

  it('schedules drum and pitched notes from the kit', () => {
    const kick = fakeBuffer(16)
    const bass = fakeBuffer(32)
    const kit: SampleKit = {
      drums: { kick },
      bass: [{ midi: 36, buffer: bass }],
      piano: [],
    }
    setSampleKitForTests(kit)
    const { ctx, bufferSource } = createFakeContext()

    const drum: StyleNote = {
      voice: 'drums',
      midi: 36,
      drum: 'kick',
      startBeat: 0,
      durationBeats: 0.2,
      velocity: 0.8,
    }
    scheduleStyleNote(ctx, drum, 1, 0.5, { kit })
    expect(bufferSource.buffer).toBe(kick)
    expect(bufferSource.start).toHaveBeenCalledWith(1)

    const bassNote: StyleNote = {
      voice: 'bass',
      midi: 38,
      startBeat: 0,
      durationBeats: 1,
      velocity: 0.7,
    }
    const { ctx: ctx2, bufferSource: src2 } = createFakeContext()
    scheduleStyleNote(ctx2, bassNote, 0.25, 0.5, { kit })
    expect(src2.buffer).toBe(bass)
    expect(src2.playbackRate.setValueAtTime).toHaveBeenCalled()
  })
})
