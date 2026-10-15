import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/autumnPractice'
import {
  MIDI_PPQ,
  chartToMidiBytes,
  encodeVlq,
  midiDownloadFilename,
  midiToDownloadBlob,
  realizeChartMidi,
} from '../../src/midi'
import { createStyleById } from '../../src/style'

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.slice(offset, offset + length))
}

describe('encodeSmf / chartToMidiBytes', () => {
  it('encodes VLQ values used by SMF delta times', () => {
    expect(encodeVlq(0)).toEqual([0])
    expect(encodeVlq(127)).toEqual([127])
    expect(encodeVlq(128)).toEqual([0x81, 0x00])
    expect(encodeVlq(480)).toEqual([0x83, 0x60])
  })

  it('writes a Format-1 SMF with tempo and four tracks', () => {
    const chart = createAutumnPracticeChart()
    const bytes = chartToMidiBytes(chart, createStyleById('jazz-swing'), { tempoBpm: 140 })

    expect(readAscii(bytes, 0, 4)).toBe('MThd')
    // format 1
    expect(bytes[8]).toBe(0)
    expect(bytes[9]).toBe(1)
    // 4 tracks
    expect(bytes[10]).toBe(0)
    expect(bytes[11]).toBe(4)
    // PPQ
    expect((bytes[12]! << 8) | bytes[13]!).toBe(MIDI_PPQ)

    // First track chunk follows the 14-byte header
    expect(readAscii(bytes, 14, 4)).toBe('MTrk')

    // Tempo meta (0xFF 0x51) for 140 BPM → 428571 µs/qn ≈ 0x068A3B
    const joined = Array.from(bytes)
    const tempoIdx = joined.findIndex(
      (_b, i) => joined[i] === 0xff && joined[i + 1] === 0x51 && joined[i + 2] === 0x03,
    )
    expect(tempoIdx).toBeGreaterThan(0)
    const micros =
      (joined[tempoIdx + 3]! << 16) | (joined[tempoIdx + 4]! << 8) | joined[tempoIdx + 5]!
    expect(micros).toBe(Math.round(60_000_000 / 140))
  })

  it('includes note-on events for realized accompaniment', () => {
    const chart = createAutumnPracticeChart()
    const notes = realizeChartMidi(chart, createStyleById('bossa'))
    const bytes = chartToMidiBytes(chart, createStyleById('bossa'))
    // Count channel voice note-ons (status nibble 0x9)
    let noteOns = 0
    for (let i = 0; i < bytes.length; i++) {
      const status = bytes[i]!
      if ((status & 0xf0) === 0x90 && (bytes[i + 2] ?? 0) > 0) {
        noteOns++
      }
    }
    expect(noteOns).toBeGreaterThanOrEqual(notes.length)
  })

  it('builds a MIDI download blob and filename', () => {
    const chart = createAutumnPracticeChart()
    chart.title = 'Blue Room Drill!'
    const bytes = chartToMidiBytes(chart, createStyleById('ballad'))
    const blob = midiToDownloadBlob(bytes)
    expect(blob.type).toBe('audio/midi')
    expect(blob.size).toBe(bytes.byteLength)
    expect(midiDownloadFilename(chart)).toBe('blue-room-drill.mid')
  })
})
