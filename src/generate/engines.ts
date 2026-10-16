import {
  assertValidChart,
  formatRoot,
  sectionFromBarSymbols,
  transposeRoot,
  type Chart,
  type Root,
} from '../music'
import type { StyleId } from '../style'
import { degreeChord } from './degree'
import { styleGenerateHints } from './styleHints'

export type EngineKind = 'ii-v-chain' | 'rhythm-a' | 'coltrane'

export type EngineOptions = {
  kind: EngineKind
  key: Root
  styleId: StyleId
  /** Target bar count (clamped per engine). */
  length?: number
  preferSharps?: boolean
}

export const ENGINE_CATALOG: ReadonlyArray<{
  id: EngineKind
  label: string
  blurb: string
}> = [
  { id: 'ii-v-chain', label: 'ii–V chain', blurb: 'Descending fourths cadences' },
  { id: 'rhythm-a', label: 'Rhythm A', blurb: 'Rhythm-changes A section lab' },
  { id: 'coltrane', label: 'Coltrane matrix', blurb: 'Major-thirds tonic cycle' },
]

function clampLength(kind: EngineKind, n: number | undefined): number {
  const raw = n ?? (kind === 'rhythm-a' ? 8 : 12)
  if (kind === 'rhythm-a') return raw <= 8 ? 8 : 16
  if (kind === 'coltrane') return raw <= 8 ? 8 : 16
  // ii–V chain: even bar counts 8–16
  if (raw <= 8) return 8
  if (raw <= 12) return 12
  return 16
}

function slugKey(key: Root): string {
  return formatRoot(key).toLowerCase().replaceAll('#', 's')
}

function build(
  id: string,
  title: string,
  key: Root,
  styleId: StyleId,
  tempo: number,
  bars: string[][],
): Chart {
  const chart: Chart = {
    version: 1,
    id,
    title,
    key,
    timeSignature: { numerator: 4, denominator: 4 },
    defaultTempoBpm: tempo,
    styleHint: styleId,
    form: ['A'],
    sections: [sectionFromBarSymbols('A', 'A', bars)],
    notes: 'Harmonic engine',
  }
  assertValidChart(chart)
  return chart
}

/** Extended major or minor ii–V(–I) chain by ascending fourths (circle). */
export function iiVChainBars(
  key: Root,
  length: number,
  mode: 'major' | 'minor',
  preferSharps: boolean,
): string[][] {
  const bars: string[][] = []
  let tonic = key
  while (bars.length < length) {
    const ii = degreeChord(tonic, 2, mode, undefined, preferSharps)
    const V = degreeChord(tonic, 5, mode, '7', preferSharps)
    bars.push([ii], [V])
    if (bars.length + 1 <= length && bars.length % 6 === 4) {
      const I = degreeChord(
        tonic,
        1,
        mode,
        mode === 'major' ? 'maj7' : 'm7',
        preferSharps,
      )
      bars.push([I], [I])
    }
    // Next cell tonic up a fourth.
    tonic = transposeRoot(tonic, 5, preferSharps)
  }
  return bars.slice(0, length)
}

/** Educational rhythm-changes A (I–VI–ii–V family), not a copyrighted bridge. */
export function rhythmABars(key: Root, length: number, preferSharps: boolean): string[][] {
  const I = degreeChord(key, 1, 'major', 'maj7', preferSharps)
  const VI7 = degreeChord(key, 6, 'major', '7', preferSharps)
  const ii = degreeChord(key, 2, 'major', undefined, preferSharps)
  const V = degreeChord(key, 5, 'major', '7', preferSharps)
  const iii = degreeChord(key, 3, 'major', undefined, preferSharps)
  const unit: string[][] = [
    [I, VI7],
    [ii, V],
    [I, VI7],
    [ii, V],
    [I, iii],
    [VI7, ii],
    [I, VI7],
    [ii, V],
  ]
  const bars: string[][] = []
  while (bars.length < length) bars.push(...unit)
  return bars.slice(0, length)
}

/**
 * Coltrane / Giant Steps–style major-thirds matrix (educational cycle).
 * Tonics: key → −4 → −8 semitones, each approached by its V7.
 */
export function coltraneBars(key: Root, length: number, preferSharps: boolean): string[][] {
  // Spell the −4 tonic with flats (C→Ab, not G#) so the matrix matches common lab notation.
  const tonics: Root[] = [
    key,
    transposeRoot(key, -4, false),
    transposeRoot(key, -8, preferSharps),
  ]
  const unit: string[][] = []
  for (const tonic of tonics) {
    const sharpBias = tonic.accidental >= 0
    const V = degreeChord(tonic, 5, 'major', '7', sharpBias)
    const I = degreeChord(tonic, 1, 'major', 'maj7', sharpBias)
    unit.push([V], [I])
  }
  // Close with ii–V of home key
  unit.push(
    [degreeChord(key, 2, 'major', undefined, preferSharps)],
    [degreeChord(key, 5, 'major', '7', preferSharps)],
  )
  const bars: string[][] = []
  while (bars.length < length) bars.push(...unit)
  return bars.slice(0, length)
}

/** Build a chart from a harmonic rule engine. */
export function generateEngine(options: EngineOptions): Chart {
  const hints = styleGenerateHints(options.styleId)
  const preferSharps = options.preferSharps ?? hints.preferSharps
  const length = clampLength(options.kind, options.length)
  const label = ENGINE_CATALOG.find((e) => e.id === options.kind)?.label ?? options.kind
  let bars: string[][]
  switch (options.kind) {
    case 'ii-v-chain':
      bars = iiVChainBars(options.key, length, 'major', preferSharps)
      break
    case 'rhythm-a':
      bars = rhythmABars(options.key, length, preferSharps)
      break
    case 'coltrane':
      bars = coltraneBars(options.key, length, preferSharps)
      break
  }
  const id = `gen-${options.kind}-${slugKey(options.key)}-${options.styleId}-${length}`
  return build(
    id,
    `${hints.titlePrefix} ${label} in ${formatRoot(options.key)}`,
    options.key,
    options.styleId,
    hints.suggestedTempoBpm,
    bars,
  )
}
