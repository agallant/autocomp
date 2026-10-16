import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  boundClearInterval,
  boundClearTimeout,
  boundSetInterval,
  boundSetTimeout,
  LookaheadScheduler,
} from '../../src/audio'

/**
 * Browser-like stubs: throw Illegal invocation when called without
 * `globalThis` as the receiver (the Chromium/WebKit failure mode).
 */
function installReceiverCheckingTimers(): void {
  const makeStub = (name: string, returnValue: number = 1) =>
    function receiverChecked(this: unknown, ..._args: unknown[]): number {
      if (this !== globalThis) {
        throw new TypeError(`Illegal invocation (${name})`)
      }
      return returnValue
    }

  vi.stubGlobal('setTimeout', makeStub('setTimeout'))
  vi.stubGlobal('clearTimeout', makeStub('clearTimeout', undefined as unknown as number))
  vi.stubGlobal('setInterval', makeStub('setInterval'))
  vi.stubGlobal('clearInterval', makeStub('clearInterval', undefined as unknown as number))
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
    installReceiverCheckingTimers()
    const clock = { currentTime: 0 }
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
    expect(() => scheduler.stop()).not.toThrow()
  })
})
