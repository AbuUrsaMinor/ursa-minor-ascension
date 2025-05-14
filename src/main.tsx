import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'
import './theme.css'

// Request storage persistence
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then(isPersisted => {
    console.log(`Storage persistence is ${isPersisted ? 'enabled' : 'not enabled'}`)
  })
}

// Check for iOS 17.4 beta PWA issue
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
const isEU = Intl.NumberFormat().resolvedOptions().locale.startsWith('en-GB') // Simple EU check
if (isIOS && isEU) {
  const ua = navigator.userAgent
  const matches = ua.match(/OS (\d+)_(\d+)/)
  if (matches && matches[1] === '17' && matches[2] === '4') {
    alert('Note: If you are using iOS 17.4 beta, PWA functionality might be limited. Please update to the latest iOS version.')
  }
}

// Register service worker
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload to update?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
