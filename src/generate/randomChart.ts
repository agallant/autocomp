import {
  assertValidChart,
  formatRoot,
  pcToRoot,
  sectionFromBarSymbols,
  type Chart,
  type Root,
  type TimeSignature,
} from '../music'
import type { StyleId } from '../style'
import { mulberry32, seedFromString } from '../variation'
import { degreeChord } from './degree'
import { styleGenerateHints } from './styleHints'

export type ChordDensity = 1 | 2

export type RandomChartOptions = {
  /** Concert key; when omitted, chosen from the seed. */
  key?: Root
  /** Bars in the form (clamped to 8 / 12 / 16). */
  barCount?: number
  timeSignature?: TimeSignature
  /** Target chords per bar (1 = held, 2 = split). */
  chordDensity?: ChordDensity
  /** 0–1 chance the chart is major-mode biased (default 0.7). */
  majorBias?: number
  /** Prefer ii–V gravity cells (default true). */
  preferIiV?: boolean
  /** Max consecutive non-diatonic bars before forcing a diatonic landing (default 2). */
  maxNonDiatonicStreak?: number
  styleId?: StyleId
  seed?: number
}

const KEY_PCS = [0, 2, 4, 5, 7, 9, 10] as const // C D E F G A Bb

function clampBarCount(n: number | undefined): 8 | 12 | 16 {
  if (n === 12 || n === 16) return n
  return 8
}

function clampDensity(n: ChordDensity | undefined): ChordDensity {
  return n === 2 ? 2 : 1
}

function pickKey(rng: () => number, preferSharps: boolean): Root {
  const pc = KEY_PCS[Math.floor(rng() * KEY_PCS.length)]!
  return pcToRoot(pc, preferSharps)
}

function diatonicSymbol(
  key: Root,
  degree: number,
  mode: 'major' | 'minor',
  preferSharps: boolean,
): string {
  return degreeChord(key, degree, mode, undefined, preferSharps)
}

function secondaryDominant(
  key: Root,
  targetDegree: number,
  mode: 'major' | 'minor',
  preferSharps: boolean,
): string {
  // V7 of the target degree — build as degree 5 of that chord's root as tonic.
  const target = degreeChord(key, targetDegree, mode, 'maj7', preferSharps)
  // Simpler: use scale degree a fifth above target within the key's chromatic via degreeChord of target root.
  // degree 5 of key transposed: V/ii = VI7 in major, etc. Use dominant quality on degree (targetDegree + 4) % 7.
  const domDegree = ((targetDegree + 3) % 7) + 1 // fifth above target
  void target
  return degreeChord(key, domDegree, mode, '7', preferSharps)
}

type Cell = { symbols: string[]; diatonic: boolean }

function iiVCell(
  key: Root,
  mode: 'major' | 'minor',
  preferSharps: boolean,
  density: ChordDensity,
): Cell[] {
  const ii = diatonicSymbol(key, 2, mode, preferSharps)
  const V = diatonicSymbol(key, 5, mode, preferSharps)
  if (density === 2) {
    return [{ symbols: [ii, V], diatonic: true }]
  }
  return [
    { symbols: [ii], diatonic: true },
    { symbols: [V], diatonic: true },
  ]
}

function cadenceCell(
  key: Root,
  mode: 'major' | 'minor',
  preferSharps: boolean,
  density: ChordDensity,
): Cell[] {
  const tonic = diatonicSymbol(key, 1, mode, preferSharps)
  const lead = iiVCell(key, mode, preferSharps, density)
  return [...lead, { symbols: [tonic], diatonic: true }]
}

function diatonicBar(
  key: Root,
  mode: 'major' | 'minor',
  preferSharps: boolean,
  rng: () => number,
  density: ChordDensity,
): Cell {
  const degree = 1 + Math.floor(rng() * 7)
  const sym = diatonicSymbol(key, degree, mode, preferSharps)
  if (density === 2 && rng() < 0.5) {
    const d2 = 1 + Math.floor(rng() * 7)
    return {
      symbols: [sym, diatonicSymbol(key, d2, mode, preferSharps)],
      diatonic: true,
    }
  }
  return { symbols: [sym], diatonic: true }
}

function nonDiatonicBar(
  key: Root,
  mode: 'major' | 'minor',
  preferSharps: boolean,
  rng: () => number,
): Cell {
  const target = 1 + Math.floor(rng() * 7)
  return {
    symbols: [secondaryDominant(key, target, mode, preferSharps)],
    diatonic: false,
  }
}

/**
 * Constrained fully-random practice chart.
 * Prefer ii–V gravity and cap non-diatonic streaks so results stay playable.
 */
export function generateRandomChart(options: RandomChartOptions = {}): Chart {
  const styleId: StyleId = options.styleId ?? 'jazz-swing'
  const hints = styleGenerateHints(styleId)
  const seed =
    options.seed ??
    seedFromString(`random:${Date.now()}:${Math.floor(Math.random() * 1e9)}`)
  const rng = mulberry32(seed >>> 0)
  const preferSharps = hints.preferSharps
  const key = options.key ?? pickKey(rng, preferSharps)
  const barCount = clampBarCount(options.barCount)
  const density = clampDensity(options.chordDensity)
  const majorBias = options.majorBias ?? 0.7
  const preferIiV = options.preferIiV ?? true
  const maxWild = Math.max(0, options.maxNonDiatonicStreak ?? 2)
  const mode: 'major' | 'minor' = rng() < majorBias ? 'major' : 'minor'
  const timeSignature: TimeSignature = options.timeSignature ?? {
    numerator: 4,
    denominator: 4,
  }
  // 3/4 charts stay single-chord-per-bar (beat budget).
  const effectiveDensity: ChordDensity =
    timeSignature.numerator < 4 ? 1 : density

  const cells: Cell[] = []
  let wildStreak = 0
  while (cells.length < barCount) {
    const remaining = barCount - cells.length
    let next: Cell[] = []
    if (preferIiV && remaining >= 3 && rng() < 0.45) {
      next = cadenceCell(key, mode, preferSharps, effectiveDensity).slice(
        0,
        remaining,
      )
    } else if (preferIiV && remaining >= 1 && rng() < 0.35) {
      next = iiVCell(key, mode, preferSharps, effectiveDensity).slice(0, remaining)
    } else if (wildStreak < maxWild && rng() < 0.22) {
      next = [nonDiatonicBar(key, mode, preferSharps, rng)]
    } else {
      next = [diatonicBar(key, mode, preferSharps, rng, effectiveDensity)]
    }
    for (const cell of next) {
      if (cells.length >= barCount) break
      cells.push(cell)
      wildStreak = cell.diatonic ? 0 : wildStreak + 1
    }
  }

  const bars = cells.slice(0, barCount).map((c) => c.symbols)
  const id = `gen-random-${formatRoot(key).toLowerCase().replaceAll('#', 's')}-${seed >>> 0}`
  const chart: Chart = {
    version: 1,
    id,
    title: `Random ${mode === 'major' ? 'major' : 'minor'} in ${formatRoot(key)}`,
    key,
    timeSignature,
    defaultTempoBpm: hints.suggestedTempoBpm,
    styleHint: styleId,
    form: ['A'],
    sections: [sectionFromBarSymbols('A', 'A', bars, timeSignature)],
    notes: `Seeded random chart (${seed >>> 0})`,
  }
  assertValidChart(chart)
  return chart
}
