import { describe, expect, it, vi } from 'vitest'
import { LookaheadScheduler, secondsPerBeat } from '../../src/audio/scheduler'
import type { ScheduledBeat } from '../../src/audio/types'

class FakeClock {
  currentTime = 0
}

describe('LookaheadScheduler', () => {
  it('schedules beats ahead of the audio clock', () => {
    const clock = new FakeClock()
    const scheduled: ScheduledBeat[] = []
    const scheduler = new LookaheadScheduler({
      clock,
      getTempoBpm: () => 120, // 0.5s/beat
      getBeatsPerBar: () => 4,
      scheduleAheadTime: 0.1,
      lookaheadMs: 25,
      setIntervalFn: vi.fn(() => 1 as unknown as ReturnType<typeof setInterval>),
      clearIntervalFn: vi.fn(),
      onSchedule: (beat) => scheduled.push(beat),
    })

    scheduler.start(0)
    // At t=0 with 0.1s ahead and 0.5s/beat → only the first beat is inside the horizon.
    expect(scheduled).toHaveLength(1)
    expect(scheduled[0]).toMatchObject({ time: 0, bar: 1, beat: 1, accent: true })

    clock.currentTime = 0.45
    scheduler.tick()
    expect(scheduled).toHaveLength(2)
    expect(scheduled[1]).toMatchObject({ time: 0.5, bar: 1, beat: 2, accent: false })

    clock.currentTime = 1.95
    scheduler.tick()
    expect(scheduled.at(-1)).toMatchObject({ bar: 2, beat: 1, accent: true })
    scheduler.stop()
    expect(scheduler.isRunning()).toBe(false)
  })

  it('uses beats-per-bar when wrapping', () => {
    const clock = new FakeClock()
    const scheduled: ScheduledBeat[] = []
    const scheduler = new LookaheadScheduler({
      clock,
      getTempoBpm: () => 60, // 1s/beat
      getBeatsPerBar: () => 3,
      scheduleAheadTime: 3.1,
      setIntervalFn: vi.fn(() => 1 as unknown as ReturnType<typeof setInterval>),
      clearIntervalFn: vi.fn(),
      onSchedule: (beat) => scheduled.push(beat),
    })
    scheduler.start(0)
    expect(scheduled.map((b) => `${b.bar}.${b.beat}`)).toEqual([
      '1.1',
      '1.2',
      '1.3',
      '2.1',
    ])
    scheduler.stop()
  })

  it('picks up tempo changes on the next advance', () => {
    const clock = new FakeClock()
    let tempo = 120
    const scheduled: ScheduledBeat[] = []
    const scheduler = new LookaheadScheduler({
      clock,
      getTempoBpm: () => tempo,
      getBeatsPerBar: () => 4,
      scheduleAheadTime: 0.1,
      setIntervalFn: vi.fn(() => 1 as unknown as ReturnType<typeof setInterval>),
      clearIntervalFn: vi.fn(),
      onSchedule: (beat) => scheduled.push(beat),
    })
    scheduler.start(0)
    expect(scheduled[0]!.time).toBe(0)

    // Gap to beat 2 was already committed at 120 BPM when beat 1 advanced.
    tempo = 60
    clock.currentTime = 0.45
    scheduler.tick()
    expect(scheduled[1]!.time).toBe(0.5)

    // After scheduling beat 2, advance uses 60 BPM → beat 3 at 1.5.
    clock.currentTime = 1.45
    scheduler.tick()
    expect(scheduled[2]!.time).toBe(1.5)
    scheduler.stop()
  })

  it('skips elapsed beats after a stall without scheduling late clicks', () => {
    const clock = new FakeClock()
    const scheduled: ScheduledBeat[] = []
    const scheduler = new LookaheadScheduler({
      clock,
      getTempoBpm: () => 120,
      getBeatsPerBar: () => 4,
      scheduleAheadTime: 0.1,
      setIntervalFn: vi.fn(() => 1 as unknown as ReturnType<typeof setInterval>),
      clearIntervalFn: vi.fn(),
      onSchedule: (beat) => scheduled.push(beat),
    })
    scheduler.start(0)
    expect(scheduled).toHaveLength(1)

    // Jump far ahead as if the tab was backgrounded.
    const before = scheduled.length
    clock.currentTime = 2.0
    scheduler.tick()
    const afterStall = scheduled.slice(before)
    expect(afterStall.length).toBeGreaterThan(0)
    expect(afterStall.every((b) => b.time >= 2.0 - 1e-9)).toBe(true)
    expect(scheduled.at(-1)).toMatchObject({ bar: 2, beat: 1 })
    scheduler.stop()
  })
})

describe('secondsPerBeat', () => {
  it('converts tempo to seconds', () => {
    expect(secondsPerBeat(120)).toBe(0.5)
    expect(secondsPerBeat(60)).toBe(1)
  })
})
