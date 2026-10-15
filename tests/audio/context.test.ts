import { afterEach, describe, expect, it, vi } from 'vitest'
import { resetAudioContextForTests, unlockAudioContext } from '../../src/audio/context'

function createUnlockContext(initialState: AudioContextState = 'suspended') {
  const source = {
    buffer: null as AudioBuffer | null,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }
  const ctx = {
    state: initialState,
    sampleRate: 44100,
    destination: {} as AudioDestinationNode,
    resume: vi.fn(async () => {
      ctx.state = 'running'
    }),
    createBuffer: vi.fn(
      () =>
        ({
          numberOfChannels: 1,
          length: 1,
          sampleRate: 44100,
          getChannelData: () => new Float32Array(1),
        }) as unknown as AudioBuffer,
    ),
    createBufferSource: vi.fn(() => source as unknown as AudioBufferSourceNode),
  }
  return { ctx: ctx as unknown as AudioContext, source, raw: ctx }
}

describe('unlockAudioContext', () => {
  afterEach(() => {
    resetAudioContextForTests()
  })

  it('resumes and plays a silent buffer to unlock WebKit audio', async () => {
    const { ctx, source, raw } = createUnlockContext('suspended')
    await unlockAudioContext(ctx)
    expect(raw.resume).toHaveBeenCalledTimes(1)
    expect(raw.createBufferSource).toHaveBeenCalled()
    expect(source.start).toHaveBeenCalledWith(0)
    expect(raw.state).toBe('running')
  })

  it('throws when the context cannot reach running', async () => {
    const { ctx, raw } = createUnlockContext('suspended')
    raw.resume = vi.fn(async () => {
      raw.state = 'suspended'
    })
    await expect(unlockAudioContext(ctx)).rejects.toThrow(/failed to unlock/)
  })
})
