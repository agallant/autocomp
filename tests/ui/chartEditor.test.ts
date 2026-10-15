import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/autumnPractice'
import {
  assertValidChart,
  barFromSymbols,
  chartBarSymbols,
  expandChartBars,
  sectionFromBarSymbols,
  type Chart,
} from '../../src/music'
import {
  addBarAfterSelection,
  addSection,
  beginEdit,
  commitEdit,
  createEditorState,
  formDraftString,
  moveSelection,
  removeSelectedBar,
  removeSelectedSection,
  renameSelectedSection,
  selectBar,
  selectedSectionId,
  selectedSectionLabel,
  setDraftSymbol,
  setFormOrder,
  setTitle,
} from '../../src/ui/chartEditor'

describe('chartEditor', () => {
  it('selects and navigates bars', () => {
    let state = createEditorState(createAutumnPracticeChart())
    expect(state.selectedBarIndex).toBe(0)
    state = moveSelection(state, 2)
    expect(state.selectedBarIndex).toBe(2)
    state = selectBar(state, 99)
    expect(state.selectedBarIndex).toBe(7)
  })

  it('commits a valid chord edit', () => {
    let state = createEditorState(createAutumnPracticeChart())
    state = beginEdit(state)
    state = setDraftSymbol(state, 'Em7')
    state = commitEdit(state)
    expect(state.editing).toBe(false)
    expect(state.error).toBeNull()
    expect(chartBarSymbols(state.chart)[0]).toBe('Em7')
  })

  it('commits space-separated symbols as equal-duration slots', () => {
    let state = createEditorState(createAutumnPracticeChart())
    state = beginEdit(state)
    state = setDraftSymbol(state, 'Dm7 G7')
    state = commitEdit(state)
    expect(state.error).toBeNull()
    expect(chartBarSymbols(state.chart)[0]).toBe('Dm7 G7')
    const bar = expandChartBars(state.chart)[0]!
    expect(bar.slots).toHaveLength(2)
    expect(bar.slots.map((s) => s.durationBeats)).toEqual([2, 2])
  })

  it('front-loads remainder beats for three chords in 4/4', () => {
    let state = createEditorState(createAutumnPracticeChart())
    state = beginEdit(state)
    state = setDraftSymbol(state, 'C Dm G7')
    state = commitEdit(state)
    expect(state.error).toBeNull()
    const bar = expandChartBars(state.chart)[0]!
    expect(bar.slots.map((s) => s.durationBeats)).toEqual([2, 1, 1])
    expect(bar.slots.reduce((sum, s) => sum + s.durationBeats, 0)).toBe(4)
  })

  it('keeps spaced alterations as one chord when the full draft parses', () => {
    let state = createEditorState(createAutumnPracticeChart())
    state = beginEdit(state)
    state = setDraftSymbol(state, 'G7 b9')
    state = commitEdit(state)
    expect(state.error).toBeNull()
    expect(chartBarSymbols(state.chart)[0]).toBe('G7b9')
    expect(expandChartBars(state.chart)[0]!.slots).toHaveLength(1)
  })

  it('preserves silent slots via NC in the draft', () => {
    let state = createEditorState(createAutumnPracticeChart())
    state = beginEdit(state)
    state = setDraftSymbol(state, 'NC G7')
    state = commitEdit(state)
    expect(state.error).toBeNull()
    const bar = expandChartBars(state.chart)[0]!
    expect(bar.slots[0]!.chord).toBeNull()
    expect(bar.slots[1]!.chord).not.toBeNull()
    state = beginEdit(state)
    expect(state.draftSymbol).toBe('NC G7')
  })

  it('rejects more chords than beats in the bar', () => {
    let state = createEditorState(createAutumnPracticeChart())
    state = beginEdit(state)
    state = setDraftSymbol(state, 'C Dm Em F G')
    state = commitEdit(state)
    expect(state.editing).toBe(true)
    expect(state.error).toMatch(/At most 4 chords/)
  })

  it('loads multi-slot bars into the draft as space-separated symbols', () => {
    const chart = createAutumnPracticeChart()
    chart.sections[0]!.bars[0] = barFromSymbols(['Dm7', 'G7'])
    assertValidChart(chart)
    let state = createEditorState(chart)
    state = beginEdit(state)
    expect(state.draftSymbol).toBe('Dm7 G7')
  })

  it('rejects invalid chord symbols without mutating the chart', () => {
    let state = createEditorState(createAutumnPracticeChart())
    const before = chartBarSymbols(state.chart)
    state = beginEdit(state)
    state = setDraftSymbol(state, 'NotAChord')
    state = commitEdit(state)
    expect(state.editing).toBe(true)
    expect(state.error).toMatch(/Invalid chord/)
    expect(chartBarSymbols(state.chart)).toEqual(before)
  })

  it('preserves bar meter override and rehearsal mark on edit', () => {
    const chart = createAutumnPracticeChart()
    const waltz = barFromSymbols(['Dm7'], { numerator: 3, denominator: 4 })
    waltz.timeSignature = { numerator: 3, denominator: 4 }
    waltz.rehearsalMark = 'A'
    chart.sections[0]!.bars[0] = waltz
    assertValidChart(chart)

    let state = createEditorState(chart)
    state = beginEdit(state)
    state = setDraftSymbol(state, 'Em7')
    state = commitEdit(state)

    const bar = expandChartBars(state.chart)[0]!
    expect(chartBarSymbols(state.chart)[0]).toBe('Em7')
    expect(bar.timeSignature).toEqual({ numerator: 3, denominator: 4 })
    expect(bar.rehearsalMark).toBe('A')
    expect(bar.slots[0]!.durationBeats).toBe(3)
  })

  it('adds and removes bars', () => {
    let state = createEditorState(createAutumnPracticeChart())
    expect(expandChartBars(state.chart)).toHaveLength(8)
    state = addBarAfterSelection(state)
    expect(expandChartBars(state.chart)).toHaveLength(9)
    expect(state.selectedBarIndex).toBe(1)
    state = removeSelectedBar(state)
    expect(expandChartBars(state.chart)).toHaveLength(8)
  })

  it('selects the inserted bar when a section repeats in the form', () => {
    const chart = createAabaChart()
    // Expanded: A(2) + B(1) + A(2) = 5 bars. Second A starts at index 3.
    let state = createEditorState(chart)
    state = selectBar(state, 3)
    state = addBarAfterSelection(state)
    // Shared A grows; second occurrence's new bar is at index 5.
    expect(expandChartBars(state.chart)).toHaveLength(7)
    expect(state.selectedBarIndex).toBe(5)
  })

  it('rejects removing the last bar of a section', () => {
    const chart = createAabaChart()
    let state = createEditorState(chart)
    // Section B is a single bar at expanded index 2.
    state = selectBar(state, 2)
    const before = expandChartBars(state.chart).length
    state = removeSelectedBar(state)
    expect(state.error).toMatch(/Section must keep/)
    expect(expandChartBars(state.chart)).toHaveLength(before)
  })

  it('updates the title', () => {
    let state = createEditorState(createAutumnPracticeChart())
    state = setTitle(state, 'Blue Practice')
    expect(state.chart.title).toBe('Blue Practice')
  })

  it('rewrites form order from a space-separated draft', () => {
    let state = createEditorState(createAabaChart())
    expect(formDraftString(state.chart)).toBe('A B A')
    state = setFormOrder(state, 'A A B A')
    expect(state.error).toBeNull()
    expect(state.chart.form).toEqual(['A', 'A', 'B', 'A'])
    expect(expandChartBars(state.chart)).toHaveLength(7)
  })

  it('preserves the selected section across a form reorder', () => {
    let state = selectBar(createEditorState(createAabaChart()), 2) // B
    expect(selectedSectionId(state)).toBe('B')
    state = setFormOrder(state, 'A A B')
    expect(state.error).toBeNull()
    expect(selectedSectionId(state)).toBe('B')
    expect(state.selectedBarIndex).toBe(4) // A(2)+A(2)+B
  })

  it('rejects unknown form tokens', () => {
    let state = createEditorState(createAabaChart())
    state = setFormOrder(state, 'A C')
    expect(state.error).toMatch(/Unknown section/)
    expect(state.chart.form).toEqual(['A', 'B', 'A'])
  })

  it('rejects ambiguous duplicated section labels', () => {
    const chart = createAabaChart()
    chart.sections[0]!.label = 'Part'
    chart.sections[1]!.label = 'Part'
    let state = createEditorState(chart)
    state = setFormOrder(state, 'Part B')
    expect(state.error).toMatch(/Ambiguous section label/)
    expect(state.chart.form).toEqual(['A', 'B', 'A'])
    state = setFormOrder(state, 'A B A')
    expect(state.error).toBeNull()
    expect(state.chart.form).toEqual(['A', 'B', 'A'])
  })

  it('appends a new empty section to the form', () => {
    let state = createEditorState(createAabaChart())
    state = addSection(state)
    expect(state.error).toBeNull()
    expect(state.chart.sections.map((s) => s.id)).toContain('C')
    expect(state.chart.form.at(-1)).toBe('C')
    const added = state.chart.sections.find((s) => s.id === 'C')!
    expect(added.bars.length).toBe(2) // matches selected section A length
    expect(added.bars.every((b) => b.slots.every((s) => !s.chord))).toBe(true)
  })

  it('renames the selected section label without changing ids', () => {
    let state = selectBar(createEditorState(createAabaChart()), 2) // section B
    expect(selectedSectionId(state)).toBe('B')
    state = renameSelectedSection(state, 'Bridge')
    expect(state.error).toBeNull()
    expect(selectedSectionLabel(state)).toBe('Bridge')
    expect(state.chart.sections.find((s) => s.id === 'B')!.label).toBe('Bridge')
    expect(state.chart.form).toEqual(['A', 'B', 'A'])
  })

  it('rejects an empty section label', () => {
    let state = createEditorState(createAabaChart())
    state = renameSelectedSection(state, '   ')
    expect(state.error).toMatch(/Section label required/)
  })

  it('removes the selected section and strips it from the form', () => {
    let state = selectBar(createEditorState(createAabaChart()), 2) // B
    state = removeSelectedSection(state)
    expect(state.error).toBeNull()
    expect(state.chart.sections.map((s) => s.id)).toEqual(['A'])
    expect(state.chart.form).toEqual(['A', 'A'])
    expect(expandChartBars(state.chart)).toHaveLength(4)
  })

  it('falls back to the remaining section when form only referenced the deleted one', () => {
    const chart = createAabaChart()
    chart.form = ['B', 'B']
    let state = selectBar(createEditorState(chart), 0)
    expect(selectedSectionId(state)).toBe('B')
    state = removeSelectedSection(state)
    expect(state.error).toBeNull()
    expect(state.chart.sections.map((s) => s.id)).toEqual(['A'])
    expect(state.chart.form).toEqual(['A'])
    expect(expandChartBars(state.chart)).toHaveLength(2)
  })

  it('rejects deleting the last remaining section', () => {
    let state = createEditorState(createAutumnPracticeChart())
    state = removeSelectedSection(state)
    expect(state.error).toMatch(/at least one section/)
    expect(state.chart.sections).toHaveLength(1)
  })
})

function createAabaChart(): Chart {
  const chart: Chart = {
    version: 1,
    id: 'aaba',
    title: 'AABA',
    key: { letter: 'C', accidental: 0 },
    timeSignature: { numerator: 4, denominator: 4 },
    defaultTempoBpm: 120,
    form: ['A', 'B', 'A'],
    sections: [
      sectionFromBarSymbols('A', 'A', [['Cmaj7'], ['Am7']]),
      sectionFromBarSymbols('B', 'B', [['Dm7']]),
    ],
  }
  assertValidChart(chart)
  return chart
}
