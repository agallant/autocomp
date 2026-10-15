export type TransportState = {
  playing: boolean
  tempoBpm: number
  bar: number
  beat: number
}

export type TransportCallbacks = {
  onChange: (state: TransportState) => void
}

/**
 * Lightweight transport stub for M0.
 * Real scheduling arrives with the audio engine milestone.
 */
export class TransportController {
  private state: TransportState = {
    playing: false,
    tempoBpm: 120,
    bar: 1,
    beat: 1,
  }

  private timer: ReturnType<typeof setInterval> | null = null
  private readonly callbacks: TransportCallbacks

  constructor(callbacks: TransportCallbacks) {
    this.callbacks = callbacks
    this.callbacks.onChange(this.getState())
  }

  getState(): TransportState {
    return { ...this.state }
  }

  toggle(): void {
    if (this.state.playing) {
      this.stop()
    } else {
      this.play()
    }
  }

  play(): void {
    if (this.state.playing) return
    this.state = { ...this.state, playing: true, bar: 1, beat: 1 }
    this.emit()
    this.startTimer()
  }

  stop(): void {
    this.clearTimer()
    this.state = { ...this.state, playing: false, bar: 1, beat: 1 }
    this.emit()
  }

  setTempo(tempoBpm: number): void {
    const clamped = Math.min(300, Math.max(40, Math.round(tempoBpm)))
    this.state = { ...this.state, tempoBpm: clamped }
    if (this.state.playing) {
      // Reschedule at the new interval without resetting bar/beat.
      this.startTimer()
    }
    this.emit()
  }

  dispose(): void {
    this.stop()
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private startTimer(): void {
    this.clearTimer()
    const msPerBeat = 60_000 / this.state.tempoBpm
    this.timer = setInterval(() => {
      let { beat, bar } = this.state
      beat += 1
      if (beat > 4) {
        beat = 1
        bar += 1
      }
      this.state = { ...this.state, beat, bar }
      this.emit()
    }, msPerBeat)
  }

  private emit(): void {
    this.callbacks.onChange(this.getState())
  }
}
