import { afterEach, describe, expect, it, vi } from 'vitest'
import { TransportController } from '../src/ui/transport'

describe('TransportController', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts stopped at bar 1 beat 1', () => {
    const onChange = vi.fn()
    const transport = new TransportController({ onChange })
    expect(transport.getState()).toMatchObject({
      playing: false,
      tempoBpm: 120,
      bar: 1,
      beat: 1,
    })
    expect(onChange).toHaveBeenCalledTimes(1)
    transport.dispose()
  })

  it('advances beats while playing', () => {
    vi.useFakeTimers()
    const transport = new TransportController({ onChange: () => undefined })
    transport.play()
    expect(transport.getState().playing).toBe(true)

    vi.advanceTimersByTime(500) // 120 BPM => 500ms/beat
    expect(transport.getState()).toMatchObject({ bar: 1, beat: 2 })

    vi.advanceTimersByTime(1500)
    expect(transport.getState()).toMatchObject({ bar: 2, beat: 1 })

    transport.stop()
    expect(transport.getState()).toMatchObject({ playing: false, bar: 1, beat: 1 })
    transport.dispose()
  })

  it('clamps tempo into a playable range', () => {
    const transport = new TransportController({ onChange: () => undefined })
    transport.setTempo(10)
    expect(transport.getState().tempoBpm).toBe(40)
    transport.setTempo(999)
    expect(transport.getState().tempoBpm).toBe(300)
    transport.dispose()
  })
})
