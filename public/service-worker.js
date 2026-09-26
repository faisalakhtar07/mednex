// Deliberately minimal: caches only the static app shell (HTML/JS/CSS/icons)
// so the app can install and reopen instantly, and NEVER caches /api/* —
// medicine stock, prices, order status, and payments must always be live
// data, never served stale from cache.
const CACHE_NAME = 'mednex-shell-v1'
const APP_SHELL = ['/', '/manifest.json', '/favicon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Never intercept API calls — always go to the network for live data.
  if (url.pathname.startsWith('/api/')) return
  // Only handle same-origin GET requests; let everything else (POST, other origins) pass through untouched.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => cached) // offline fallback to whatever's cached
      return cached || network
    })
  )
})
