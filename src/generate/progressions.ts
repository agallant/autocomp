import {
  assertValidChart,
  formatRoot,
  sectionFromBarSymbols,
  type Chart,
  type Root,
} from '../music'
import type { StyleId } from '../style'
import { degreeChord } from './degree'
import { generateRandomChart } from './randomChart'
import { styleGenerateHints } from './styleHints'
import type { GenerateProgressionOptions, ProgressionDescriptor, ProgressionKind } from './types'

export const PROGRESSION_CATALOG: ProgressionDescriptor[] = [
  { id: 'ii-v-i', label: 'ii–V–I', blurb: 'Major cadence loop' },
  { id: 'minor-ii-v-i', label: 'iiø–V–i', blurb: 'Minor cadence loop' },
  { id: 'turnaround', label: 'Turnaround', blurb: 'I–vi–ii–V cycle' },
  { id: 'blues', label: 'Blues', blurb: '12-bar dominant blues' },
  { id: 'vamp', label: 'Vamp', blurb: 'Style-flavored short loop' },
  { id: 'random', label: 'Full random', blurb: 'Constrained random harmony' },
]

function slugKey(key: Root): string {
  // Flat accidentals stay as `b`; sharps become `s` for URL/id-safe slugs.
  return formatRoot(key).toLowerCase().replaceAll('#', 's')
}

let generateSeq = 0

function uniqueSuffix(): string {
  generateSeq += 1
  return `${Date.now().toString(36)}-${generateSeq.toString(36)}`
}

function buildChart(
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
    notes: 'Generated progression',
  }
  assertValidChart(chart)
  return chart
}

function iiVIBars(key: Root, preferSharps: boolean): string[][] {
  const ii = degreeChord(key, 2, 'major', undefined, preferSharps)
  const V = degreeChord(key, 5, 'major', '7', preferSharps)
  const I = degreeChord(key, 1, 'major', 'maj7', preferSharps)
  return [[ii], [V], [I], [I], [ii], [V], [I], [I]]
}

function minorIiVIBars(key: Root, preferSharps: boolean): string[][] {
  const ii = degreeChord(key, 2, 'minor', 'm7b5', preferSharps)
  const V = degreeChord(key, 5, 'minor', '7', preferSharps)
  const i = degreeChord(key, 1, 'minor', 'm7', preferSharps)
  return [[ii], [V], [i], [i], [ii], [V], [i], [i]]
}

function turnaroundBars(key: Root, preferSharps: boolean): string[][] {
  const I = degreeChord(key, 1, 'major', 'maj7', preferSharps)
  const vi = degreeChord(key, 6, 'major', undefined, preferSharps)
  const ii = degreeChord(key, 2, 'major', undefined, preferSharps)
  const V = degreeChord(key, 5, 'major', '7', preferSharps)
  return [
    [I, vi],
    [ii, V],
    [I, vi],
    [ii, V],
    [I, vi],
    [ii, V],
    [I],
    [V],
  ]
}

function bluesBars(key: Root, preferSharps: boolean): string[][] {
  const I7 = degreeChord(key, 1, 'major', '7', preferSharps)
  const IV7 = degreeChord(key, 4, 'major', '7', preferSharps)
  const V7 = degreeChord(key, 5, 'major', '7', preferSharps)
  return [
    [I7],
    [I7],
    [I7],
    [I7],
    [IV7],
    [IV7],
    [I7],
    [I7],
    [V7],
    [IV7],
    [I7],
    [V7],
  ]
}

/**
 * Style-flavored short vamp — latin leans minor, ballad holds I, bossa ii–V,
 * swing uses a bluesy I–VI7–ii–V.
 */
function vampBars(key: Root, styleId: StyleId, preferSharps: boolean): string[][] {
  if (styleId === 'latin') {
    const i = degreeChord(key, 1, 'minor', 'm7', preferSharps)
    const iv = degreeChord(key, 4, 'minor', 'm7', preferSharps)
    const V7 = degreeChord(key, 5, 'minor', '7', preferSharps)
    return [[i], [i], [iv], [V7], [i], [i], [iv], [V7]]
  }
  if (styleId === 'ballad') {
    const I = degreeChord(key, 1, 'major', 'maj7', preferSharps)
    const IV = degreeChord(key, 4, 'major', 'maj7', preferSharps)
    return [[I], [I], [IV], [I], [I], [I], [IV], [I]]
  }
  if (styleId === 'bossa') {
    const ii = degreeChord(key, 2, 'major', undefined, preferSharps)
    const V = degreeChord(key, 5, 'major', '7', preferSharps)
    const I = degreeChord(key, 1, 'major', 'maj7', preferSharps)
    return [[ii, V], [I], [ii, V], [I], [ii, V], [I], [ii, V], [I]]
  }
  // jazz-swing default vamp
  const I = degreeChord(key, 1, 'major', 'maj7', preferSharps)
  const VI7 = degreeChord(key, 6, 'major', '7', preferSharps)
  const ii = degreeChord(key, 2, 'major', undefined, preferSharps)
  const V = degreeChord(key, 5, 'major', '7', preferSharps)
  return [
    [I, VI7],
    [ii, V],
    [I, VI7],
    [ii, V],
    [I, VI7],
    [ii, V],
    [I],
    [V],
  ]
}

function barsForKind(
  kind: Exclude<ProgressionKind, 'random'>,
  key: Root,
  styleId: StyleId,
  preferSharps: boolean,
): string[][] {
  switch (kind) {
    case 'ii-v-i':
      return iiVIBars(key, preferSharps)
    case 'minor-ii-v-i':
      return minorIiVIBars(key, preferSharps)
    case 'turnaround':
      return turnaroundBars(key, preferSharps)
    case 'blues':
      return bluesBars(key, preferSharps)
    case 'vamp':
      return vampBars(key, styleId, preferSharps)
  }
}

function titleFor(kind: ProgressionKind, key: Root, styleId: StyleId): string {
  const hints = styleGenerateHints(styleId)
  const label = PROGRESSION_CATALOG.find((p) => p.id === kind)?.label ?? kind
  return `${hints.titlePrefix} ${label} in ${formatRoot(key)}`
}

/** Build a valid practice chart for the requested progression + style. */
export function generateProgression(options: GenerateProgressionOptions): Chart {
  if (options.kind === 'random') {
    return generateRandomChart({
      key: options.key,
      styleId: options.styleId,
      preferIiV: options.preferIiV ?? true,
      maxNonDiatonicStreak: 2,
      ...(options.barCount !== undefined ? { barCount: options.barCount } : {}),
      ...(options.chordDensity !== undefined
        ? { chordDensity: options.chordDensity }
        : {}),
      ...(options.majorBias !== undefined ? { majorBias: options.majorBias } : {}),
      ...(options.seed !== undefined ? { seed: options.seed } : {}),
    })
  }
  const hints = styleGenerateHints(options.styleId)
  const preferSharps = options.preferSharps ?? hints.preferSharps
  const bars = barsForKind(options.kind, options.key, options.styleId, preferSharps)
  // Unique suffix so repeated Generate + Save does not overwrite prior charts.
  const id = `gen-${options.kind}-${slugKey(options.key)}-${options.styleId}-${uniqueSuffix()}`
  return buildChart(
    id,
    titleFor(options.kind, options.key, options.styleId),
    options.key,
    options.styleId,
    hints.suggestedTempoBpm,
    bars,
  )
}
