import { transposeChart, type Chart } from '../music'
import { mulberry32, seedFromString, type CompDensity } from '../variation'
import { filterTunes } from './search'
import type { LibraryFilter } from './search'
import type { TuneEntry } from './types'

const DENSITIES: readonly CompDensity[] = ['solo', 'sparse', 'normal', 'dense']

export type PracticeShuffleResult = {
  tune: TuneEntry
  chart: Chart
  /** Semitones applied (0–11). */
  transposeSemitones: number
  density: CompDensity
  /** True when multi-section form was reduced to the first chorus pass. */
  trimmed: boolean
  seed: number
}

/** Pick one tune from a pool using `rng` in [0, 1). */
export function pickPracticeTune(
  tunes: readonly TuneEntry[],
  rng: () => number,
): TuneEntry | undefined {
  if (tunes.length === 0) return undefined
  const index = Math.min(tunes.length - 1, Math.floor(rng() * tunes.length))
  return tunes[index]
}

/** Practice-shelf pool, optionally narrowed by the current library filters. */
export function practicePool(
  tunes: readonly TuneEntry[],
  filter: LibraryFilter = {},
): TuneEntry[] {
  return filterTunes(tunes, { ...filter, shelf: 'practice' })
}

/**
 * Trim AABA (or longer) forms to a single pass of the opening section id.
 * Single-section charts are unchanged.
 */
export function trimPracticeForm(chart: Chart): Chart {
  if (chart.form.length <= 1) return chart
  const firstId = chart.form[0]!
  const section = chart.sections.find((s) => s.id === firstId)
  if (!section) return chart
  return {
    ...chart,
    form: [firstId],
    sections: [{ ...section, bars: section.bars.map((bar) => ({ ...bar, slots: [...bar.slots] })) }],
  }
}

/** Deterministic variant: transpose + density hint + optional form trim. */
export function practiceVariantFromSeed(tune: TuneEntry, seed: number): PracticeShuffleResult {
  const rng = mulberry32(seed >>> 0)
  const transposeSemitones = Math.floor(rng() * 12)
  const density = DENSITIES[Math.floor(rng() * DENSITIES.length)]!
  const trimmed = rng() < 0.35
  let chart = tune.createChart()
  if (transposeSemitones !== 0) {
    chart = transposeChart(chart, transposeSemitones)
  }
  if (trimmed) {
    chart = trimPracticeForm(chart)
  }
  // Keep a stable id for the session while reflecting the source tune.
  chart = {
    ...chart,
    id: `${tune.id}~v${seed >>> 0}`,
    title:
      transposeSemitones === 0 && !trimmed
        ? chart.title
        : `${tune.title} (shuffle)`,
  }
  return { tune, chart, transposeSemitones, density, trimmed, seed: seed >>> 0 }
}

/** One-click shuffle: random pick from pool + seeded variant. */
export function shufflePractice(
  tunes: readonly TuneEntry[],
  opts: {
    filter?: LibraryFilter
    /** Wall-clock or caller-provided entropy; mixed with tune id for the variant seed. */
    entropy?: number
    rng?: () => number
  } = {},
): PracticeShuffleResult | undefined {
  const pool = practicePool(tunes, opts.filter ?? {})
  const rng = opts.rng ?? mulberry32((opts.entropy ?? Date.now()) >>> 0)
  const tune = pickPracticeTune(pool, rng)
  if (!tune) return undefined
  const entropy = (opts.entropy ?? Date.now()) >>> 0
  const seed = seedFromString(`${tune.id}:${entropy}`)
  return practiceVariantFromSeed(tune, seed)
}
