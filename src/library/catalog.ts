import {
  createAutumnPracticeChart,
  createBalladHoldsChart,
  createBluesWorkshopChart,
  createBossaLoopChart,
  createLatinClaveChart,
  createMinorPathChart,
  createRhythmLabChart,
  createTurnaroundDrillChart,
} from '../data/practiceCharts'
import { PRACTICE_PACK_V2 } from '../data/practicePackV2'
import type { TuneEntry, TuneTag } from './types'

/** Core Practice assortment (default landing shelf). */
const PRACTICE_CORE: readonly TuneEntry[] = [
  {
    id: 'autumn-practice',
    title: 'Autumn Practice',
    blurb: 'Major ii–V–I family in C',
    tags: ['jazz', 'major', 'ii-v-i', 'practice', 'beginner'],
    shelf: 'practice',
    styleId: 'jazz-swing',
    createChart: createAutumnPracticeChart,
  },
  {
    id: 'blues-workshop',
    title: 'Blues Workshop',
    blurb: 'Twelve-bar blues in F',
    tags: ['blues', 'jazz', 'practice', 'beginner', 'long'],
    shelf: 'practice',
    styleId: 'jazz-swing',
    createChart: createBluesWorkshopChart,
  },
  {
    id: 'minor-path',
    title: 'Minor Path',
    blurb: 'Minor ii–V–i and related moves',
    tags: ['jazz', 'minor', 'ii-v-i', 'practice', 'intermediate'],
    shelf: 'practice',
    styleId: 'jazz-swing',
    createChart: createMinorPathChart,
  },
  {
    id: 'bossa-loop',
    title: 'Bossa Loop',
    blurb: 'Soft major cycle for bossa feel',
    tags: ['bossa', 'major', 'practice', 'beginner'],
    shelf: 'practice',
    styleId: 'bossa',
    createChart: createBossaLoopChart,
  },
  {
    id: 'ballad-holds',
    title: 'Ballad Holds',
    blurb: 'Slow shells with long sustains',
    tags: ['ballad', 'jazz', 'practice', 'beginner', 'long'],
    shelf: 'practice',
    styleId: 'ballad',
    createChart: createBalladHoldsChart,
  },
  {
    id: 'rhythm-lab',
    title: 'Rhythm Lab',
    blurb: 'AABA workshop form for up-tempo swing',
    tags: ['jazz', 'rhythm', 'practice', 'intermediate', 'long'],
    shelf: 'practice',
    styleId: 'jazz-swing',
    createChart: createRhythmLabChart,
  },
  {
    id: 'turnaround-drill',
    title: 'Turnaround Drill',
    blurb: 'I–VI–ii–V endings on repeat',
    tags: ['jazz', 'turnaround', 'practice', 'beginner', 'short'],
    shelf: 'practice',
    styleId: 'jazz-swing',
    createChart: createTurnaroundDrillChart,
  },
  {
    id: 'latin-clave',
    title: 'Latin Clave',
    blurb: 'Two-chord vamp with a short bridge',
    tags: ['latin', 'minor', 'practice', 'beginner'],
    shelf: 'practice',
    styleId: 'latin',
    createChart: createLatinClaveChart,
  },
]

/** Built-in practice progressions (core + M42 pack). */
export const TUNE_LIBRARY: readonly TuneEntry[] = [...PRACTICE_CORE, ...PRACTICE_PACK_V2]

export function getTuneById(id: string): TuneEntry | undefined {
  return TUNE_LIBRARY.find((tune) => tune.id === id)
}

/** Stable tag list for filter UI (catalog order of first appearance). */
export function allLibraryTags(shelf?: TuneEntry['shelf']): TuneTag[] {
  const seen = new Set<TuneTag>()
  const tags: TuneTag[] = []
  for (const tune of TUNE_LIBRARY) {
    if (shelf && tune.shelf !== shelf) continue
    for (const tag of tune.tags) {
      if (seen.has(tag)) continue
      seen.add(tag)
      tags.push(tag)
    }
  }
  return tags
}
