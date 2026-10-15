/**
 * Practice keyboard shortcuts (when focus is not in a form field / chord edit).
 * - Space: play / pause from the selected bar
 * - T: tap tempo
 * - M: toggle metronome click
 */

export type PracticeKeyAction = 'toggle-play' | 'tap-tempo' | 'toggle-click'

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
}

/**
 * Resolve a keydown to a practice action, or `null` when the event should pass
 * through (or is handled elsewhere, e.g. arrow navigation).
 */
export function practiceKeyAction(
  key: string,
  ctx: PracticeKeyContext,
): PracticeKeyAction | null {
  if (ctx.inFormField || ctx.editing) return null

  if (key === ' ' || key === 'Spacebar') {
    if (ctx.spaceOnButton) return null
    return 'toggle-play'
  }
  if (key === 't' || key === 'T') return 'tap-tempo'
  if (key === 'm' || key === 'M') return 'toggle-click'
  return null
}
