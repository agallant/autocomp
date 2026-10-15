import { describe, expect, it, vi } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/autumnPractice'
import { createRhythmLabChart } from '../../src/data/practiceCharts'
import { createEditorState, selectBar } from '../../src/ui/chartEditor'
import {
  chartMetaLine,
  expandBarMeta,
  INITIAL_PLAYHEAD_SCROLL,
  nextPlayheadScroll,
  renderEditableBars,
  syncBarPlayhead,
} from '../../src/ui/chartView'

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
    const selected = html.match(/class="([^"]*)"[^>]*data-index="2"[^>]*>/)
    expect(selected?.[1]).toContain('bar--play-from')
    expect(selected?.[1]).not.toContain('bar--playhead')
    expect(html).toMatch(/data-index="2"[^>]*aria-label="[^"]*play from here"/)
    expect(html).not.toContain('bar--playhead')
  })

  it('marks the sounding bar as playhead while playing', () => {
    const state = selectBar(createEditorState(createAutumnPracticeChart()), 0)
    const html = renderEditableBars(state, { playheadBarIndex: 3 })
    const playhead = html.match(/class="([^"]*)"[^>]*data-index="3"[^>]*>/)
    expect(playhead?.[1]).toContain('bar--playhead')
    expect(html).toMatch(/data-index="3"[^>]*aria-current="true"/)
    const selected = html.match(/class="([^"]*)"[^>]*data-index="0"[^>]*>/)
    expect(selected?.[1]).toContain('bar--play-from')
    expect(selected?.[1]).not.toContain('bar--playhead')
  })

  it('syncBarPlayhead toggles classes without rebuilding markup', () => {
    const makeBar = (index: number) => {
      const classes = new Set<string>(['bar'])
      const attrs = new Map<string, string>()
      const scrollIntoView = vi.fn()
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
        scrollIntoView,
        hasClass: (name: string) => classes.has(name),
        hasAttr: (name: string) => attrs.has(name),
        scrollCalls: scrollIntoView.mock.calls as unknown[][],
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
    expect(barEls[2]!.scrollCalls).toHaveLength(0)

    syncBarPlayhead(barsRoot, {
      selectedBarIndex: 0,
      playheadBarIndex: 2,
      playing: true,
      scrollIntoView: true,
    })
    expect(barEls[2]!.scrollCalls).toEqual([
      [{ block: 'nearest', inline: 'nearest', behavior: 'smooth' }],
    ])

    syncBarPlayhead(barsRoot, {
      selectedBarIndex: 0,
      playheadBarIndex: 1,
      playing: true,
      scrollIntoView: true,
      reduceMotion: true,
    })
    expect(barEls[1]!.scrollCalls).toEqual([
      [{ block: 'nearest', inline: 'nearest', behavior: 'auto' }],
    ])

    syncBarPlayhead(barsRoot, {
      selectedBarIndex: 0,
      playheadBarIndex: 0,
      playing: true,
      scrollIntoView: true,
      centerPlayhead: true,
    })
    expect(barEls[0]!.scrollCalls).toEqual([
      [{ block: 'center', inline: 'center', behavior: 'smooth' }],
    ])

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
    expect(html).toMatch(
      /aria-label="Bar 1, section A, C&quot; onclick=&quot;alert\(1\), play from here"/,
    )
    expect(html).not.toContain('aria-label="Bar 1, C" onclick')
  })

  it('marks section starts for repeated form occurrences', () => {
    const chart = createRhythmLabChart()
    const meta = expandBarMeta(chart)
    expect(meta.filter((m) => m.isSectionStart).map((m) => m.sectionLabel)).toEqual([
      'A',
      'A',
      'B',
      'A',
    ])
    const html = renderEditableBars(createEditorState(chart))
    expect(html).toMatch(/data-index="0"[^>]*data-section="A"/)
    expect(html).toMatch(/data-index="8"[^>]*data-section="A"/)
    expect(html).toMatch(/data-index="16"[^>]*data-section="B"/)
    expect(html).toMatch(/data-index="24"[^>]*data-section="A"/)
    expect(html).toContain('bar__section')
    expect(chartMetaLine(chart)).toContain('Form AABA')
  })

  it('re-arms playhead scroll on beat-1 wrap for a one-bar loop', () => {
    let mem = INITIAL_PLAYHEAD_SCROLL
    let step = nextPlayheadScroll(mem, 3, 1, true)
    expect(step.scroll).toBe(true)
    mem = step.memory
    step = nextPlayheadScroll(mem, 3, 1, true)
    expect(step.scroll).toBe(false)
    mem = step.memory
    step = nextPlayheadScroll(mem, 3, 2, true)
    expect(step.scroll).toBe(false)
    mem = step.memory
    step = nextPlayheadScroll(mem, 3, 1, true)
    expect(step.scroll).toBe(true)
    mem = step.memory
    step = nextPlayheadScroll(mem, 4, 1, true)
    expect(step.scroll).toBe(true)
  })

  it('falls back to section id when the label is empty', () => {
    const state = createEditorState(createAutumnPracticeChart())
    state.chart.sections[0]!.label = ''
    const html = renderEditableBars(state)
    expect(html).toMatch(/data-index="0"[^>]*data-section="A"/)
    expect(html).toMatch(/aria-label="Bar 1, section A,/)
  })
})
