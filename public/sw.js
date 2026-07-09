const SHELL_CACHE = 'gestion-campo-shell-v3'
const RUNTIME_CACHE = 'gestion-campo-runtime-v3'
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

async function cacheResponse(cacheName, request, response) {
  if (!response || !response.ok) return response
  const cache = await caches.open(cacheName)
  await cache.put(request, response.clone())
  return response
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
        .then((response) => cacheResponse(SHELL_CACHE, event.request, response))
        .catch(() => caches.match('/index.html')),
    )
    return
  }

  if (!isCacheableAsset(url)) return

  // Network-first: tras un deploy, index.html pide chunks nuevos; cache-first rompía el escritorio.
  event.respondWith(
    fetch(event.request)
      .then((response) => cacheResponse(RUNTIME_CACHE, event.request, response))
      .catch(() => caches.match(event.request)),
  )
})
