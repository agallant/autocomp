import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  boundClearInterval,
  boundClearTimeout,
  boundSetInterval,
  boundSetTimeout,
  LookaheadScheduler,
} from '../../src/audio'

describe('bound timer helpers', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('can be invoked as detached references (no Illegal invocation)', () => {
    vi.useFakeTimers()
    const setTimeoutFn = boundSetTimeout
    const clearTimeoutFn = boundClearTimeout
    const setIntervalFn = boundSetInterval
    const clearIntervalFn = boundClearInterval

    const timeoutId = setTimeoutFn(() => undefined, 10)
    clearTimeoutFn(timeoutId)
    const intervalId = setIntervalFn(() => undefined, 10)
    clearIntervalFn(intervalId)
  })

  it('lets LookaheadScheduler.start with default timers', () => {
    vi.useFakeTimers()
    let time = 0
    const clock = {
      get currentTime() {
        return time
      },
    }
    const scheduled: number[] = []
    const scheduler = new LookaheadScheduler({
      clock,
      getTempoBpm: () => 120,
      getBeatsPerBar: () => 4,
      scheduleAheadTime: 0.1,
      lookaheadMs: 25,
      onSchedule: (beat) => scheduled.push(beat.beat),
    })

    expect(() => scheduler.start(0)).not.toThrow()
    expect(scheduled).toEqual([1])
    time = 0.5
    vi.advanceTimersByTime(25)
    expect(scheduled.length).toBeGreaterThan(1)
    scheduler.stop()
  })
})
