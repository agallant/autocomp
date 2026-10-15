import { formatChord } from './formatChord'
import { formatRoot, parseRoot } from './pitch'
import { parseChordSymbol } from './parseChord'
import type {
  Bar,
  Chart,
  ChartValidationIssue,
  ChordSlot,
  Section,
  TimeSignature,
} from './types'

export function beatsPerBar(ts: TimeSignature): number {
  // Treat denominator as beat unit for chart purposes (4/4 → 4, 3/4 → 3, 6/8 → 6).
  return ts.numerator
}

export function barBeats(bar: Bar, fallback: TimeSignature): number {
  const ts = bar.timeSignature ?? fallback
  return beatsPerBar(ts)
}

export function slotBeatSum(slots: ChordSlot[]): number {
  return slots.reduce((sum, s) => sum + s.durationBeats, 0)
}

export function validateChart(chart: Chart): ChartValidationIssue[] {
  const issues: ChartValidationIssue[] = []

  if (chart.version !== 1) {
    issues.push({ path: 'version', message: `unsupported chart version ${String(chart.version)}` })
  }
  if (!chart.id.trim()) issues.push({ path: 'id', message: 'id is required' })
  if (!chart.title.trim()) issues.push({ path: 'title', message: 'title is required' })
  if (chart.defaultTempoBpm < 20 || chart.defaultTempoBpm > 400) {
    issues.push({ path: 'defaultTempoBpm', message: 'tempo out of range (20–400)' })
  }
  if (chart.timeSignature.numerator < 1 || chart.timeSignature.denominator < 1) {
    issues.push({ path: 'timeSignature', message: 'invalid time signature' })
  }

  const sectionIds = new Set(chart.sections.map((s) => s.id))
  if (sectionIds.size !== chart.sections.length) {
    issues.push({ path: 'sections', message: 'duplicate section ids' })
  }
  for (const [i, id] of chart.form.entries()) {
    if (!sectionIds.has(id)) {
      issues.push({ path: `form[${i}]`, message: `unknown section id "${id}"` })
    }
  }

  for (const [si, section] of chart.sections.entries()) {
    if (!section.bars.length) {
      issues.push({ path: `sections[${si}].bars`, message: 'section has no bars' })
    }
    for (const [bi, bar] of section.bars.entries()) {
      const expected = barBeats(bar, chart.timeSignature)
      const sum = slotBeatSum(bar.slots)
      if (bar.slots.length === 0) {
        issues.push({
          path: `sections[${si}].bars[${bi}].slots`,
          message: 'bar has no slots',
        })
      } else if (Math.abs(sum - expected) > 1e-6) {
        issues.push({
          path: `sections[${si}].bars[${bi}].slots`,
          message: `slot beats sum to ${sum}, expected ${expected}`,
        })
      }
      for (const [qi, slot] of bar.slots.entries()) {
        if (slot.durationBeats <= 0) {
          issues.push({
            path: `sections[${si}].bars[${bi}].slots[${qi}]`,
            message: 'durationBeats must be positive',
          })
        }
      }
    }
  }

  return issues
}

export function assertValidChart(chart: Chart): void {
  const issues = validateChart(chart)
  if (issues.length) {
    throw new Error(
      `Invalid chart: ${issues.map((i) => `${i.path}: ${i.message}`).join('; ')}`,
    )
  }
}

/** Expand form into a flat bar list for playback / display. */
export function expandChartBars(chart: Chart): Bar[] {
  assertValidChart(chart)
  const byId = new Map(chart.sections.map((s) => [s.id, s]))
  const out: Bar[] = []
  for (const id of chart.form) {
    const section = byId.get(id)
    if (!section) continue
    out.push(...section.bars)
  }
  return out
}

/** Symbols for each bar (joined slots), useful for simple UI grids. */
export function chartBarSymbols(chart: Chart): string[] {
  return expandChartBars(chart).map((bar) =>
    bar.slots
      .filter((s) => s.chord)
      .map((s) => formatChord(s.chord!))
      .join(' '),
  )
}

