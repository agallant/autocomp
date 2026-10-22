import { describe, expect, it } from 'vitest'
import { APP_BUILD_TIME, APP_GIT_SHA, APP_PKG_VERSION, APP_VERSION } from '../src/lib/version'

describe('smoke', () => {
  it('exposes semver plus a build stamp (git SHA)', () => {
    expect(APP_PKG_VERSION).toMatch(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/)
    expect(APP_GIT_SHA).toMatch(/^[0-9a-f]{7,40}$|^unknown$/)
    expect(APP_BUILD_TIME).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(APP_VERSION).toBe(`${APP_PKG_VERSION}+${APP_GIT_SHA}`)
  })
})
