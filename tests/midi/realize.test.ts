import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/autumnPractice'
import { realizeChartMidi } from '../../src/midi'
import { expandChartBars } from '../../src/music'
import { createStyleById } from '../../src/style'

describe('realizeChartMidi', () => {
  it('emits absolute-beat notes across the full form', () => {
    const chart = createAutumnPracticeChart()
    const notes = realizeChartMidi(chart, createStyleById('jazz-swing'))
    expect(notes.length).toBeGreaterThan(20)
    expect(notes.some((n) => n.voice === 'bass')).toBe(true)
    expect(notes.some((n) => n.voice === 'piano')).toBe(true)
    expect(notes.some((n) => n.voice === 'drums')).toBe(true)

    const bars = expandChartBars(chart)
    const totalBeats = bars.reduce(
      (sum, bar) => sum + (bar.timeSignature?.numerator ?? chart.timeSignature.numerator),
      0,
    )
    const maxStart = Math.max(...notes.map((n) => n.startBeat))
    expect(maxStart).toBeLessThan(totalBeats)
    expect(maxStart).toBeGreaterThan(0)
  })

  it('keeps MIDI numbers in the valid 0–127 range', () => {
    const chart = createAutumnPracticeChart()
    for (const id of ['jazz-swing', 'bossa', 'ballad', 'latin'] as const) {
      const notes = realizeChartMidi(chart, createStyleById(id))
      for (const note of notes) {
        expect(note.midi).toBeGreaterThanOrEqual(0)
        expect(note.midi).toBeLessThanOrEqual(127)
        expect(note.durationBeats).toBeGreaterThan(0)
      }
    }
  })
})
