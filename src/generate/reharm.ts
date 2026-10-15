import {
  assertValidChart,
  barFromSymbols,
  beatsPerBar,
  expandChartBars,
  formatChordCanonical,
  formatRoot,
  isDominantFamily,
  parseChordSymbol,
  transposeRoot,
  type Bar,
  type Chart,
  type Chord,
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

/** Locate expanded bar index → section + local bar index. */
function locateBar(
  chart: Chart,
  expandedIndex: number,
): { sectionIndex: number; barIndex: number } | null {
  let cursor = 0
  const byId = new Map(chart.sections.map((s, i) => [s.id, i]))
  for (const sectionId of chart.form) {
    const sectionIndex = byId.get(sectionId)
    if (sectionIndex === undefined) continue
    const section = chart.sections[sectionIndex]!
    const next = cursor + section.bars.length
    if (expandedIndex >= cursor && expandedIndex < next) {
      return { sectionIndex, barIndex: expandedIndex - cursor }
    }
    cursor = next
  }
  return null
}

function firstChord(bar: Bar): Chord | null {
  for (const slot of bar.slots) {
    if (slot.chord) return slot.chord
  }
  return null
}

function preserveMeta(source: Bar, next: Bar): Bar {
  if (source.timeSignature !== undefined) next.timeSignature = source.timeSignature
  if (source.rehearsalMark !== undefined) next.rehearsalMark = source.rehearsalMark
  return next
}

/**
 * Split a dominant-family bar into ii–V of its resolution target.
 * Uses the dominant root as V; ii is a fourth above (or fifth below).
 * Non-dominant bars are left unchanged.
 */
function reharmIiBeforeV(bar: Bar, fallbackTs: Chart['timeSignature'], preferSharps: boolean): Bar {
  const chord = firstChord(bar)
  if (!chord || !isDominantFamily(chord)) return bar
  const meter = bar.timeSignature ?? fallbackTs
  const vRoot = chord.root
  // ii of the key where this V resolves: ii root is a fifth above V (V=G → ii=D).
  const iiRoot = transposeRoot(vRoot, 7, preferSharps)
  const iiSym = `${formatRoot(iiRoot)}m7`
  const vSym = formatChordCanonical({ ...chord, root: vRoot })
  const next = barFromSymbols([iiSym, vSym], meter)
  return preserveMeta(bar, next)
}

/** Replace a dominant-family chord with its tritone substitute (same quality). */
function reharmTritoneSub(bar: Bar, fallbackTs: Chart['timeSignature'], _preferSharps: boolean): Bar {
  const chord = firstChord(bar)
  if (!chord || !isDominantFamily(chord)) return bar
  const meter = bar.timeSignature ?? fallbackTs
  // Jazz charts almost always spell tritone subs with flats (G7 → Db7, not C#7).
  const sub = tritoneRoot(chord.root, false)
  const { symbol: _dropSymbol, ...rest } = chord
  const nextChord: Chord = {
    ...rest,
    root: sub,
  }
  // Keep a single whole-bar chord so beat sums stay valid.
  const beats = beatsPerBar(meter)
  const next: Bar = {
    slots: [{ chord: nextChord, durationBeats: beats }],
  }
  return preserveMeta(bar, next)
}

/**
 * Apply a reharmonization mode to one expanded-form bar index.
 * Returns a new chart; no-ops (copy) when the bar is not a dominant target.
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
    mode === 'ii-before-v'
      ? reharmIiBeforeV(source, chart.timeSignature, preferSharps)
      : reharmTritoneSub(source, chart.timeSignature, preferSharps)

  const next = cloneChart(chart)
  next.sections[located.sectionIndex]!.bars[located.barIndex] = nextBar
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
  const vRoot = transposeRoot(targetChord.root, 7, preferSharps)
  const iiRoot = transposeRoot(vRoot, 7, preferSharps)
  return [`${formatRoot(iiRoot)}m7`, `${formatRoot(vRoot)}7`]
}
