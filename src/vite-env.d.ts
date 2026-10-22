/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/** Injected at build/dev time from package.json + git (see vite.config.ts). */
declare const __APP_PKG_VERSION__: string
declare const __APP_GIT_SHA__: string
declare const __APP_BUILD_TIME__: string
