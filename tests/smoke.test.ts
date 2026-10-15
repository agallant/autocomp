import { describe, expect, it } from 'vitest'
import { APP_VERSION } from '../src/lib/version'

describe('smoke', () => {
  it('exposes a semver app version', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })
})
