import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/autumnPractice'
import { createEditorState } from '../../src/ui/chartEditor'
import { renderEditableBars } from '../../src/ui/chartView'

describe('chartView', () => {
  it('shows NC for silent slots in multi-slot bars', () => {
    const state = createEditorState(createAutumnPracticeChart())
    state.chart.sections[0]!.bars[0] = {
      slots: [
        { chord: null, durationBeats: 2 },
        {
          chord: {
            root: { letter: 'G', accidental: 0 },
            quality: 'dom7',
            extensions: [],
            alterations: [],
            symbol: 'G7',
          },
          durationBeats: 2,
        },
      ],
    }
    const html = renderEditableBars(state)
    expect(html).toContain('NC G7')
  })

  it('escapes quotes in bar aria-label attributes', () => {
    const state = createEditorState(createAutumnPracticeChart())
    state.chart.sections[0]!.bars[0] = {
      slots: [
        {
          chord: {
            root: { letter: 'C', accidental: 0 },
            quality: 'maj',
            extensions: [],
            alterations: [],
            symbol: 'C" onclick="alert(1)',
          },
          durationBeats: 4,
        },
      ],
    }
    const html = renderEditableBars(state)
    expect(html).toContain('aria-label="Bar 1, C&quot; onclick=&quot;alert(1)"')
    expect(html).not.toContain('aria-label="Bar 1, C" onclick')
  })
})
