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

/* ---------- Web Push (VAPID) ---------- */
// Backend sends payload as JSON: { title, body, url } — see
// mednex-backend/utils/sendPush.js. Shown as a native browser/OS
// notification even when the app tab isn't open.
self.addEventListener('push', (event) => {
  let data = { title: 'MedNex', body: 'You have a new update.', url: '/' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch (err) {
    // non-JSON payload — fall back to the defaults above
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url || '/' },
    })
  )
})

// Clicking the notification focuses an existing MedNex tab if one's open,
// otherwise opens a new one at the relevant page (appointments, dashboard).
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => new URL(c.url).origin === self.location.origin)
      if (existing) {
        existing.focus()
        existing.navigate?.(targetUrl)
        existing.postMessage?.({ type: 'push-navigate', url: targetUrl })
        return
      }
      return self.clients.openWindow(targetUrl)
    })
  )
})
