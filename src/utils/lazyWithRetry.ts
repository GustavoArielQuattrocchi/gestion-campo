import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

/**
 * Reintenta la carga de un chunk lazy tras un deploy (service worker / caché desactualizada).
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
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
        window.location.reload()
        return new Promise(() => {})
      }
      throw err
    }
  })
}
