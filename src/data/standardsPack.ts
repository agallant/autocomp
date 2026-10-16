import {
  assertValidChart,
  sectionFromBarSymbols,
  type Chart,
  type Root,
} from '../music'
import type { StyleId } from '../style'
import type { TuneEntry, TuneTag } from '../library/types'

const C: Root = { letter: 'C', accidental: 0 }
const F: Root = { letter: 'F', accidental: 0 }
const G: Root = { letter: 'G', accidental: 0 }
const BB: Root = { letter: 'B', accidental: -1 }
const D: Root = { letter: 'D', accidental: 0 }
const A: Root = { letter: 'A', accidental: 0 }
const E: Root = { letter: 'E', accidental: 0 }

type Spec = {
  id: string
  title: string
  blurb: string
  tags: readonly TuneTag[]
  key: Root
  tempo: number
  styleId: StyleId
  form?: readonly string[]
  clearance: 'public-domain traditional' | 'stock educational progression'
  sectionBars: readonly {
    id: string
    label: string
    bars: readonly (readonly string[])[]
  }[]
}

function chartFromSpec(spec: Spec): Chart {
  const chart: Chart = {
    version: 1,
    id: spec.id,
    title: spec.title,
    key: spec.key,
    timeSignature: { numerator: 4, denominator: 4 },
    defaultTempoBpm: spec.tempo,
    styleHint: spec.styleId,
    form: [...(spec.form ?? spec.sectionBars.map((s) => s.id))],
    sections: spec.sectionBars.map((s) =>
      sectionFromBarSymbols(
        s.id,
        s.label,
        s.bars.map((row) => [...row]),
      ),
    ),
    notes: `Standards clearance: ${spec.clearance}`,
  }
  assertValidChart(chart)
  return chart
}

function entry(spec: Spec): TuneEntry {
  return {
    id: spec.id,
    title: spec.title,
    blurb: spec.blurb,
    tags: spec.tags,
    shelf: 'standards',
    styleId: spec.styleId,
    createChart: () => chartFromSpec(spec),
  }
}

