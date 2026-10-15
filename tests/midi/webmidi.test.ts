import { describe, expect, it, vi } from 'vitest'
import { createWebMidiSink, isWebMidiSupported } from '../../src/midi'
import type { StyleNote } from '../../src/style'

describe('webmidi helpers', () => {
  it('reports support from navigator.requestMIDIAccess', () => {
    const original = globalThis.navigator
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {},
    })
    expect(isWebMidiSupported()).toBe(false)

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { requestMIDIAccess: vi.fn() },
    })
    expect(isWebMidiSupported()).toBe(true)

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: original,
    })
  })

  it('schedules note on/off and clears pending timers', () => {
    const sent: number[][] = []
    const output = {
      send: (data: number[]) => {
        sent.push([...data])
      },
    } as MIDIOutput

    const timers: Array<{ id: number; fn: () => void; delay: number }> = []
    let nextId = 1
    const sink = createWebMidiSink(output, {
      setTimeoutFn: ((fn: () => void, delay?: number) => {
        const id = nextId++
        timers.push({ id, fn, delay: delay ?? 0 })
        return id as unknown as ReturnType<typeof setTimeout>
      }) as typeof setTimeout,
      clearTimeoutFn: ((id: ReturnType<typeof setTimeout>) => {
        const idx = timers.findIndex((t) => t.id === (id as unknown as number))
        if (idx >= 0) timers.splice(idx, 1)
      }) as typeof clearTimeout,
    })

    const note: StyleNote = {
      voice: 'bass',
      midi: 36,
      startBeat: 0,
      durationBeats: 1,
      velocity: 0.5,
    }
    sink.scheduleNote(note, 1.0, 0.5, 0.5)

    // Program changes fire immediately; note timers are pending.
    expect(sent.some((msg) => (msg[0]! & 0xf0) === 0xc0)).toBe(true)
    expect(timers.length).toBe(2)

    // Fire note-on (callback also drops it from the sink's pending set)
    const noteOn = timers.shift()!
    noteOn.fn()
    expect(sent.some((msg) => msg[0] === 0x90 && msg[1] === 36 && msg[2] === 64)).toBe(true)
    expect(timers.length).toBe(1)

    sink.clear()
    expect(timers.length).toBe(0)
    expect(sent.some((msg) => msg[0] === 0xb0 && msg[1] === 123)).toBe(true)
  })
})
