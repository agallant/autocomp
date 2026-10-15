import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/autumnPractice'
import {
  encodeWavFromChannels,
  wavDownloadFilename,
  wavToDownloadBlob,
} from '../../src/render'

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.slice(offset, offset + length))
}

describe('encodeWavFromChannels', () => {
  it('writes a valid PCM WAV header and interleaved samples', () => {
    const left = new Float32Array([0, 0.5, -0.5, 1])
    const right = new Float32Array([0, -0.25, 0.25, -1])
    const bytes = encodeWavFromChannels([left, right], 44_100)

    expect(readAscii(bytes, 0, 4)).toBe('RIFF')
    expect(readAscii(bytes, 8, 4)).toBe('WAVE')
    expect(readAscii(bytes, 12, 4)).toBe('fmt ')
    expect(readAscii(bytes, 36, 4)).toBe('data')

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    expect(view.getUint16(20, true)).toBe(1) // PCM
    expect(view.getUint16(22, true)).toBe(2) // stereo
    expect(view.getUint32(24, true)).toBe(44_100)
    expect(view.getUint16(34, true)).toBe(16)
    expect(view.getUint32(40, true)).toBe(4 * 2 * 2) // frames * channels * bytes/sample
    expect(bytes.byteLength).toBe(44 + 16)

    // Interleaved int16 PCM payload starting at byte 44.
    expect(view.getInt16(44, true)).toBe(0) // L0
    expect(view.getInt16(46, true)).toBe(0) // R0
    expect(view.getInt16(48, true)).toBe(Math.round(0.5 * 0x7fff)) // L1
    expect(view.getInt16(50, true)).toBe(Math.round(-0.25 * 0x8000)) // R1
    expect(view.getInt16(52, true)).toBe(Math.round(-0.5 * 0x8000)) // L2
    expect(view.getInt16(54, true)).toBe(Math.round(0.25 * 0x7fff)) // R2
    expect(view.getInt16(56, true)).toBe(0x7fff) // L3 clipped +1
    expect(view.getInt16(58, true)).toBe(-0x8000) // R3 clipped -1
  })

  it('builds a download blob and filename', () => {
    const chart = createAutumnPracticeChart()
    chart.title = 'Bounce Test!'
    const bytes = encodeWavFromChannels([new Float32Array(8)], 22_050)
    const blob = wavToDownloadBlob(bytes)
    expect(blob.type).toBe('audio/wav')
    expect(blob.size).toBe(bytes.byteLength)
    expect(wavDownloadFilename(chart)).toBe('bounce-test.wav')
  })
})