/** Cleared Standards-shelf charts (see docs/STANDARDS_CLEARANCE.md). */
export const STANDARDS_PACK: readonly TuneEntry[] = [
  entry({
    id: 'std-greensleeves',
    title: 'Greensleeves',
    blurb: 'Traditional minor modal form',
    tags: ['standard', 'traditional', 'minor', 'ballad', 'modal'],
    key: E,
    tempo: 88,
    styleId: 'ballad',
    clearance: 'public-domain traditional',
    form: ['A', 'B'],
    sectionBars: [
      {
        id: 'A',
        label: 'A',
        bars: [
          ['Em'],
          ['D'],
          ['C'],
          ['B7'],
          ['Em'],
          ['D'],
          ['C'],
          ['B7'],
        ],
      },
      {
        id: 'B',
        label: 'B',
        bars: [
          ['Am'],
          ['G'],
          ['Am'],
          ['B7'],
          ['Em'],
          ['D'],
          ['C'],
          ['B7'],
        ],
      },
    ],
  }),
  entry({
    id: 'std-st-james',
    title: 'St. James Infirmary',
    blurb: 'Traditional minor blues lament',
    tags: ['standard', 'traditional', 'blues', 'minor', 'jazz'],
    key: D,
    tempo: 92,
    styleId: 'jazz-swing',
    clearance: 'public-domain traditional',
    sectionBars: [
      {
        id: 'A',
        label: 'A',
        bars: [
          ['Dm'],
          ['A7'],
          ['Dm'],
          ['Dm'],
          ['Gm'],
          ['Dm'],
          ['E7'],
          ['A7'],
          ['Dm'],
          ['A7'],
          ['Dm'],
          ['A7'],
        ],
      },
    ],
  }),
  entry({
    id: 'std-careless-love',
    title: 'Careless Love',
    blurb: 'Traditional major blues-ballad changes',
    tags: ['standard', 'traditional', 'blues', 'major', 'jazz'],
    key: F,
    tempo: 100,
    styleId: 'jazz-swing',
    clearance: 'public-domain traditional',
    sectionBars: [
      {
        id: 'A',
        label: 'A',
        bars: [
          ['F'],
          ['F'],
          ['C7'],
          ['C7'],
          ['F'],
          ['F7'],
          ['Bb'],
          ['Bbm'],
          ['F'],
          ['C7'],
          ['F'],
          ['C7'],
        ],
      },
    ],
  }),
  entry({
    id: 'std-house-rising',
    title: 'House of the Rising Sun',
    blurb: 'Traditional folk minor progression',
    tags: ['standard', 'traditional', 'minor', 'ballad'],
    key: A,
    tempo: 76,
    styleId: 'ballad',
    clearance: 'public-domain traditional',
    sectionBars: [
      {
        id: 'A',
        label: 'A',
        bars: [
          ['Am'],
          ['C'],
          ['D'],
          ['F'],
          ['Am'],
          ['C'],
          ['E7'],
          ['E7'],
          ['Am'],
          ['C'],
          ['D'],
          ['F'],
          ['Am'],
          ['E7'],
          ['Am'],
          ['E7'],
        ],
      },
    ],
  }),
  entry({
    id: 'std-amazing-grace',
    title: 'Amazing Grace',
    blurb: 'Traditional hymn cadence form',
    tags: ['standard', 'traditional', 'major', 'ballad'],
    key: G,
    tempo: 72,
    styleId: 'ballad',
    clearance: 'public-domain traditional',
    sectionBars: [
      {
        id: 'A',
        label: 'A',
        bars: [
          ['G'],
          ['G'],
          ['C'],
          ['G'],
          ['G'],
          ['Em'],
          ['A7'],
          ['D7'],
          ['G'],
          ['G'],
          ['C'],
          ['G'],
          ['Em'],
          ['D7'],
          ['G'],
          ['G'],
        ],
      },
    ],
  }),
  entry({
    id: 'std-stock-rhythm-aaba',
    title: 'Stock Rhythm AABA',
    blurb: 'Workshop rhythm-changes skeleton (practice label)',
    tags: ['standard', 'jazz', 'rhythm', 'aaba', 'intermediate'],
    key: BB,
    tempo: 180,
    styleId: 'jazz-swing',
    clearance: 'stock educational progression',
    form: ['A', 'A', 'B', 'A'],
    sectionBars: [
      {
        id: 'A',
        label: 'A',
        bars: [
          ['Bbmaj7', 'G7'],
          ['Cm7', 'F7'],
          ['Bbmaj7', 'G7'],
          ['Cm7', 'F7'],
          ['Fm7', 'Bb7'],
          ['Ebmaj7'],
          ['Cm7', 'F7'],
          ['Bbmaj7'],
        ],
      },
      {
        id: 'B',
        label: 'B',
        bars: [
          ['D7'],
          ['D7'],
          ['G7'],
          ['G7'],
          ['C7'],
          ['C7'],
          ['F7'],
          ['F7'],
        ],
      },
    ],
  }),
  entry({
    id: 'std-long-major-cadence',
    title: 'Long Major Cadence',
    blurb: 'Extended ii–V–I AABA workshop form',
    tags: ['standard', 'jazz', 'ii-v-i', 'aaba', 'major'],
    key: C,
    tempo: 140,
    styleId: 'jazz-swing',
    clearance: 'stock educational progression',
    form: ['A', 'A', 'B', 'A'],
    sectionBars: [
      {
        id: 'A',
        label: 'A',
        bars: [
          ['Dm7'],
          ['G7'],
          ['Cmaj7'],
          ['A7'],
          ['Dm7'],
          ['G7'],
          ['Cmaj7'],
          ['Cmaj7'],
        ],
      },
      {
        id: 'B',
        label: 'B',
        bars: [
          ['Em7'],
          ['A7'],
          ['Dm7'],
          ['G7'],
          ['Em7'],
          ['A7'],
          ['Dm7'],
          ['G7'],
        ],
      },
    ],
  }),
  entry({
    id: 'std-minor-cadence-aaba',
    title: 'Minor Cadence AABA',
    blurb: 'Minor iiø–V–i workshop form',
    tags: ['standard', 'jazz', 'ii-v-i', 'aaba', 'minor'],
    key: C,
    tempo: 120,
    styleId: 'jazz-swing',
    clearance: 'stock educational progression',
    form: ['A', 'A', 'B', 'A'],
    sectionBars: [
      {
        id: 'A',
        label: 'A',
        bars: [
          ['Dm7b5'],
          ['G7b9'],
          ['Cm7'],
          ['Cm7'],
          ['Fm7'],
          ['Bb7'],
          ['Ebmaj7'],
          ['A7b9'],
        ],
      },
      {
        id: 'B',
        label: 'B',
        bars: [
          ['Abmaj7'],
          ['Abmaj7'],
          ['G7'],
          ['G7'],
          ['Cm7'],
          ['F7'],
          ['Dm7b5'],
          ['G7'],
        ],
      },
    ],
  }),
  entry({
    id: 'std-dominant-bridge-lab',
    title: 'Dominant Bridge Lab',
    blurb: 'Circle-of-fifths bridge stock for AABA practice',
    tags: ['standard', 'jazz', 'dominant', 'cycle', 'short'],
    key: BB,
    tempo: 200,
    styleId: 'jazz-swing',
    clearance: 'stock educational progression',
    sectionBars: [
      {
        id: 'A',
        label: 'A',
        bars: [
          ['D7'],
          ['D7'],
          ['G7'],
          ['G7'],
          ['C7'],
          ['C7'],
          ['F7'],
          ['F7'],
        ],
      },
    ],
  }),
  entry({
    id: 'std-ballad-skeleton',
    title: 'Ballad Skeleton',
    blurb: 'Slow I–vi–ii–V stock with holds',
    tags: ['standard', 'jazz', 'ballad', 'turnaround', 'beginner'],
    key: F,
    tempo: 66,
    styleId: 'ballad',
    clearance: 'stock educational progression',
    sectionBars: [
      {
        id: 'A',
        label: 'A',
        bars: [
          ['Fmaj7'],
          ['Fmaj7'],
          ['Dm7'],
          ['Dm7'],
          ['Gm7'],
          ['C7'],
          ['Fmaj7'],
          ['C7'],
          ['Fmaj7'],
          ['A7'],
          ['Dm7'],
          ['G7'],
          ['Gm7'],
          ['C7'],
          ['Fmaj7'],
          ['C7'],
        ],
      },
    ],
  }),
]
