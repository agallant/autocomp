import { describe, expect, it, vi } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/autumnPractice'
import {
  bounceChartToBuffer,
  chartFormBeats,
  chartFormDurationSeconds,
  chartToWavBytes,
} from '../../src/render'
import { createStyleById } from '../../src/style'

describe('chart form duration', () => {
  it('counts beats and converts to seconds at tempo', () => {
    const chart = createAutumnPracticeChart()
    const beats = chartFormBeats(chart)
    expect(beats).toBeGreaterThan(0)
    expect(chartFormDurationSeconds(chart, 120)).toBeCloseTo((beats * 60) / 120, 5)
  })
})

describe('bounceChartToBuffer', () => {
  it('schedules notes into OfflineAudioContext and returns a buffer', async () => {
    const chart = createAutumnPracticeChart()
    // Keep the offline render tiny for the test.
    const short = {
      ...chart,
      form: [chart.form[0]!],
      sections: chart.sections.map((section) =>
        section.id === chart.form[0]
          ? { ...section, bars: section.bars.slice(0, 1) }
          : section,
      ),
    }

    if (typeof OfflineAudioContext === 'undefined') {
      // Node/vitest without Web Audio: inject a minimal offline context mock.
      const scheduled: Array<{ when: number }> = []
      const mockBuffer = {
        numberOfChannels: 2,
        sampleRate: 8000,
        length: 800,
        duration: 0.1,
        getChannelData: () => new Float32Array(800),
      } as unknown as AudioBuffer

      const ctx = {
        destination: {},
        sampleRate: 8000,
        createOscillator: () => {
          const osc = {
            type: 'sine',
            frequency: {
              setValueAtTime: vi.fn(),
              exponentialRampToValueAtTime: vi.fn(),
              linearRampToValueAtTime: vi.fn(),
            },
            connect: vi.fn(),
            start: (when: number) => scheduled.push({ when }),
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
        createBuffer: (channels: number, length: number, rate: number) => ({
          numberOfChannels: channels,
          length,
          sampleRate: rate,
          getChannelData: () => new Float32Array(length),
        }),
        createBufferSource: () => ({
          buffer: null as AudioBuffer | null,
          connect: vi.fn(),
          start: (when: number) => scheduled.push({ when }),
          stop: vi.fn(),
        }),
        startRendering: async () => mockBuffer,
      } as unknown as OfflineAudioContext

      const buffer = await bounceChartToBuffer(short, createStyleById('jazz-swing'), {
        tempoBpm: 180,
        sampleRate: 8000,
        createOfflineContext: () => ctx,
      })
      expect(buffer.sampleRate).toBe(8000)
      expect(scheduled.length).toBeGreaterThan(0)
      return
    }

    const buffer = await bounceChartToBuffer(short, createStyleById('bossa'), {
      tempoBpm: 160,
      sampleRate: 22_050,
    })
    expect(buffer.numberOfChannels).toBe(2)
    expect(buffer.sampleRate).toBe(22_050)
    expect(buffer.duration).toBeGreaterThan(0.2)

    // Peak should be non-silent after bounce.
    let peak = 0
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const data = buffer.getChannelData(c)
      for (let i = 0; i < data.length; i++) {
        peak = Math.max(peak, Math.abs(data[i]!))
      }
    }
    expect(peak).toBeGreaterThan(0.001)

    const wav = await chartToWavBytes(short, createStyleById('bossa'), {
      tempoBpm: 160,
      sampleRate: 22_050,
    })
    expect(wav.byteLength).toBeGreaterThan(44)
    expect(String.fromCharCode(...wav.slice(0, 4))).toBe('RIFF')
  })
})
