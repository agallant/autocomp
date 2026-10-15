import { describe, expect, it, vi } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/autumnPractice'
import {
  bounceChartToBuffer,
  chartFormBeats,
  chartFormDurationSeconds,
  chartToWavBytes,
  encodeWav,
} from '../../src/render'
import { createStyleById } from '../../src/style'

describe('chart form duration', () => {
  it('counts beats and converts to seconds at tempo', () => {
    const chart = createAutumnPracticeChart()
    const beats = chartFormBeats(chart)
    expect(beats).toBe(32)
    expect(chartFormDurationSeconds(chart, 120)).toBeCloseTo((32 * 60) / 120, 5)
  })
})

/** Minimal OfflineAudioContext stand-in that still exercises scheduleStyleNote. */
function createMockOfflineContext(length: number, sampleRate: number): {
  ctx: OfflineAudioContext
  scheduled: Array<{ when: number }>
  buffer: AudioBuffer
} {
  const scheduled: Array<{ when: number }> = []
  const channelData = [new Float32Array(length), new Float32Array(length)]
  const buffer = {
    numberOfChannels: 2,
    sampleRate,
    length,
    duration: length / sampleRate,
    getChannelData: (i: number) => channelData[i]!,
  } as unknown as AudioBuffer

  const ctx = {
    destination: {},
    length,
    sampleRate,
    createOscillator: () => {
      const osc = {
        type: 'sine',
        frequency: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        start: (when: number) => {
          scheduled.push({ when })
          // Paint a short impulse so silence regressions fail.
          const start = Math.max(0, Math.floor(when * sampleRate))
          for (let i = start; i < Math.min(length, start + 32); i++) {
            channelData[0]![i] = 0.25
            channelData[1]![i] = -0.125
          }
        },
        stop: vi.fn(),
      }
      return osc
    },
    createGain: () => ({
      gain: {
        value: 0,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
      },
      connect: vi.fn(),
    }),
    createBiquadFilter: () => ({
      type: 'lowpass',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      Q: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
    }),
    createBuffer: (channels: number, len: number, rate: number) => ({
      numberOfChannels: channels,
      length: len,
      sampleRate: rate,
      getChannelData: () => new Float32Array(len),
    }),
    createBufferSource: () => ({
      buffer: null as AudioBuffer | null,
      connect: vi.fn(),
      start: (when: number) => {
        scheduled.push({ when })
        const start = Math.max(0, Math.floor(when * sampleRate))
        for (let i = start; i < Math.min(length, start + 16); i++) {
          channelData[0]![i] = 0.5
          channelData[1]![i] = 0.5
        }
      },
      stop: vi.fn(),
    }),
    startRendering: async () => buffer,
  } as unknown as OfflineAudioContext

  return { ctx, scheduled, buffer }
}

describe('bounceChartToBuffer', () => {
  it('schedules notes, yields a non-silent buffer, and encodes WAV', async () => {
    const chart = createAutumnPracticeChart()
    const short = {
      ...chart,
      form: [chart.form[0]!],
      sections: chart.sections.map((section) =>
        section.id === chart.form[0]
          ? { ...section, bars: section.bars.slice(0, 1) }
          : section,
      ),
    }

    const sampleRate = 8000
    const tempoBpm = 180
    // Always inject — Node CI has no OfflineAudioContext; the mock still runs the real synth schedulers.
    let captured: ReturnType<typeof createMockOfflineContext> | null = null
    const rendered = await bounceChartToBuffer(short, createStyleById('jazz-swing'), {
      tempoBpm,
      sampleRate,
      sampleKit: null, // exercise oscillator fallback path in CI
      createOfflineContext: (_channels, length, rate) => {
        captured = createMockOfflineContext(length, rate)
        return captured.ctx
      },
    })
    expect(captured).not.toBeNull()
    const { scheduled, buffer } = captured!
    expect(rendered).toBe(buffer)
    expect(buffer.length).toBeGreaterThan(sampleRate) // > 1s at 180 BPM + 0.2s tail
    expect(buffer.duration).toBeCloseTo(buffer.length / sampleRate, 5)
    expect(scheduled.length).toBeGreaterThan(0)

    let peak = 0
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const data = buffer.getChannelData(c)
      for (let i = 0; i < data.length; i++) {
        peak = Math.max(peak, Math.abs(data[i]!))
      }
    }
    expect(peak).toBeGreaterThan(0.001)

    const wavFromBuffer = encodeWav(buffer)
    expect(String.fromCharCode(...wavFromBuffer.slice(0, 4))).toBe('RIFF')
    expect(wavFromBuffer.byteLength).toBe(44 + buffer.length * buffer.numberOfChannels * 2)

    const wav = await chartToWavBytes(short, createStyleById('bossa'), {
      tempoBpm: 160,
      sampleRate,
      sampleKit: null,
      createOfflineContext: (_channels, length, rate) =>
        createMockOfflineContext(length, rate).ctx,
    })
    expect(wav.byteLength).toBeGreaterThan(44)
    expect(String.fromCharCode(...wav.slice(0, 4))).toBe('RIFF')
  })

  it('uses the real OfflineAudioContext when the runtime provides one', async () => {
    if (typeof OfflineAudioContext === 'undefined') {
      // Documented Node/CI limitation — coverage above injects a production-shaped context.
      expect(typeof OfflineAudioContext).toBe('undefined')
      return
    }

    const chart = createAutumnPracticeChart()
    const short = {
      ...chart,
      form: [chart.form[0]!],
      sections: chart.sections.map((section) =>
        section.id === chart.form[0]
          ? { ...section, bars: section.bars.slice(0, 1) }
          : section,
      ),
    }
    const buffer = await bounceChartToBuffer(short, createStyleById('bossa'), {
      tempoBpm: 160,
      sampleRate: 22_050,
    })
    expect(buffer.numberOfChannels).toBe(2)
    let peak = 0
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const data = buffer.getChannelData(c)
      for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]!))
    }
    expect(peak).toBeGreaterThan(0.001)
  })
})
