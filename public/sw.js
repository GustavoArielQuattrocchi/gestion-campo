const SHELL_CACHE = 'gestion-campo-shell-v4'
const RUNTIME_CACHE = 'gestion-campo-runtime-v4'
const SHELL = ['/', '/index.html', '/favicon.svg', '/manifest.webmanifest', '/campo']

function isSameOrigin(request) {
  try {
    return new URL(request.url).origin === self.location.origin
  } catch {
    return false
  }
}

function isCacheableAsset(url) {
  return (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webmanifest')
  )
}

/** Tras un deploy, Firebase reescribe assets faltantes a index.html (200 + text/html). */
function isUsableAssetResponse(request, response) {
  if (!response || !response.ok) return false
  const url = new URL(request.url)
  const type = (response.headers.get('content-type') || '').toLowerCase()
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.mjs')) {
    return type.includes('javascript') || type.includes('ecmascript') || type.includes('wasm')
  }
  if (url.pathname.endsWith('.css')) {
    return type.includes('text/css')
  }
  return !type.includes('text/html')
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key)),
      ),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !isSameOrigin(event.request)) return

  const url = new URL(event.request.url)

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (response && response.ok) {
            const cache = await caches.open(SHELL_CACHE)
            await cache.put(event.request, response.clone())
            await cache.put('/index.html', response.clone())
          }
          return response
        })
        .catch(() => caches.match('/index.html')),
    )
    return
  }

  if (!isCacheableAsset(url)) return

  // Network-first: no cachear HTML de fallback SPA (chunks viejos post-deploy).
  event.respondWith(
    fetch(event.request)
      .then(async (response) => {
        if (!isUsableAssetResponse(event.request, response)) return response
        const cache = await caches.open(RUNTIME_CACHE)
        await cache.put(event.request, response.clone())
        return response
      })
      .catch(() => caches.match(event.request)),
  )
})
