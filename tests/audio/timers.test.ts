import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  boundClearInterval,
  boundClearTimeout,
  boundSetInterval,
  boundSetTimeout,
  LookaheadScheduler,
} from '../../src/audio'

type TimerHandler = (...args: unknown[]) => void

/**
 * Browser-like stubs: throw Illegal invocation when called without
 * `globalThis` as the receiver (the Chromium/WebKit failure mode).
 * Captures the latest setInterval callback so tests can drive ticks.
 */
function installReceiverCheckingTimers(): {
  lastIntervalHandler: () => TimerHandler | null
} {
  let intervalHandler: TimerHandler | null = null

  const makeClearStub = (name: string) =>
    function receiverChecked(this: unknown, ..._args: unknown[]): void {
      if (this !== globalThis) {
        throw new TypeError(`Illegal invocation (${name})`)
      }
    }

  const setTimeoutStub = function receiverChecked(
    this: unknown,
    ..._args: unknown[]
  ): number {
    if (this !== globalThis) {
      throw new TypeError('Illegal invocation (setTimeout)')
    }
    return 1
  }

  const setIntervalStub = function receiverChecked(
    this: unknown,
    handler: TimerHandler,
    ..._rest: unknown[]
  ): number {
    if (this !== globalThis) {
      throw new TypeError('Illegal invocation (setInterval)')
    }
    intervalHandler = handler
    return 1
  }

  vi.stubGlobal('setTimeout', setTimeoutStub)
  vi.stubGlobal('clearTimeout', makeClearStub('clearTimeout'))
  vi.stubGlobal('setInterval', setIntervalStub)
  vi.stubGlobal('clearInterval', makeClearStub('clearInterval'))

  return {
    lastIntervalHandler: () => intervalHandler,
  }
}

describe('bound timer helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects detached timer calls but accepts bound wrappers', () => {
    installReceiverCheckingTimers()

    const detachedInterval = globalThis.setInterval
    expect(() => detachedInterval(() => undefined, 10)).toThrow(/Illegal invocation/)

    const detachedTimeout = globalThis.setTimeout
    expect(() => detachedTimeout(() => undefined, 10)).toThrow(/Illegal invocation/)

    expect(() => {
      const intervalId = boundSetInterval(() => undefined, 10)
      boundClearInterval(intervalId)
      const timeoutId = boundSetTimeout(() => undefined, 10)
      boundClearTimeout(timeoutId)
    }).not.toThrow()
  })

  it('lets LookaheadScheduler.start with default (bound) timers', () => {
    const timers = installReceiverCheckingTimers()
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

    const handler = timers.lastIntervalHandler()
    expect(handler).not.toBeNull()
    time = 0.5
    handler!()
    expect(scheduled.length).toBeGreaterThan(1)

    expect(() => scheduler.stop()).not.toThrow()
  })
})
