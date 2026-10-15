import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/practiceCharts'
import { realizeChartMidi } from '../../src/midi'
import { chartFormDurationSeconds } from '../../src/render'
import { createJazzSwingStyle } from '../../src/style'
import { countInBeats } from '../../src/variation'

describe('count-in lead-in', () => {
  const chart = createAutumnPracticeChart()

  it('counts one bar of beats from the opening meter', () => {
    expect(countInBeats(chart, 1)).toBe(4)
    expect(countInBeats(chart, 0)).toBe(0)
  })

  it('extends form duration and shifts MIDI note starts', () => {
    const style = createJazzSwingStyle()
    const plain = chartFormDurationSeconds(chart, 120)
    const withLead = chartFormDurationSeconds(chart, 120, 1)
    expect(withLead).toBeCloseTo(plain + 2, 5) // 4 beats at 120 BPM = 2s

    const notes = realizeChartMidi(chart, style, { countInBars: 1 })
    const bare = realizeChartMidi(chart, style)
    expect(notes.length).toBe(bare.length)
    expect(Math.min(...notes.map((n) => n.startBeat))).toBeGreaterThanOrEqual(4)
    expect(Math.min(...bare.map((n) => n.startBeat))).toBeLessThan(1)
  })
})
