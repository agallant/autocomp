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
  it('locks onto a matching bar and requests a seek', async () => {
    const chart = createAutumnPracticeChart()
    // Autumn practice: Dm7 G7 Cmaj7… — feed G7 chroma
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
    engine.tick()
    expect(seeks.length).toBeGreaterThanOrEqual(1)
    expect(seeks[0]).toBe(2) // G7 is bar 2 (1-based)
    expect(snapshots.some((m) => m.includes('G7'))).toBe(true)
    engine.stop()
  })
})
