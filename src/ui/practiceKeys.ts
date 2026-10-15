/**
 * Practice keyboard shortcuts (when focus is not in a form field / chord edit).
 * - Space: play / pause from the selected bar
 * - T: tap tempo
 * - M: toggle metronome click
 * - [ / ]: tempo −10 / +10
 * - - / = (and +): tempo −10 / +10
 * - D: cycle comp density
 */

export type PracticeKeyAction =
  | 'toggle-play'
  | 'tap-tempo'
  | 'toggle-click'
  | 'tempo-down'
  | 'tempo-up'
  | 'cycle-density'

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
  return null
}
