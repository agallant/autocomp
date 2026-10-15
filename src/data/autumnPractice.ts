import {
  assertValidChart,
  sectionFromBarSymbols,
  type Chart,
} from '../music'

/** Demo ii–V–I family chart used by the M0/M1 shell. */
export function createAutumnPracticeChart(): Chart {
  const chart: Chart = {
    version: 1,
    id: 'autumn-practice',
    title: 'Autumn Practice',
    key: { letter: 'C', accidental: 0 },
    timeSignature: { numerator: 4, denominator: 4 },
    defaultTempoBpm: 120,
    styleHint: 'swing',
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
  }
  assertValidChart(chart)
  return chart
}
