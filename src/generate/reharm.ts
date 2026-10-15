import {
  assertValidChart,
  expandChartBars,
  formatChordCanonical,
  formatRoot,
  isDominantFamily,
  parseChordSymbol,
  transposeRoot,
  type Bar,
  type Chart,
  type Chord,
  type ChordSlot,
  type Section,
} from '../music'
import { degreeChord, tritoneRoot } from './degree'
import type { ReharmDescriptor, ReharmMode } from './types'

export const REHARM_CATALOG: ReharmDescriptor[] = [
  {
    id: 'ii-before-v',
    label: 'ii before V',
    blurb: 'Split a dominant bar into ii–V',
  },
  {
    id: 'tritone-sub',
    label: 'Tritone sub',
    blurb: 'Replace dominant with bII7',
  },
]

function cloneChart(chart: Chart): Chart {
  return structuredClone(chart)
}

type FormLocation = {
  /** Index into `chart.form` for this occurrence. */
  formIndex: number
  sectionIndex: number
  barIndex: number
}

/** Locate expanded bar index → form occurrence + section bar. */
function locateBar(chart: Chart, expandedIndex: number): FormLocation | null {
  let cursor = 0
  for (let formIndex = 0; formIndex < chart.form.length; formIndex++) {
    const sectionId = chart.form[formIndex]!
    const sectionIndex = chart.sections.findIndex((s) => s.id === sectionId)
    if (sectionIndex < 0) continue
    const section = chart.sections[sectionIndex]!
    const next = cursor + section.bars.length
    if (expandedIndex >= cursor && expandedIndex < next) {
      return { formIndex, sectionIndex, barIndex: expandedIndex - cursor }
    }
    cursor = next
  }
  return null
}

function preserveMeta(source: Bar, next: Bar): Bar {
  if (source.timeSignature !== undefined) next.timeSignature = source.timeSignature
  if (source.rehearsalMark !== undefined) next.rehearsalMark = source.rehearsalMark
  return next
}

function findDominantSlotIndex(bar: Bar): number {
  return bar.slots.findIndex((slot) => slot.chord !== null && isDominantFamily(slot.chord))
}

function preferSharpsForRoot(root: { accidental: number }): boolean {
  return root.accidental >= 0
}

/**
 * Split the first dominant slot into ii–V, preserving other slots and total beats.
 * Non-dominant bars are left unchanged (same object reference).
 */
function reharmIiBeforeV(bar: Bar, preferSharps: boolean): Bar {
  const slotIndex = findDominantSlotIndex(bar)
  if (slotIndex < 0) return bar
  const slot = bar.slots[slotIndex]!
  const chord = slot.chord!
  const vRoot = chord.root
  const sharpBias = preferSharps || preferSharpsForRoot(vRoot)
  const iiRoot = transposeRoot(vRoot, 7, sharpBias)
  const half = slot.durationBeats / 2
  if (!(half > 0) || !Number.isFinite(half)) return bar

  const iiSlot: ChordSlot = {
    chord: parseChordSymbol(`${formatRoot(iiRoot)}m7`),
    durationBeats: half,
  }
  const vSlot: ChordSlot = {
    chord: parseChordSymbol(formatChordCanonical(chord)),
    durationBeats: slot.durationBeats - half,
  }
  const slots = [
    ...bar.slots.slice(0, slotIndex),
    iiSlot,
    vSlot,
    ...bar.slots.slice(slotIndex + 1),
  ]
  return preserveMeta(bar, { slots })
}

/** Replace the first dominant slot chord with its tritone substitute; keep durations. */
function reharmTritoneSub(bar: Bar): Bar {
  const slotIndex = findDominantSlotIndex(bar)
  if (slotIndex < 0) return bar
  const slot = bar.slots[slotIndex]!
  const chord = slot.chord!
  const sub = tritoneRoot(chord.root, false)
  const { symbol: _dropSymbol, ...rest } = chord
  const nextChord: Chord = { ...rest, root: sub }
  const slots = bar.slots.map((s, i) =>
    i === slotIndex ? { chord: nextChord, durationBeats: s.durationBeats } : s,
  )
  return preserveMeta(bar, { slots })
}

/**
 * If the selected form occurrence shares a section id with another form entry,
 * clone that section under a unique id and retarget only this form slot.
 */
function isolateFormOccurrence(chart: Chart, loc: FormLocation): FormLocation {
  const sectionId = chart.form[loc.formIndex]!
  const shared = chart.form.filter((id) => id === sectionId).length > 1
  if (!shared) return loc

  const source = chart.sections[loc.sectionIndex]!
  let suffix = 2
  let newId = `${source.id}_${suffix}`
  while (chart.sections.some((s) => s.id === newId)) {
    suffix += 1
    newId = `${source.id}_${suffix}`
  }
  const cloned: Section = structuredClone(source)
  cloned.id = newId
  cloned.label = `${source.label}′`
  chart.sections.push(cloned)
  chart.form[loc.formIndex] = newId
  return {
    formIndex: loc.formIndex,
    sectionIndex: chart.sections.length - 1,
    barIndex: loc.barIndex,
  }
}

/**
 * Apply a reharmonization mode to one expanded-form bar index.
 * Returns a new chart; no-ops (deep copy, unchanged harmony) when not applicable.
 */
export function reharmBar(
  chart: Chart,
  expandedBarIndex: number,
  mode: ReharmMode,
  preferSharps = true,
): Chart {
  assertValidChart(chart)
  const bars = expandChartBars(chart)
  if (expandedBarIndex < 0 || expandedBarIndex >= bars.length) {
    throw new Error(`Bar index ${expandedBarIndex} out of range (0..${bars.length - 1})`)
  }
  const located = locateBar(chart, expandedBarIndex)
  if (!located) {
    throw new Error(`Could not locate bar ${expandedBarIndex} in form`)
  }

  const source = bars[expandedBarIndex]!
  const nextBar =
    mode === 'ii-before-v' ? reharmIiBeforeV(source, preferSharps) : reharmTritoneSub(source)

  const next = cloneChart(chart)
  if (nextBar === source) {
    // Unchanged — return the clone without aliasing the source bar into sections.
    return next
  }
  const writeLoc = isolateFormOccurrence(next, located)
  next.sections[writeLoc.sectionIndex]!.bars[writeLoc.barIndex] = nextBar
  assertValidChart(next)
  return next
}

/**
 * Convenience: secondary ii–V approaching a target tonic degree in a key.
 * Useful for tests / future multi-bar inserts.
 */
export function secondaryIiV(
  tonic: Chart['key'],
  targetDegree: 1 | 2 | 3 | 4 | 5 | 6 | 7,
  preferSharps = true,
): [string, string] {
  const target = degreeChord(tonic, targetDegree, 'major', undefined, preferSharps)
  const targetChord = parseChordSymbol(target)
  const sharpBias = preferSharps || preferSharpsForRoot(targetChord.root)
  const vRoot = transposeRoot(targetChord.root, 7, sharpBias)
  const iiRoot = transposeRoot(vRoot, 7, sharpBias)
  return [`${formatRoot(iiRoot)}m7`, `${formatRoot(vRoot)}7`]
}
