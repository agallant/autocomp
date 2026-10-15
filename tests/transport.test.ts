import { afterEach, describe, expect, it, vi } from 'vitest'
import { TransportController } from '../src/ui/transport'

type FakeOsc = {
  type: OscillatorType
  frequency: { setValueAtTime: ReturnType<typeof vi.fn> }
  connect: ReturnType<typeof vi.fn>
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
}

function createFakeAudioContext(initialState: AudioContextState = 'suspended') {
  let currentTime = 0
  const ctx = {
    get currentTime() {
      return currentTime
    },
    state: initialState,
    sampleRate: 44100,
    destination: {} as AudioDestinationNode,
    resume: vi.fn(async () => {
      ctx.state = 'running'
    }),
    close: vi.fn(async () => undefined),
    createOscillator: vi.fn(() => {
      const osc: FakeOsc = {
        type: 'sine',
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }
      return osc as unknown as OscillatorNode
    }),
    createGain: vi.fn(() => {
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
      return gain as unknown as GainNode
    }),
    createBuffer: vi.fn(
      (channels: number, length: number, rate: number) =>
        ({
          numberOfChannels: channels,
          length,
          sampleRate: rate,
          getChannelData: () => new Float32Array(length),
        }) as unknown as AudioBuffer,
    ),
    createBufferSource: vi.fn(() => {
      const source = {
        buffer: null as AudioBuffer | null,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }
      return source as unknown as AudioBufferSourceNode
    }),
    advance(seconds: number) {
      currentTime += seconds
    },
  }
  return ctx
}

describe('TransportController', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts stopped at bar 1 beat 1', () => {
    const onChange = vi.fn()
    const transport = new TransportController({
      onChange,
      audioContext: createFakeAudioContext() as unknown as AudioContext,
      metronomeEnabled: false,
    })
    expect(transport.getState()).toMatchObject({
      playing: false,
      tempoBpm: 120,
      bar: 1,
      beat: 1,
      audioReady: false,
      styleId: null,
    })
    expect(onChange).toHaveBeenCalledTimes(1)
    transport.dispose()
  })

  it('resumes a suspended AudioContext on play', async () => {
    const ctx = createFakeAudioContext('suspended')
    const transport = new TransportController({
      onChange: () => undefined,
      audioContext: ctx as unknown as AudioContext,
      metronomeEnabled: false,
    })
    await transport.play()
    expect(ctx.resume).toHaveBeenCalledTimes(1)
    expect(ctx.createBufferSource).toHaveBeenCalled()
    expect(ctx.state).toBe('running')
    expect(transport.getState().audioReady).toBe(true)
    transport.dispose()
  })

  it('schedules accented metronome clicks when enabled', async () => {
    vi.useFakeTimers()
    const ctx = createFakeAudioContext('suspended')
    const transport = new TransportController({
      onChange: () => undefined,
      audioContext: ctx as unknown as AudioContext,
      metronomeEnabled: true,
    })

    await transport.play()
    expect(ctx.createOscillator).toHaveBeenCalled()
    const osc = (ctx.createOscillator.mock.results[0]!.value as FakeOsc)
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(1200, expect.any(Number))
    expect(osc.start).toHaveBeenCalled()

    transport.dispose()
  })

  it('advances beats from the audio scheduler while playing', async () => {
    vi.useFakeTimers()
    const ctx = createFakeAudioContext('running')
    const transport = new TransportController({
      onChange: () => undefined,
      audioContext: ctx as unknown as AudioContext,
      metronomeEnabled: false,
      setIntervalFn: (fn, ms) => setInterval(fn, ms) as unknown as ReturnType<typeof setInterval>,
      clearIntervalFn: (id) => clearInterval(id as unknown as number),
      setTimeoutFn: (fn, ms) => setTimeout(fn, ms) as unknown as ReturnType<typeof setTimeout>,
      clearTimeoutFn: (id) => clearTimeout(id as unknown as number),
    })

    await transport.play()
    expect(transport.getState().playing).toBe(true)
    expect(transport.getState().audioReady).toBe(true)

    // Start offset 0.08s; first UI update fires then.
    await vi.advanceTimersByTimeAsync(80)
    expect(transport.getState()).toMatchObject({ bar: 1, beat: 1 })

    // Advance audio clock into the next beat's schedule window and flush timers.
    ctx.advance(0.5)
    await vi.advanceTimersByTimeAsync(25)
    await vi.advanceTimersByTimeAsync(500)
    expect(transport.getState()).toMatchObject({ bar: 1, beat: 2 })

    transport.stop()
    expect(transport.getState()).toMatchObject({ playing: false, bar: 1, beat: 1 })
    transport.dispose()
  })

  it('ignores a play() that was stopped while resuming audio', async () => {
    let resolveResume: (() => void) | undefined
    const ctx = createFakeAudioContext('suspended')
    ctx.resume = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveResume = () => {
            ctx.state = 'running'
            resolve()
          }
        }),
    )

    const transport = new TransportController({
      onChange: () => undefined,
      audioContext: ctx as unknown as AudioContext,
      metronomeEnabled: false,
    })

    const playPromise = transport.play()
    transport.stop()
    resolveResume?.()
    await playPromise
    expect(transport.getState().playing).toBe(false)
    transport.dispose()
  })

  it('clamps tempo into a playable range', () => {
    const transport = new TransportController({
      onChange: () => undefined,
      audioContext: createFakeAudioContext() as unknown as AudioContext,
      metronomeEnabled: false,
    })
    transport.setTempo(10)
    expect(transport.getState().tempoBpm).toBe(40)
    transport.setTempo(999)
    expect(transport.getState().tempoBpm).toBe(300)
    transport.dispose()
  })

  it('keeps bar/beat when tempo changes during playback', async () => {
    vi.useFakeTimers()
    const ctx = createFakeAudioContext('running')
    const transport = new TransportController({
      onChange: () => undefined,
      audioContext: ctx as unknown as AudioContext,
      metronomeEnabled: false,
    })

    await transport.play()
    await vi.advanceTimersByTimeAsync(80)
    ctx.advance(0.5)
    await vi.advanceTimersByTimeAsync(25)
    await vi.advanceTimersByTimeAsync(500)
    expect(transport.getState()).toMatchObject({ bar: 1, beat: 2, playing: true })

    transport.setTempo(60)
    expect(transport.getState()).toMatchObject({
      tempoBpm: 60,
      bar: 1,
      beat: 2,
      playing: true,
    })
    transport.dispose()
  })
})
