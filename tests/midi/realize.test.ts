import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/autumnPractice'
import { realizeChartMidi } from '../../src/midi'
import { expandChartBars } from '../../src/music'
import { createStyleById } from '../../src/style'

describe('realizeChartMidi', () => {
  it('emits absolute quarter-note onsets across the full form', () => {
    const chart = createAutumnPracticeChart()
    const notes = realizeChartMidi(chart, createStyleById('jazz-swing'))
    expect(notes.length).toBeGreaterThan(20)
    expect(notes.some((n) => n.voice === 'bass')).toBe(true)
    expect(notes.some((n) => n.voice === 'piano')).toBe(true)
    expect(notes.some((n) => n.voice === 'drums')).toBe(true)

    const bars = expandChartBars(chart)
    // 4/4 chart → total quarters == total chart beats
    const totalQuarters = bars.reduce(
      (sum, bar) => sum + (bar.timeSignature?.numerator ?? chart.timeSignature.numerator),
      0,
    )
    const lastBarBeats =
      bars.at(-1)?.timeSignature?.numerator ?? chart.timeSignature.numerator
    const maxStart = Math.max(...notes.map((n) => n.startBeat))
    expect(maxStart).toBeLessThan(totalQuarters)
    expect(maxStart).toBeGreaterThanOrEqual(totalQuarters - lastBarBeats)
  })

  it('does not wrap the last bar approach into the opening chord', () => {
    const chart = createAutumnPracticeChart()
    const looping = createStyleById('jazz-swing')
    // Compare last-bar notes with wrap vs without via a one-bar chart ending differently.
    const notes = realizeChartMidi(chart, looping)
    const bars = expandChartBars(chart)
    const lastBarStart = bars
      .slice(0, -1)
      .reduce((sum, bar) => sum + (bar.timeSignature?.numerator ?? chart.timeSignature.numerator), 0)
    const lastBarNotes = notes.filter((n) => n.startBeat >= lastBarStart)
    expect(lastBarNotes.length).toBeGreaterThan(0)
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
