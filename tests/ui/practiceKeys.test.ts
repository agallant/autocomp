import { describe, expect, it } from 'vitest'
import { practiceKeyAction } from '../../src/ui/practiceKeys'

describe('practiceKeyAction', () => {
  const free: Parameters<typeof practiceKeyAction>[1] = {
    inFormField: false,
    editing: false,
    enterOnButton: false,
  }

  it('maps Space / T / M when the chart is not being edited', () => {
    expect(practiceKeyAction(' ', free)).toBe('toggle-play')
    expect(practiceKeyAction('Spacebar', free)).toBe('toggle-play')
    expect(practiceKeyAction('t', free)).toBe('tap-tempo')
    expect(practiceKeyAction('T', free)).toBe('tap-tempo')
    expect(practiceKeyAction('m', free)).toBe('toggle-click')
    expect(practiceKeyAction('M', free)).toBe('toggle-click')
  })

  it('ignores shortcuts in form fields or during chord edit', () => {
    expect(practiceKeyAction(' ', { ...free, inFormField: true })).toBeNull()
    expect(practiceKeyAction('t', { ...free, editing: true })).toBeNull()
    expect(practiceKeyAction('m', { ...free, inFormField: true })).toBeNull()
  })

  it('leaves unrelated keys alone', () => {
    expect(practiceKeyAction('ArrowRight', free)).toBeNull()
    expect(practiceKeyAction('Enter', free)).toBeNull()
    expect(practiceKeyAction('p', free)).toBeNull()
  })
})
