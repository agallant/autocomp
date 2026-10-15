import type { Accidental, NoteLetter, PitchClass, Root } from './types'

const LETTER_PC: Record<NoteLetter, PitchClass> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}

const PC_TO_LETTER: NoteLetter[] = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B']
const PC_ACCIDENTAL: Accidental[] = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0]

export function isPitchClass(value: number): value is PitchClass {
  return Number.isInteger(value) && value >= 0 && value <= 11
}

export function normalizePc(pc: number): PitchClass {
  if (!Number.isFinite(pc) || !Number.isInteger(pc)) {
    throw new Error(`Pitch class must be a finite integer (got ${String(pc)})`)
  }
  return (((pc % 12) + 12) % 12) as PitchClass
}

export function rootToPc(root: Root): PitchClass {
  return normalizePc(LETTER_PC[root.letter] + root.accidental)
}

export function pcToRoot(pc: number, preferSharps = true): Root {
  const n = normalizePc(pc)
  if (preferSharps) {
    return { letter: PC_TO_LETTER[n]!, accidental: PC_ACCIDENTAL[n]! }
  }
  const flats: Record<number, Root> = {
    1: { letter: 'D', accidental: -1 },
    3: { letter: 'E', accidental: -1 },
    6: { letter: 'G', accidental: -1 },
    8: { letter: 'A', accidental: -1 },
    10: { letter: 'B', accidental: -1 },
  }
  return flats[n] ?? { letter: PC_TO_LETTER[n]!, accidental: 0 }
}

export function formatRoot(root: Root): string {
  const accidental =
    root.accidental === 1
      ? '#'
      : root.accidental === 2
        ? '##'
        : root.accidental === -1
          ? 'b'
          : root.accidental === -2
            ? 'bb'
            : ''
  return `${root.letter}${accidental}`
}

export function parseRoot(text: string): Root | null {
  const m = text.trim().match(/^([A-G])(bb|b|##|#)?/)
  if (!m) return null
  const letter = m[1] as NoteLetter
  const acc = m[2]
  const accidental: Accidental =
    acc === '#' ? 1 : acc === '##' ? 2 : acc === 'b' ? -1 : acc === 'bb' ? -2 : 0
  return { letter, accidental }
}

/** Transpose a root by semitone delta. */
export function transposeRoot(root: Root, semitones: number, preferSharps = true): Root {
  if (!Number.isInteger(semitones)) {
    throw new Error(`Transpose semitones must be an integer (got ${String(semitones)})`)
  }
  return pcToRoot(rootToPc(root) + semitones, preferSharps)
}
