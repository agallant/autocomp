import { normalizePc, rootToPc, transposeRoot } from './pitch'
import { preferSharpsForKeyPc } from './transpose'
import type { Root } from './types'

/** Concert-pitch charts with a display transpose for horn players (iReal-style). */
export type InstrumentId = 'concert' | 'bb' | 'eb' | 'f'

export const INSTRUMENTS: ReadonlyArray<{
  id: InstrumentId
  label: string
  /** Semitones to add for written (display) pitch. */
  semitones: number
}> = [
  { id: 'concert', label: 'Concert C', semitones: 0 },
  { id: 'bb', label: 'B♭ (tenor / trumpet)', semitones: 2 },
  { id: 'eb', label: 'E♭ (alto / bari)', semitones: 9 },
  { id: 'f', label: 'F (French horn)', semitones: 7 },
]

export function isInstrumentId(value: unknown): value is InstrumentId {
  return INSTRUMENTS.some((item) => item.id === value)
}

export function instrumentSemitones(id: InstrumentId): number {
  return INSTRUMENTS.find((item) => item.id === id)?.semitones ?? 0
}

/** Concert key → written key for the selected instrument. */
export function writtenRoot(concert: Root, semitones: number, minor: boolean): Root {
  if (!semitones) return concert
  const targetPc = normalizePc(rootToPc(concert) + semitones)
  return transposeRoot(concert, semitones, preferSharpsForKeyPc(targetPc, minor))
}
