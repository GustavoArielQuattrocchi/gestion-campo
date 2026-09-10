import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

/**
 * Reintenta la carga de un chunk lazy tras un deploy.
 * Un reload basta: index.html y sw.js ya van con no-cache.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- lazy() exige un ComponentType genérico
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
        window.location.reload()
      }
      throw err
    }
  })
}
