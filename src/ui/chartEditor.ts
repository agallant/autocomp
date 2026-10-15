import {
  assertValidChart,
  beatsPerBar,
  distributeBeats,
  expandChartBars,
  formatChord,
  parseChordSymbol,
  tryParseChordSymbol,
  type Bar,
  type Chart,
  type ChordSlot,
} from '../music'

/** Lead-sheet token for a silent slot (no chord). */
export const REST_TOKEN = 'NC'

function isRestToken(token: string): boolean {
  const t = token.trim().toUpperCase()
  return t === 'NC' || t === '.' || t === 'R'
}

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

/** Space-separated chord/rest tokens for the selected bar (multi-slot aware). */
export function selectedSymbol(state: ChartEditorState): string {
  const bar = selectedBar(state)
  if (!bar) return ''
  if (bar.slots.every((s) => !s.chord)) return ''
  return bar.slots.map((s) => (s.chord ? formatChord(s.chord) : REST_TOKEN)).join(' ')
}

/**
 * Split a draft into chord/rest tokens (whitespace-separated).
 * Prefers the full string as one chord when it parses (e.g. `G7 b9`).
 * Empty string → no tokens (clears the bar).
 */
export function parseDraftSymbols(draft: string): string[] {
  const trimmed = draft.trim()
  if (!trimmed) return []
  if (tryParseChordSymbol(trimmed)) return [trimmed]
  return trimmed.split(/\s+/).filter((s) => s.length > 0)
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

/**
 * Commit draft into the selected bar.
 * Whitespace-separated symbols become equal (or nearly equal) duration slots.
 * Empty clears the bar.
 */
export function commitEdit(state: ChartEditorState): ChartEditorState {
  const tokens = parseDraftSymbols(state.draftSymbol)
  const existing = selectedBar(state)
  if (tokens.length === 0) {
    return {
      ...updateBarAt(state, state.selectedBarIndex, emptyBar(state.chart, existing)),
      editing: false,
      draftSymbol: '',
      error: null,
    }
  }
  for (const token of tokens) {
    if (!isRestToken(token) && !tryParseChordSymbol(token)) {
      return { ...state, error: `Invalid chord “${token}”` }
    }
  }
  const meter = existing?.timeSignature ?? state.chart.timeSignature
  const beats = beatsPerBar(meter)
  if (tokens.length > beats) {
    return {
      ...state,
      error: `At most ${beats} chords per bar in ${meter.numerator}/${meter.denominator}`,
    }
  }
  let durations: number[]
  try {
    durations = distributeBeats(beats, tokens.length)
  } catch (err) {
    return {
      ...state,
      error: err instanceof Error ? err.message : 'Could not build bar slots',
    }
  }
  const slots: ChordSlot[] = tokens.map((token, i) => {
    if (isRestToken(token)) return { chord: null, durationBeats: durations[i]! }
    return { chord: parseChordSymbol(token), durationBeats: durations[i]! }
  })
  const bar: Bar = { slots }
  if (existing?.timeSignature !== undefined) bar.timeSignature = existing.timeSignature
  if (existing?.rehearsalMark !== undefined) bar.rehearsalMark = existing.rehearsalMark
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
    selectedBarIndex: expandedIndexAt(chart, loc.formIndex, loc.barInSection + 1),
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
  const section = chart.sections[loc.sectionIndex]!
  if (section.bars.length === 1) {
    return { ...state, error: 'Section must keep at least one bar' }
  }
  section.bars.splice(loc.barInSection, 1)
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

/** Space-separated form tokens for the toolbar (section ids / labels). */
export function formDraftString(chart: Chart): string {
  return chart.form.join(' ')
}

/**
 * Set playback order from a whitespace-separated draft.
 * Tokens match section `id` first, then unique `label`.
 */
export function setFormOrder(state: ChartEditorState, draft: string): ChartEditorState {
  const tokens = draft.trim().split(/\s+/).filter((t) => t.length > 0)
  if (tokens.length === 0) {
    return { ...state, error: 'Form needs at least one section' }
  }
  const byId = new Map(state.chart.sections.map((s) => [s.id, s]))
  const labelCounts = new Map<string, number>()
  for (const section of state.chart.sections) {
    labelCounts.set(section.label, (labelCounts.get(section.label) ?? 0) + 1)
  }
  const byLabel = new Map<string, string>()
  for (const section of state.chart.sections) {
    if ((labelCounts.get(section.label) ?? 0) === 1) {
      byLabel.set(section.label, section.id)
    }
  }
  const form: string[] = []
  for (const token of tokens) {
    if (byId.has(token)) {
      form.push(token)
      continue
    }
    const fromLabel = byLabel.get(token)
    if (fromLabel) {
      form.push(fromLabel)
      continue
    }
    if ((labelCounts.get(token) ?? 0) > 1) {
      return { ...state, error: `Ambiguous section label “${token}” — use the section id` }
    }
    return { ...state, error: `Unknown section “${token}”` }
  }
  const prevLoc = locateBar(state.chart, state.selectedBarIndex)
  const prevSectionId = prevLoc
    ? state.chart.sections[prevLoc.sectionIndex]!.id
    : null
  const prevBarInSection = prevLoc?.barInSection ?? 0

  const chart = cloneChart(state.chart)
  chart.form = form
  assertValidChart(chart)

  // Keep the same section under the caret across form reorders so a deferred
  // UI rebuild + Delete cannot target a different section than the highlight.
  let selectedBarIndex = Math.min(
    state.selectedBarIndex,
    Math.max(0, expandChartBars(chart).length - 1),
  )
  if (prevSectionId && chart.sections.some((s) => s.id === prevSectionId)) {
    let index = 0
    for (const id of chart.form) {
      const section = chart.sections.find((s) => s.id === id)
      if (!section) continue
      if (id === prevSectionId) {
        selectedBarIndex =
          index + Math.min(prevBarInSection, section.bars.length - 1)
        break
      }
      index += section.bars.length
    }
  }

  return {
    ...state,
    chart,
    selectedBarIndex,
    editing: false,
    draftSymbol: '',
    error: null,
  }
}

/** Append a new empty section (next free letter id) and add it to the form. */
export function addSection(state: ChartEditorState): ChartEditorState {
  const chart = cloneChart(state.chart)
  const id = nextSectionId(chart)
  const loc = locateBar(chart, state.selectedBarIndex)
  const templateLen = loc ? chart.sections[loc.sectionIndex]!.bars.length : 4
  const barCountNew = Math.max(1, templateLen)
  chart.sections.push({
    id,
    label: id,
    bars: Array.from({ length: barCountNew }, () => emptyBar(chart)),
  })
  chart.form.push(id)
  assertValidChart(chart)
  const selectedBarIndex = expandChartBars(chart).length - barCountNew
  return {
    ...state,
    chart,
    selectedBarIndex,
    editing: false,
    draftSymbol: '',
    error: null,
  }
}

/** Section id for the selected expanded bar, if any. */
export function selectedSectionId(state: ChartEditorState): string | null {
  const loc = locateBar(state.chart, state.selectedBarIndex)
  if (!loc) return null
  return state.chart.sections[loc.sectionIndex]?.id ?? null
}

/** Display label for the selected section (falls back to id). */
export function selectedSectionLabel(state: ChartEditorState): string {
  const loc = locateBar(state.chart, state.selectedBarIndex)
  if (!loc) return ''
  const section = state.chart.sections[loc.sectionIndex]
  if (!section) return ''
  return section.label.trim() || section.id
}

/** Rename the selected section’s display label (id / form tokens unchanged). */
export function renameSelectedSection(
  state: ChartEditorState,
  labelDraft: string,
): ChartEditorState {
  const loc = locateBar(state.chart, state.selectedBarIndex)
  if (!loc) return { ...state, error: 'No section selected' }
  const trimmed = labelDraft.trim()
  if (!trimmed) return { ...state, error: 'Section label required' }
  const chart = cloneChart(state.chart)
  chart.sections[loc.sectionIndex]!.label = trimmed
  assertValidChart(chart)
  return { ...state, chart, error: null }
}

/**
 * Remove the selected section from the chart and strip it from the form.
 * Keeps at least one section; if the form would be empty, defaults to the
 * first remaining section once.
 */
export function removeSelectedSection(state: ChartEditorState): ChartEditorState {
  if (state.chart.sections.length <= 1) {
    return { ...state, error: 'Chart must keep at least one section' }
  }
  const loc = locateBar(state.chart, state.selectedBarIndex)
  if (!loc) return { ...state, error: 'No section selected' }
  const sectionId = state.chart.sections[loc.sectionIndex]!.id
  const chart = cloneChart(state.chart)
  chart.sections = chart.sections.filter((s) => s.id !== sectionId)
  chart.form = chart.form.filter((id) => id !== sectionId)
  if (chart.form.length === 0) {
    chart.form = [chart.sections[0]!.id]
  }
  assertValidChart(chart)
  const nextIndex = Math.min(state.selectedBarIndex, expandChartBars(chart).length - 1)
  return {
    ...state,
    chart,
    selectedBarIndex: Math.max(0, nextIndex),
    editing: false,
    draftSymbol: '',
    error: null,
  }
}

function nextSectionId(chart: Chart): string {
  const used = new Set(chart.sections.map((s) => s.id))
  for (let i = 0; i < 26; i++) {
    const id = String.fromCharCode(65 + i) // A–Z
    if (!used.has(id)) return id
  }
  let n = 1
  while (used.has(`S${n}`)) n += 1
  return `S${n}`
}

function emptyBar(chart: Chart, preserve?: Bar | null): Bar {
  const meter = preserve?.timeSignature ?? chart.timeSignature
  const bar: Bar = {
    slots: [{ chord: null, durationBeats: beatsPerBar(meter) }],
  }
  if (preserve?.timeSignature !== undefined) bar.timeSignature = preserve.timeSignature
  if (preserve?.rehearsalMark !== undefined) bar.rehearsalMark = preserve.rehearsalMark
  return bar
}

function cloneChart(chart: Chart): Chart {
  return structuredClone(chart)
}

type BarLocation = {
  sectionIndex: number
  barInSection: number
  /** Index into `chart.form` for this occurrence of the section. */
  formIndex: number
}

function locateBar(chart: Chart, expandedIndex: number): BarLocation | null {
  let remaining = expandedIndex
  for (let formIndex = 0; formIndex < chart.form.length; formIndex++) {
    const id = chart.form[formIndex]!
    const sectionIndex = chart.sections.findIndex((s) => s.id === id)
    if (sectionIndex < 0) continue
    const section = chart.sections[sectionIndex]!
    if (remaining < section.bars.length) {
      return { sectionIndex, barInSection: remaining, formIndex }
    }
    remaining -= section.bars.length
  }
  return null
}

function expandedIndexAt(chart: Chart, formIndex: number, barInSection: number): number {
  let index = 0
  for (let fi = 0; fi < formIndex; fi++) {
    const id = chart.form[fi]!
    const section = chart.sections.find((s) => s.id === id)
    if (section) index += section.bars.length
  }
  return index + barInSection
}

function updateBarAt(state: ChartEditorState, expandedIndex: number, bar: Bar): ChartEditorState {
  const loc = locateBar(state.chart, expandedIndex)
  if (!loc) return state
  const chart = cloneChart(state.chart)
  chart.sections[loc.sectionIndex]!.bars[loc.barInSection] = bar
  assertValidChart(chart)
  return { ...state, chart }
}
