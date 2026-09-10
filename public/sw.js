const SHELL_CACHE = 'gestion-campo-shell-v6'
const STATIC_SHELL = ['/', '/index.html', '/favicon.svg', '/manifest.webmanifest']

function isSameOrigin(request) {
  try {
    return new URL(request.url).origin === self.location.origin
  } catch {
    return false
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(STATIC_SHELL)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !isSameOrigin(event.request)) return

  const url = new URL(event.request.url)

  // Los JS/CSS con hash los sirve el navegador. Interceptarlos colgaba Ctrl+Shift+R.
  if (url.pathname.startsWith('/assets/') || url.pathname === '/sw.js') return

  const isIcon =
    url.pathname === '/favicon.svg' ||
    url.pathname === '/apple-touch-icon.png' ||
    url.pathname.startsWith('/icons/')

  if (isIcon) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request).then(async (response) => {
          if (response && response.ok) {
            const cache = await caches.open(SHELL_CACHE)
            await cache.put(event.request, response.clone())
          }
          return response
        })
      }),
    )
    return
  }

  if (event.request.mode !== 'navigate') return

  event.respondWith(
    fetch(event.request)
      .then(async (response) => {
        if (response && response.ok) {
          const cache = await caches.open(SHELL_CACHE)
          await cache.put('/index.html', response.clone())
        }
        return response
      })
      .catch(() => caches.match('/index.html')),
  )
})
