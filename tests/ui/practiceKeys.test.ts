import { describe, expect, it } from 'vitest'
import {
  densityFromPracticeAction,
  practiceKeyAction,
  practiceTempoDelta,
} from '../../src/ui/practiceKeys'

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

  it('ramps tempo ±1 on key-repeat; ±10 on the initial press', () => {
    expect(practiceTempoDelta('tempo-down', false)).toBe(-10)
    expect(practiceTempoDelta('tempo-up', false)).toBe(10)
    expect(practiceTempoDelta('tempo-down', true)).toBe(-1)
    expect(practiceTempoDelta('tempo-up', true)).toBe(1)
    expect(practiceTempoDelta('toggle-play', true)).toBeNull()
    expect(practiceTempoDelta('cycle-density', false)).toBeNull()
  })

  it('maps D to cycle density', () => {
    expect(practiceKeyAction('d', free)).toBe('cycle-density')
    expect(practiceKeyAction('D', free)).toBe('cycle-density')
    expect(practiceKeyAction('D', { ...free, withModifier: true })).toBeNull()
  })

  it('maps 1–4 to Solo / Sparse / Normal / Dense', () => {
    expect(practiceKeyAction('1', free)).toBe('set-density-solo')
    expect(practiceKeyAction('2', free)).toBe('set-density-sparse')
    expect(practiceKeyAction('3', free)).toBe('set-density-normal')
    expect(practiceKeyAction('4', free)).toBe('set-density-dense')
    expect(practiceKeyAction('1', { ...free, withModifier: true })).toBeNull()
    expect(practiceKeyAction('2', { ...free, editing: true })).toBeNull()
    expect(densityFromPracticeAction('set-density-solo')).toBe('solo')
    expect(densityFromPracticeAction('set-density-sparse')).toBe('sparse')
    expect(densityFromPracticeAction('set-density-normal')).toBe('normal')
    expect(densityFromPracticeAction('set-density-dense')).toBe('dense')
    expect(densityFromPracticeAction('cycle-density')).toBeNull()
  })

  it('ignores shortcuts in form fields or during chord edit', () => {
    expect(practiceKeyAction(' ', { ...free, inFormField: true })).toBeNull()
    expect(practiceKeyAction('t', { ...free, editing: true })).toBeNull()
    expect(practiceKeyAction('m', { ...free, inFormField: true })).toBeNull()
    expect(practiceKeyAction('[', { ...free, editing: true })).toBeNull()
    expect(practiceKeyAction('=', { ...free, inFormField: true })).toBeNull()
    expect(practiceKeyAction('3', { ...free, inFormField: true })).toBeNull()
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
