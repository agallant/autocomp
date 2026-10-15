import { assertValidChart, sectionFromBarSymbols, type Chart, type Root } from '../music'

const C: Root = { letter: 'C', accidental: 0 }
const F: Root = { letter: 'F', accidental: 0 }
const BB: Root = { letter: 'B', accidental: -1 }
const D: Root = { letter: 'D', accidental: 0 }

function chart(partial: Omit<Chart, 'version'>): Chart {
  const next: Chart = { version: 1, ...partial }
  assertValidChart(next)
  return next
}

/** Demo ii–V–I family chart used by the M0/M1 shell. */
export function createAutumnPracticeChart(): Chart {
  return chart({
    id: 'autumn-practice',
    title: 'Autumn Practice',
    key: C,
    timeSignature: { numerator: 4, denominator: 4 },
    defaultTempoBpm: 120,
    styleHint: 'jazz-swing',
    form: ['A'],
    sections: [
      sectionFromBarSymbols('A', 'A', [
        ['Dm7'],
        ['G7'],
        ['Cmaj7'],
        ['A7'],
        ['Dm7'],
        ['G7'],
        ['Cmaj7'],
        ['Cmaj7'],
      ]),
    ],
  })
}

/** Twelve-bar dominant blues for walking-bass practice. */
export function createBluesWorkshopChart(): Chart {
  return chart({
    id: 'blues-workshop',
    title: 'Blues Workshop',
    key: F,
    timeSignature: { numerator: 4, denominator: 4 },
    defaultTempoBpm: 112,
    styleHint: 'jazz-swing',
    form: ['A'],
    sections: [
      sectionFromBarSymbols('A', 'A', [
        ['F7'],
        ['Bb7'],
        ['F7'],
        ['F7'],
        ['Bb7'],
        ['Bb7'],
        ['F7'],
        ['D7'],
        ['Gm7'],
        ['C7'],
        ['F7'],
        ['C7'],
      ]),
    ],
  })
}

/** Minor ii–V–i cycle in C minor. */
export function createMinorPathChart(): Chart {
  return chart({
    id: 'minor-path',
    title: 'Minor Path',
    key: { letter: 'C', accidental: 0 },
    timeSignature: { numerator: 4, denominator: 4 },
    defaultTempoBpm: 100,
    styleHint: 'jazz-swing',
    form: ['A'],
    sections: [
      sectionFromBarSymbols('A', 'A', [
        ['Dm7b5'],
        ['G7b9'],
        ['Cm7'],
        ['Cm7'],
        ['Fm7'],
        ['Bb7'],
        ['Ebmaj7'],
        ['A7b9'],
        ['Dm7b5'],
        ['G7b9'],
        ['Cm7'],
        ['G7'],
      ]),
    ],
  })
}

/** Soft major cycle suited to bossa nova. */
export function createBossaLoopChart(): Chart {
  return chart({
    id: 'bossa-loop',
    title: 'Bossa Loop',
    key: C,
    timeSignature: { numerator: 4, denominator: 4 },
    defaultTempoBpm: 108,
    styleHint: 'bossa',
    form: ['A'],
    sections: [
      sectionFromBarSymbols('A', 'A', [
        ['Cmaj7'],
        ['Cmaj7'],
        ['Bm7b5'],
        ['E7'],
        ['Am7'],
        ['D7'],
        ['Dm7'],
        ['G7'],
        ['Cmaj7'],
        ['A7'],
        ['Dm7'],
        ['G7'],
      ]),
    ],
  })
}

/** Sparse ballad shells with long holds. */
export function createBalladHoldsChart(): Chart {
  return chart({
    id: 'ballad-holds',
    title: 'Ballad Holds',
    key: BB,
    timeSignature: { numerator: 4, denominator: 4 },
    defaultTempoBpm: 68,
    styleHint: 'ballad',
    form: ['A'],
    sections: [
      sectionFromBarSymbols('A', 'A', [
        ['Bbmaj7'],
        ['Bbmaj7'],
        ['Gm7'],
        ['Gm7'],
        ['Cm7'],
        ['F7'],
        ['Bbmaj7'],
        ['Bbmaj7'],
        ['Ebmaj7'],
        ['Edim7'],
        ['Dm7'],
        ['G7'],
        ['Cm7'],
        ['F7'],
        ['Bbmaj7'],
        ['F7'],
      ]),
    ],
  })
}

/**
 * Educational AABA workshop form based on common I–VI7–ii–V practice patterns.
 * Original practice material — not a copyrighted standard.
 */
export function createRhythmLabChart(): Chart {
  const a = sectionFromBarSymbols('A', 'A', [
    ['Bbmaj7'],
    ['G7'],
    ['Cm7'],
    ['F7'],
    ['Dm7'],
    ['G7'],
    ['Cm7'],
    ['F7'],
  ])
  const b = sectionFromBarSymbols('B', 'B', [
    ['D7'],
    ['D7'],
    ['G7'],
    ['G7'],
    ['C7'],
    ['C7'],
    ['F7'],
    ['F7'],
  ])
  return chart({
    id: 'rhythm-lab',
    title: 'Rhythm Lab',
    key: BB,
    timeSignature: { numerator: 4, denominator: 4 },
    defaultTempoBpm: 160,
    styleHint: 'jazz-swing',
    form: ['A', 'A', 'B', 'A'],
    sections: [a, b],
  })
}

/** Short turnaround drill for endings and intros. */
export function createTurnaroundDrillChart(): Chart {
  return chart({
    id: 'turnaround-drill',
    title: 'Turnaround Drill',
    key: C,
    timeSignature: { numerator: 4, denominator: 4 },
    defaultTempoBpm: 140,
    styleHint: 'jazz-swing',
    form: ['A'],
    sections: [
      sectionFromBarSymbols('A', 'A', [
        ['Cmaj7', 'A7'],
        ['Dm7', 'G7'],
        ['Cmaj7', 'A7'],
        ['Dm7', 'G7'],
        ['Em7', 'A7'],
        ['Dm7', 'G7'],
        ['Cmaj7'],
        ['G7'],
      ]),
    ],
  })
}

/** Two-chord latin vamp with a short bridge. */
export function createLatinClaveChart(): Chart {
  return chart({
    id: 'latin-clave',
    title: 'Latin Clave',
    key: D,
    timeSignature: { numerator: 4, denominator: 4 },
    defaultTempoBpm: 180,
    styleHint: 'latin',
    form: ['A', 'B', 'A'],
    sections: [
      sectionFromBarSymbols('A', 'A', [
        ['Dm7'],
        ['Dm7'],
        ['G7'],
        ['G7'],
        ['Dm7'],
        ['Dm7'],
        ['A7'],
        ['A7'],
      ]),
      sectionFromBarSymbols('B', 'B', [
        ['Bbmaj7'],
        ['A7'],
        ['Dm7'],
        ['Dm7'],
      ]),
    ],
  })
}
