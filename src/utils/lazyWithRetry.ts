import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

async function clearStaleClientCaches() {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map(reg => reg.unregister()))
    }
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map(key => caches.delete(key)))
    }
  } catch {
    // Seguir con el reload igual.
  }
}

/**
 * Reintenta la carga de un chunk lazy tras un deploy (service worker / caché desactualizada).
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  id: string,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory()
    } catch (err) {
      const key = `chunk-retry:${id}`
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1')
        await clearStaleClientCaches()
        window.location.reload()
      }
      throw err
    }
  })
}
