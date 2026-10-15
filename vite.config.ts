import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

/** GitHub Pages project site: https://agallant.github.io/autocomp/ */
function resolveBase(mode: string): string {
  const env = loadEnv(mode, '.', '')
  return env.VITE_BASE || '/autocomp/'
}

export default defineConfig(({ mode }) => ({
  base: resolveBase(mode),
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
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
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
  },
}))
