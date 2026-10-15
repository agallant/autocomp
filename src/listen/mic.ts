import { chromaFromFrequencyData, zeroChroma } from './chroma'
import type { ChromaVector } from './types'

export type MicCaptureOptions = {
  audioContext: AudioContext
  /** Inject getUserMedia for tests. */
  getUserMedia?: (constraints: MediaStreamConstraints) => Promise<MediaStream>
  fftSize?: number
}

/**
 * Mic → AnalyserNode capture. Feature-detects getUserMedia; caller must invoke
 * `start()` from a user gesture on browsers that require it.
 */
export class MicCapture {
  private readonly ctx: AudioContext
  private readonly getUserMedia: (
    constraints: MediaStreamConstraints,
  ) => Promise<MediaStream>
  private readonly fftSize: number
  private stream: MediaStream | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private analyser: AnalyserNode | null = null
  private freqData: Float32Array | null = null

  constructor(options: MicCaptureOptions) {
    this.ctx = options.audioContext
    this.fftSize = options.fftSize ?? 2048
    const media = globalThis.navigator?.mediaDevices
    this.getUserMedia =
      options.getUserMedia ??
      (media?.getUserMedia
        ? (c) => media.getUserMedia(c)
        : () => Promise.reject(new Error('getUserMedia is not available')))
  }

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
  }

  get running(): boolean {
    return this.analyser !== null
  }

  async start(): Promise<void> {
    if (this.analyser) return
    const stream = await this.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    })
    this.stream = stream
    this.source = this.ctx.createMediaStreamSource(stream)
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = this.fftSize
    this.analyser.smoothingTimeConstant = 0.7
    this.source.connect(this.analyser)
    // Do not connect to destination — avoid mic monitor feedback.
    this.freqData = new Float32Array(this.analyser.frequencyBinCount)
  }

  stop(): void {
    try {
      this.source?.disconnect()
    } catch {
      // ignore
    }
    this.source = null
    this.analyser = null
    this.freqData = null
    if (this.stream) {
      for (const track of this.stream.getTracks()) track.stop()
      this.stream = null
    }
  }

  /** Current chroma snapshot (zeros when not running). */
  readChroma(): ChromaVector {
    if (!this.analyser || !this.freqData) return zeroChroma()
    this.analyser.getFloatFrequencyData(this.freqData as Float32Array<ArrayBuffer>)
    return chromaFromFrequencyData(this.freqData, this.ctx.sampleRate, this.analyser.fftSize)
  }
}
