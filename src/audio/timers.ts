/**
 * Browser timer functions must keep their global `this`. Storing a bare
 * `setInterval` / `setTimeout` reference and calling it later throws
 * `TypeError: Illegal invocation` in Chromium / WebKit.
 */

export const boundSetTimeout: typeof setTimeout = (...args) =>
  globalThis.setTimeout(...args)

export const boundClearTimeout: typeof clearTimeout = (...args) =>
  globalThis.clearTimeout(...args)

export const boundSetInterval: typeof setInterval = (...args) =>
  globalThis.setInterval(...args)

export const boundClearInterval: typeof clearInterval = (...args) =>
  globalThis.clearInterval(...args)
