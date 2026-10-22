import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

/** GitHub Pages project site: https://agallant.github.io/autocomp/ */
function resolveBase(mode: string): string {
  const env = loadEnv(mode, '.', '')
  return env.VITE_BASE || '/autocomp/'
}

function gitShortSha(): string {
  try {
    return execSync('git rev-parse --short HEAD', {
      cwd: fileURLToPath(new URL('.', import.meta.url)),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return 'unknown'
  }
}

const pkgVersion = (
  JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
    version: string
  }
).version

export default defineConfig(({ mode }) => ({
  base: resolveBase(mode),
  define: {
    __APP_PKG_VERSION__: JSON.stringify(pkgVersion),
    __APP_GIT_SHA__: JSON.stringify(gitShortSha()),
    __APP_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'samples/**/*.m4a', 'samples/LICENSE.md'],
      manifest: {
        name: 'Autocomp',
        short_name: 'Autocomp',
        description:
          'Automatic musical accompaniment for practicing with chord charts and backing styles.',
        theme_color: '#0b1c24',
        background_color: '#0b1c24',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,m4a,md}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
  },
}))
