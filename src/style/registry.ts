import { createBalladStyle } from './ballad'
import { createBossaStyle } from './bossa'
import { createLatinStyle } from './latin'
import { createJazzSwingStyle } from './swing'
import type { StyleEngine } from './types'

export type StyleId = 'jazz-swing' | 'bossa' | 'ballad' | 'latin'

export type StyleDescriptor = {
  id: StyleId
  label: string
  blurb: string
  /** Suggested default tempo when the user picks this style. */
  suggestedTempoBpm: number
  create: () => StyleEngine
}

export const STYLE_PACK: readonly StyleDescriptor[] = [
  {
    id: 'jazz-swing',
    label: 'Jazz Swing',
    blurb: 'Walking bass, guide-tone comps, swing ride',
    suggestedTempoBpm: 120,
    create: createJazzSwingStyle,
  },
  {
    id: 'bossa',
    label: 'Bossa Nova',
    blurb: 'Root–fifth bass, soft syncopated shells, light hats',
    suggestedTempoBpm: 110,
    create: createBossaStyle,
  },
  {
    id: 'ballad',
    label: 'Ballad',
    blurb: 'Sparse bass, sustained piano, soft pulse',
    suggestedTempoBpm: 70,
    create: createBalladStyle,
  },
  {
    id: 'latin',
    label: 'Latin',
    blurb: 'Tumbao bass, montuno shells, clave skeleton',
    suggestedTempoBpm: 180,
    create: createLatinStyle,
  },
] as const

export function getStyleDescriptor(id: string): StyleDescriptor {
  return STYLE_PACK.find((s) => s.id === id) ?? STYLE_PACK[0]!
}

export function createStyleById(id: string): StyleEngine {
  return getStyleDescriptor(id).create()
}

export function isStyleId(value: string): value is StyleId {
  return STYLE_PACK.some((s) => s.id === value)
}
