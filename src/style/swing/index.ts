import type { StyleEngine, StyleNote } from '../types'
import { realizeSwingDrums } from './drums'
import { realizePianoComp } from './pianoComp'
import { realizeWalkingBass } from './walkingBass'

export function createJazzSwingStyle(): StyleEngine {
  return {
    id: 'jazz-swing',
    label: 'Jazz Swing',
    realizeBar(ctx): StyleNote[] {
      return [
        ...realizeWalkingBass(ctx),
        ...realizePianoComp(ctx),
        ...realizeSwingDrums(ctx),
      ]
    },
  }
}

export { realizeWalkingBass } from './walkingBass'
export { realizePianoComp, shellVoicing } from './pianoComp'
export { realizeSwingDrums } from './drums'
