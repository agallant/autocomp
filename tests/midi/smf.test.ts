import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/autumnPractice'
import {
  MIDI_PPQ,
  chartToMidiBytes,
  encodeSmf,
  encodeVlq,
  midiDownloadFilename,
  midiToDownloadBlob,
  realizeChartMidi,
} from '../../src/midi'
import { createStyleById } from '../../src/style'

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.slice(offset, offset + length))
}

/** Count Note On events (status 0x9n, velocity > 0) by walking SMF track chunks. */
function countNoteOns(bytes: Uint8Array): number {
  let offset = 14 // skip MThd
  let noteOns = 0
  while (offset + 8 <= bytes.length) {
    const tag = readAscii(bytes, offset, 4)
    if (tag !== 'MTrk') break
    const length =
      (bytes[offset + 4]! << 24) |
      (bytes[offset + 5]! << 16) |
      (bytes[offset + 6]! << 8) |
      bytes[offset + 7]!
    const start = offset + 8
    const end = start + length
    let i = start
    let running = 0
    while (i < end) {
      // delta time VLQ
      while (i < end && bytes[i]! & 0x80) i++
      i++
      if (i >= end) break
      let status = bytes[i]!
      if (status < 0x80) {
        status = running
      } else {
        running = status
        i++
      }
      const type = status & 0xf0
      if (type === 0x90) {
        const vel = bytes[i + 1] ?? 0
        if (vel > 0) noteOns++
        i += 2
      } else if (type === 0x80 || type === 0xa0 || type === 0xb0 || type === 0xe0) {
        i += 2
      } else if (type === 0xc0 || type === 0xd0) {
        i += 1
      } else if (status === 0xff) {
        const len = bytes[i + 1] ?? 0
        i += 2 + len
      } else if (status === 0xf0 || status === 0xf7) {
        const len = bytes[i]!
        i += 1 + len
      } else {
        break
      }
    }
    offset = end
  }
  return noteOns
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
    expect(bytes[8]).toBe(0)
    expect(bytes[9]).toBe(1)
    expect(bytes[10]).toBe(0)
    expect(bytes[11]).toBe(4)
    expect((bytes[12]! << 8) | bytes[13]!).toBe(MIDI_PPQ)
    expect(readAscii(bytes, 14, 4)).toBe('MTrk')

    const joined = Array.from(bytes)
    const tempoIdx = joined.findIndex(
      (_b, i) => joined[i] === 0xff && joined[i + 1] === 0x51 && joined[i + 2] === 0x03,
    )
    expect(tempoIdx).toBeGreaterThan(0)
    const micros =
      (joined[tempoIdx + 3]! << 16) | (joined[tempoIdx + 4]! << 8) | joined[tempoIdx + 5]!
    // 4/4 ⇒ chart beat == quarter note
    expect(micros).toBe(Math.round(60_000_000 / 140))
  })

  it('includes exactly one note-on per realized sounding note', () => {
    const chart = createAutumnPracticeChart()
    const notes = realizeChartMidi(chart, createStyleById('bossa')).filter((n) => n.velocity > 0)
    const bytes = chartToMidiBytes(chart, createStyleById('bossa'))
    expect(countNoteOns(bytes)).toBe(notes.length)
  })

  it('rejects invalid PPQ and unsupported meters', () => {
    const chart = createAutumnPracticeChart()
    const notes = realizeChartMidi(chart, createStyleById('ballad'))
    expect(() => encodeSmf(chart, notes, { ppq: 0 })).toThrow(/PPQ/)
    expect(() => encodeSmf(chart, notes, { ppq: 32768 })).toThrow(/PPQ/)
    const badDenom = {
      ...chart,
      timeSignature: { numerator: 4, denominator: 3 },
    }
    expect(() => encodeSmf(badDenom, notes)).toThrow(/power of two/)
    const badNum = {
      ...chart,
      timeSignature: { numerator: 300, denominator: 4 },
    }
    expect(() => encodeSmf(badNum, notes)).toThrow(/numerator/)
  })

  it('preserves non-ASCII titles as UTF-8 in track metadata', () => {
    const chart = { ...createAutumnPracticeChart(), title: 'Café' }
    const bytes = chartToMidiBytes(chart, createStyleById('ballad'))
    const cafe = new TextEncoder().encode('Café')
    const haystack = Array.from(bytes)
    const needle = Array.from(cafe)
    const found = haystack.some((_, i) => needle.every((b, j) => haystack[i + j] === b))
    expect(found).toBe(true)
  })

  it('truncates long titles on code-point boundaries without splitting surrogates', () => {
    const chart = {
      ...createAutumnPracticeChart(),
      title: `${'A'.repeat(61)}😀`,
    }
    const bytes = chartToMidiBytes(chart, createStyleById('ballad'))
    // 61 ASCII + 4-byte emoji = 65 > 64, so drop the emoji entirely.
    const expected = new TextEncoder().encode('A'.repeat(61))
    const haystack = Array.from(bytes)
    const needle = Array.from(expected)
    expect(haystack.some((_, i) => needle.every((b, j) => haystack[i + j] === b))).toBe(true)
    // Replacement character must not appear (would indicate a split surrogate).
    const fffd = new TextEncoder().encode('\uFFFD')
    expect(
      haystack.some((_, i) => fffd.every((b, j) => haystack[i + j] === b)),
    ).toBe(false)
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
