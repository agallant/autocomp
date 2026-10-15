import '@fontsource/fraunces/500.css'
import '@fontsource/fraunces/700.css'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-mono/500.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/app.css'
import { mountApp } from './ui/app'
import { registerSW } from 'virtual:pwa-register'

const root = document.querySelector<HTMLElement>('#app')
if (!root) {
  throw new Error('Autocomp root element #app not found')
}

mountApp(root)

registerSW({
  immediate: true,
  onRegisteredSW(swUrl) {
    console.info('[autocomp] service worker registered', swUrl)
  },
  onRegisterError(error) {
    console.warn('[autocomp] service worker registration failed', error)
  },
})
