const SHELL_CACHE = 'gestion-campo-shell-v5'

function isSameOrigin(request) {
  try {
    return new URL(request.url).origin === self.location.origin
  } catch {
    return false
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(['/', '/index.html'])))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !isSameOrigin(event.request)) return

  const url = new URL(event.request.url)

  // Los JS/CSS con hash los sirve el navegador. Interceptarlos colgaba Ctrl+Shift+R.
  if (url.pathname.startsWith('/assets/') || url.pathname === '/sw.js') return

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
