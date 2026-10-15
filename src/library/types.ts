import type { Chart } from '../music'
import type { StyleId } from '../style'

export type TuneTag =
  | 'jazz'
  | 'blues'
  | 'bossa'
  | 'ballad'
  | 'latin'
  | 'major'
  | 'minor'
  | 'ii-v-i'
  | 'turnaround'
  | 'rhythm'
  | 'practice'

export type TuneEntry = {
  id: string
  title: string
  /** Short blurb shown in the library list. */
  blurb: string
  tags: readonly TuneTag[]
  /** Preferred backing style when loading the tune. */
  styleId: StyleId
  createChart: () => Chart
}
