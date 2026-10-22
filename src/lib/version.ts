/** Package semver (from package.json via Vite `define`). */
export const APP_PKG_VERSION = __APP_PKG_VERSION__

/** Short git SHA at build time. */
export const APP_GIT_SHA = __APP_GIT_SHA__

/** ISO-8601 build timestamp (UTC). */
export const APP_BUILD_TIME = __APP_BUILD_TIME__

/**
 * Shell label: semver + short SHA so a deployed build is identifiable.
 * Full timestamp lives in the header `title` tooltip.
 */
export const APP_VERSION = `${APP_PKG_VERSION}+${APP_GIT_SHA}`