export function barFromSymbols(
  symbols: string[],
  timeSignature: TimeSignature = { numerator: 4, denominator: 4 },
): Bar {
  const beats = beatsPerBar(timeSignature)
  if (symbols.length === 0) {
    return { slots: [{ chord: null, durationBeats: beats }] }
  }
  if (beats % symbols.length !== 0) {
    // Uneven: give remainder beats to the last slot
    const base = Math.floor(beats / symbols.length)
    let used = 0
    const slots: ChordSlot[] = symbols.map((sym, i) => {
      const isLast = i === symbols.length - 1
      const durationBeats = isLast ? beats - used : base
      used += durationBeats
      return { chord: parseChordSymbol(sym), durationBeats }
    })
    return { slots }
  }
  const durationBeats = beats / symbols.length
  return {
    slots: symbols.map((sym) => ({
      chord: parseChordSymbol(sym),
      durationBeats,
    })),
  }
}

export function sectionFromBarSymbols(
  id: string,
  label: string,
  bars: string[][],
  timeSignature?: TimeSignature,
): Section {
  const ts = timeSignature ?? { numerator: 4, denominator: 4 }
  return {
    id,
    label,
    bars: bars.map((syms) => barFromSymbols(syms, ts)),
  }
}

/** JSON-safe serialization (chords as symbols for readability). */
export type ChartJson = {
  version: 1
  id: string
  title: string
  composer?: string
  key: string
  timeSignature: TimeSignature
  defaultTempoBpm: number
  form: string[]
  styleHint?: string
  notes?: string
  sections: Array<{
    id: string
    label: string
    bars: Array<{
      rehearsalMark?: string
      timeSignature?: TimeSignature
      slots: Array<{ chord: string | null; durationBeats: number }>
    }>
  }>
}

export function chartToJson(chart: Chart): ChartJson {
  assertValidChart(chart)
  const json: ChartJson = {
    version: 1,
    id: chart.id,
    title: chart.title,
    key: formatRoot(chart.key),
    timeSignature: chart.timeSignature,
    defaultTempoBpm: chart.defaultTempoBpm,
    form: [...chart.form],
    sections: chart.sections.map((section) => ({
      id: section.id,
      label: section.label,
      bars: section.bars.map((bar) => {
        const out: ChartJson['sections'][number]['bars'][number] = {
          slots: bar.slots.map((slot) => ({
            chord: slot.chord ? formatChord(slot.chord) : null,
            durationBeats: slot.durationBeats,
          })),
        }
        if (bar.rehearsalMark) out.rehearsalMark = bar.rehearsalMark
        if (bar.timeSignature) out.timeSignature = bar.timeSignature
        return out
      }),
    })),
  }
  if (chart.composer) json.composer = chart.composer
  if (chart.styleHint) json.styleHint = chart.styleHint
  if (chart.notes) json.notes = chart.notes
  return json
}

export function chartFromJson(input: unknown): Chart {
  if (!input || typeof input !== 'object') {
    throw new Error('Chart JSON must be an object')
  }
  const data = input as ChartJson
  if (data.version !== 1) throw new Error('Unsupported chart JSON version')
  const key = parseRoot(data.key)
  if (!key) throw new Error(`Invalid key "${data.key}"`)

  const chart: Chart = {
    version: 1,
    id: data.id,
    title: data.title,
    key,
    timeSignature: data.timeSignature,
    defaultTempoBpm: data.defaultTempoBpm,
    form: data.form,
    sections: data.sections.map((section) => ({
      id: section.id,
      label: section.label,
      bars: section.bars.map((bar) => {
        const out: Bar = {
          slots: bar.slots.map((slot) => ({
            chord: slot.chord ? parseChordSymbol(slot.chord) : null,
            durationBeats: slot.durationBeats,
          })),
        }
        if (bar.rehearsalMark) out.rehearsalMark = bar.rehearsalMark
        if (bar.timeSignature) out.timeSignature = bar.timeSignature
        return out
      }),
    })),
  }
  if (data.composer) chart.composer = data.composer
  if (data.styleHint) chart.styleHint = data.styleHint
  if (data.notes) chart.notes = data.notes

  assertValidChart(chart)
  return chart
}

export function serializeChart(chart: Chart): string {
  return `${JSON.stringify(chartToJson(chart), null, 2)}\n`
}

export function deserializeChart(text: string): Chart {
  return chartFromJson(JSON.parse(text) as unknown)
}
