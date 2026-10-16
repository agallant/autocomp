/**
 * Practice keyboard shortcuts (when focus is not in a form field / chord edit).
 * - Space: play / pause from the selected bar
 * - T: tap tempo
 * - M: toggle metronome click
 * - [ / ]: tempo −10 / +10 (hold: ramp ±1)
 * - - / = (and +): tempo −10 / +10 (hold: ramp ±1)
 * - D: cycle comp density
 * - 1–4: Solo / Sparse / Normal / Dense
 */

import type { CompDensity } from '../variation'

export type PracticeKeyAction =
  | 'toggle-play'
  | 'tap-tempo'
  | 'toggle-click'
  | 'tempo-down'
  | 'tempo-up'
  | 'cycle-density'
  | 'set-density-solo'
  | 'set-density-sparse'
  | 'set-density-normal'
  | 'set-density-dense'

export type PracticeKeyContext = {
  /** True when a text/select field has focus. */
  inFormField: boolean
  /** True while the chart chord draft is open. */
  editing: boolean
  /**
   * True when a button has focus — Space should activate the button, not
   * toggle transport.
   */
  spaceOnButton: boolean
  /**
   * True when Ctrl / Meta / Alt is held — leave browser shortcuts alone
   * (e.g. zoom with ⌘/Ctrl + − / +).
   */
  withModifier: boolean
}

const DENSITY_DIGIT_ACTIONS: Readonly<Record<string, PracticeKeyAction>> = {
  '1': 'set-density-solo',
  '2': 'set-density-sparse',
  '3': 'set-density-normal',
  '4': 'set-density-dense',
}

/** Map a set-density practice action to its CompDensity id. */
export function densityFromPracticeAction(
  action: PracticeKeyAction,
): CompDensity | null {
  switch (action) {
    case 'set-density-solo':
      return 'solo'
    case 'set-density-sparse':
      return 'sparse'
    case 'set-density-normal':
      return 'normal'
    case 'set-density-dense':
      return 'dense'
    default:
      return null
  }
}

/**
 * Tempo BPM delta for a practice tempo action.
 * Initial keydown: ±10. Browser key-repeat while held: ±1 (fine ramp).
 */
export function practiceTempoDelta(
  action: PracticeKeyAction,
  repeat: boolean,
): number | null {
  if (action === 'tempo-down') return repeat ? -1 : -10
  if (action === 'tempo-up') return repeat ? 1 : 10
  return null
}

/**
 * Resolve a keydown to a practice action, or `null` when the event should pass
 * through (or is handled elsewhere, e.g. arrow navigation).
 */
export function practiceKeyAction(
  key: string,
  ctx: PracticeKeyContext,
): PracticeKeyAction | null {
  if (ctx.inFormField || ctx.editing || ctx.withModifier) return null

  if (key === ' ' || key === 'Spacebar') {
    if (ctx.spaceOnButton) return null
    return 'toggle-play'
  }
  if (key === 't' || key === 'T') return 'tap-tempo'
  if (key === 'm' || key === 'M') return 'toggle-click'
  if (key === '[' || key === '-') return 'tempo-down'
  if (key === ']' || key === '=' || key === '+') return 'tempo-up'
  if (key === 'd' || key === 'D') return 'cycle-density'
  return DENSITY_DIGIT_ACTIONS[key] ?? null
}
