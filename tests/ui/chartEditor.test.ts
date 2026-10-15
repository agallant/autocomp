import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/autumnPractice'
import { chartBarSymbols, expandChartBars } from '../../src/music'
import {
  addBarAfterSelection,
  beginEdit,
  commitEdit,
  createEditorState,
  moveSelection,
  removeSelectedBar,
  selectBar,
  setDraftSymbol,
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

  it('adds and removes bars', () => {
    let state = createEditorState(createAutumnPracticeChart())
    expect(expandChartBars(state.chart)).toHaveLength(8)
    state = addBarAfterSelection(state)
    expect(expandChartBars(state.chart)).toHaveLength(9)
    expect(state.selectedBarIndex).toBe(1)
    state = removeSelectedBar(state)
    expect(expandChartBars(state.chart)).toHaveLength(8)
  })

  it('updates the title', () => {
    let state = createEditorState(createAutumnPracticeChart())
    state = setTitle(state, 'Blue Practice')
    expect(state.chart.title).toBe('Blue Practice')
  })
})
