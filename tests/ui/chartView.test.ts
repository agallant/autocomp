import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/autumnPractice'
import { createEditorState, selectBar } from '../../src/ui/chartEditor'
import { renderEditableBars, syncBarPlayhead } from '../../src/ui/chartView'

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

  it('marks the selected bar as play-from-here when stopped', () => {
    const state = selectBar(createEditorState(createAutumnPracticeChart()), 2)
    const html = renderEditableBars(state)
    expect(html).toContain('bar--play-from')
    expect(html).toContain('play from here')
    expect(html).not.toContain('bar--playhead')
  })

  it('marks the sounding bar as playhead while playing', () => {
    const state = selectBar(createEditorState(createAutumnPracticeChart()), 0)
    const html = renderEditableBars(state, { playheadBarIndex: 3 })
    expect(html).toContain('bar--playhead')
    expect(html).toContain('aria-current="true"')
    // Selection still shows play-from when it is not the playhead.
    expect(html).toContain('bar--play-from')
  })

  it('syncBarPlayhead toggles classes without rebuilding markup', () => {
    const makeBar = (index: number) => {
      const classes = new Set<string>(['bar'])
      const attrs = new Map<string, string>()
      return {
        dataset: { index: String(index) },
        classList: {
          contains: (name: string) => classes.has(name),
          toggle: (name: string, force?: boolean) => {
            const on = force === undefined ? !classes.has(name) : force
            if (on) classes.add(name)
            else classes.delete(name)
            return on
          },
        },
        setAttribute: (name: string, value: string) => {
          attrs.set(name, value)
        },
        removeAttribute: (name: string) => {
          attrs.delete(name)
        },
        hasClass: (name: string) => classes.has(name),
        hasAttr: (name: string) => attrs.has(name),
      }
    }
    const barEls = [0, 1, 2].map(makeBar)
    const barsRoot = {
      querySelectorAll: () => barEls,
    } as unknown as ParentNode

    syncBarPlayhead(barsRoot, {
      selectedBarIndex: 0,
      playheadBarIndex: 2,
      playing: true,
    })
    expect(barEls[2]!.hasClass('bar--playhead')).toBe(true)
    expect(barEls[0]!.hasClass('bar--play-from')).toBe(false)
    expect(barEls[2]!.hasAttr('aria-current')).toBe(true)

    syncBarPlayhead(barsRoot, {
      selectedBarIndex: 1,
      playheadBarIndex: null,
      playing: false,
    })
    expect(barEls[1]!.hasClass('bar--play-from')).toBe(true)
    expect(barEls.every((b) => !b.hasClass('bar--playhead'))).toBe(true)
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
    expect(html).toContain('aria-label="Bar 1, C&quot; onclick=&quot;alert(1), play from here"')
    expect(html).not.toContain('aria-label="Bar 1, C" onclick')
  })
})
