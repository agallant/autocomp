import { describe, expect, it, vi } from 'vitest'
import { FollowEngine, type ChromaVector } from '../../src/listen'
import { createAutumnPracticeChart } from '../../src/data/practiceCharts'

function fakeMic(chroma: ChromaVector) {
  return {
    running: true,
    start: vi.fn(async () => undefined),
    stop: vi.fn(),
    readChroma: () => chroma,
  }
}

describe('FollowEngine', () => {
  it('locks onto a matching bar only after stable frames, then seeks', async () => {
    const chart = createAutumnPracticeChart()
    // G7 tones: G B D F
    const chroma = new Float32Array(12) as ChromaVector
    for (const pc of [7, 11, 2, 5]) chroma[pc] = 0.25

    const seeks: number[] = []
    const snapshots: string[] = []
    let currentBar = 0
    const engine = new FollowEngine({
      getChart: () => chart,
      getCurrentBarIndex: () => currentBar,
      audioContext: {} as AudioContext,
      mic: fakeMic(chroma) as never,
      lockFrames: 2,
      minScore: 0.05,
      intervalMs: 10_000,
      onChange: (s) => snapshots.push(s.message),
      onSeekBar: (bar) => {
        seeks.push(bar)
        currentBar = bar - 1
      },
    })

    await engine.start()
    engine.tick()
    expect(seeks).toEqual([])
    expect(engine.getSnapshot().locked).toBe(false)
    engine.tick()
    expect(seeks).toEqual([2]) // G7 is bar 2 (1-based)
    expect(engine.getSnapshot().locked).toBe(true)
    expect(snapshots.some((m) => m.startsWith('Locked') && m.includes('G7'))).toBe(true)
    engine.stop()
  })

  it('cancels an in-flight mic start when stop() is called', async () => {
    let resolveStart!: () => void
    const startPromise = new Promise<void>((resolve) => {
      resolveStart = resolve
    })
    const stop = vi.fn()
    const mic = {
      running: false,
      start: vi.fn(() => startPromise),
      stop,
      readChroma: () => new Float32Array(12) as ChromaVector,
    }
    const engine = new FollowEngine({
      getChart: () => createAutumnPracticeChart(),
      getCurrentBarIndex: () => 0,
      audioContext: {} as AudioContext,
      mic: mic as never,
      onChange: () => undefined,
    })
    const starting = engine.start()
    engine.stop()
    resolveStart()
    await starting
    expect(stop).toHaveBeenCalled()
    expect(engine.getSnapshot().status).toBe('idle')
  })
})
