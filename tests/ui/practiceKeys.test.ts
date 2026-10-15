import { describe, expect, it } from 'vitest'
import { practiceKeyAction } from '../../src/ui/practiceKeys'

describe('practiceKeyAction', () => {
  const free: Parameters<typeof practiceKeyAction>[1] = {
    inFormField: false,
    editing: false,
    spaceOnButton: false,
    withModifier: false,
  }

  it('maps Space / T / M when the chart is not being edited', () => {
    expect(practiceKeyAction(' ', free)).toBe('toggle-play')
    expect(practiceKeyAction('Spacebar', free)).toBe('toggle-play')
    expect(practiceKeyAction('t', free)).toBe('tap-tempo')
    expect(practiceKeyAction('T', free)).toBe('tap-tempo')
    expect(practiceKeyAction('m', free)).toBe('toggle-click')
    expect(practiceKeyAction('M', free)).toBe('toggle-click')
  })

  it('maps [ / ] and - / = / + for tempo nudges', () => {
    expect(practiceKeyAction('[', free)).toBe('tempo-down')
    expect(practiceKeyAction('-', free)).toBe('tempo-down')
    expect(practiceKeyAction(']', free)).toBe('tempo-up')
    expect(practiceKeyAction('=', free)).toBe('tempo-up')
    expect(practiceKeyAction('+', free)).toBe('tempo-up')
  })

  it('maps D to cycle density', () => {
    expect(practiceKeyAction('d', free)).toBe('cycle-density')
    expect(practiceKeyAction('D', free)).toBe('cycle-density')
    expect(practiceKeyAction('D', { ...free, withModifier: true })).toBeNull()
  })

  it('ignores shortcuts in form fields or during chord edit', () => {
    expect(practiceKeyAction(' ', { ...free, inFormField: true })).toBeNull()
    expect(practiceKeyAction('t', { ...free, editing: true })).toBeNull()
    expect(practiceKeyAction('m', { ...free, inFormField: true })).toBeNull()
    expect(practiceKeyAction('[', { ...free, editing: true })).toBeNull()
    expect(practiceKeyAction('=', { ...free, inFormField: true })).toBeNull()
  })

  it('ignores Ctrl / Meta / Alt so browser zoom shortcuts still work', () => {
    expect(practiceKeyAction('-', { ...free, withModifier: true })).toBeNull()
    expect(practiceKeyAction('+', { ...free, withModifier: true })).toBeNull()
    expect(practiceKeyAction('=', { ...free, withModifier: true })).toBeNull()
    expect(practiceKeyAction('t', { ...free, withModifier: true })).toBeNull()
  })

  it('lets Space activate a focused button instead of toggling play', () => {
    expect(practiceKeyAction(' ', { ...free, spaceOnButton: true })).toBeNull()
    expect(practiceKeyAction('t', { ...free, spaceOnButton: true })).toBe('tap-tempo')
    expect(practiceKeyAction(']', { ...free, spaceOnButton: true })).toBe('tempo-up')
  })

  it('leaves unrelated keys alone', () => {
    expect(practiceKeyAction('ArrowRight', free)).toBeNull()
    expect(practiceKeyAction('Enter', free)).toBeNull()
    expect(practiceKeyAction('p', free)).toBeNull()
  })
})
