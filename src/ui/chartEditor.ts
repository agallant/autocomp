import {
  assertValidChart,
  barFromSymbols,
  beatsPerBar,
  expandChartBars,
  formatChord,
  parseChordSymbol,
  tryParseChordSymbol,
  type Bar,
  type Chart,
} from '../music'

export type ChartEditorState = {
  chart: Chart
  /** Index into the expanded form bar list. */
  selectedBarIndex: number
  editing: boolean
  draftSymbol: string
  error: string | null
}

export function createEditorState(chart: Chart): ChartEditorState {
  assertValidChart(chart)
  return {
    chart: cloneChart(chart),
    selectedBarIndex: 0,
    editing: false,
    draftSymbol: '',
    error: null,
  }
}

export function barCount(state: ChartEditorState): number {
  return expandChartBars(state.chart).length
}

export function selectedBar(state: ChartEditorState): Bar | null {
  const bars = expandChartBars(state.chart)
  return bars[state.selectedBarIndex] ?? null
}

export function selectedSymbol(state: ChartEditorState): string {
  const bar = selectedBar(state)
  if (!bar) return ''
  const chord = bar.slots.find((s) => s.chord)?.chord
  return chord ? formatChord(chord) : ''
}

export function selectBar(state: ChartEditorState, index: number): ChartEditorState {
  const count = barCount(state)
  if (count === 0) return { ...state, selectedBarIndex: 0, editing: false, error: null }
  const selectedBarIndex = Math.max(0, Math.min(count - 1, index))
  return { ...state, selectedBarIndex, editing: false, draftSymbol: '', error: null }
}

export function moveSelection(state: ChartEditorState, delta: number): ChartEditorState {
  return selectBar(state, state.selectedBarIndex + delta)
}

export function beginEdit(state: ChartEditorState): ChartEditorState {
  return {
    ...state,
    editing: true,
    draftSymbol: selectedSymbol(state),
    error: null,
  }
}

export function cancelEdit(state: ChartEditorState): ChartEditorState {
  return { ...state, editing: false, draftSymbol: '', error: null }
}

export function setDraftSymbol(state: ChartEditorState, draftSymbol: string): ChartEditorState {
  return { ...state, draftSymbol, error: null }
}

/** Commit draft symbol into the selected bar (whole-bar chord). Empty clears the bar. */
export function commitEdit(state: ChartEditorState): ChartEditorState {
  const symbol = state.draftSymbol.trim()
  if (symbol === '') {
    return {
      ...updateBarAt(state, state.selectedBarIndex, emptyBar(state.chart)),
      editing: false,
      draftSymbol: '',
      error: null,
    }
  }
  if (!tryParseChordSymbol(symbol)) {
    return { ...state, error: `Invalid chord “${symbol}”` }
  }
  const chord = parseChordSymbol(symbol)
  const bar = barFromSymbols([formatChord(chord)], state.chart.timeSignature)
  return {
    ...updateBarAt(state, state.selectedBarIndex, bar),
    editing: false,
    draftSymbol: '',
    error: null,
  }
}

export function addBarAfterSelection(state: ChartEditorState): ChartEditorState {
  const loc = locateBar(state.chart, state.selectedBarIndex)
  if (!loc) return state
  const chart = cloneChart(state.chart)
  const section = chart.sections[loc.sectionIndex]!
  section.bars.splice(loc.barInSection + 1, 0, emptyBar(chart))
  assertValidChart(chart)
  return {
    ...state,
    chart,
    selectedBarIndex: state.selectedBarIndex + 1,
    editing: false,
    draftSymbol: '',
    error: null,
  }
}

export function removeSelectedBar(state: ChartEditorState): ChartEditorState {
  if (barCount(state) <= 1) {
    return { ...state, error: 'Chart must keep at least one bar' }
  }
  const loc = locateBar(state.chart, state.selectedBarIndex)
  if (!loc) return state
  const chart = cloneChart(state.chart)
  chart.sections[loc.sectionIndex]!.bars.splice(loc.barInSection, 1)
  assertValidChart(chart)
  const nextIndex = Math.min(state.selectedBarIndex, expandChartBars(chart).length - 1)
  return {
    ...state,
    chart,
    selectedBarIndex: nextIndex,
    editing: false,
    draftSymbol: '',
    error: null,
  }
}

export function setTitle(state: ChartEditorState, title: string): ChartEditorState {
  const chart = cloneChart(state.chart)
  chart.title = title.trim() || 'Untitled'
  return { ...state, chart, error: null }
}

function emptyBar(chart: Chart): Bar {
  return {
    slots: [{ chord: null, durationBeats: beatsPerBar(chart.timeSignature) }],
  }
}

function cloneChart(chart: Chart): Chart {
  return structuredClone(chart)
}

function locateBar(
  chart: Chart,
  expandedIndex: number,
): { sectionIndex: number; barInSection: number } | null {
  let remaining = expandedIndex
  for (const id of chart.form) {
    const sectionIndex = chart.sections.findIndex((s) => s.id === id)
    if (sectionIndex < 0) continue
    const section = chart.sections[sectionIndex]!
    if (remaining < section.bars.length) {
      return { sectionIndex, barInSection: remaining }
    }
    remaining -= section.bars.length
  }
  return null
}

function updateBarAt(state: ChartEditorState, expandedIndex: number, bar: Bar): ChartEditorState {
  const loc = locateBar(state.chart, expandedIndex)
  if (!loc) return state
  const chart = cloneChart(state.chart)
  chart.sections[loc.sectionIndex]!.bars[loc.barInSection] = bar
  assertValidChart(chart)
  return { ...state, chart }
}
