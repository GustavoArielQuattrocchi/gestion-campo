import { useEffect, useState } from 'react'

/**
 * Aviso discreto cuando hay un service worker nuevo, sin recargar
 * mientras el usuario está trabajando.
 */
export default function PwaUpdateBanner() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

    let cancelled = false
    const cleanups: Array<() => void> = []

    const trackWaiting = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting) setWaiting(registration.waiting)

      const onUpdateFound = () => {
        const installing = registration.installing
        if (!installing) return
        const onStateChange = () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            setWaiting(registration.waiting)
          }
        }
        installing.addEventListener('statechange', onStateChange)
        cleanups.push(() => installing.removeEventListener('statechange', onStateChange))
      }

      registration.addEventListener('updatefound', onUpdateFound)
      cleanups.push(() => registration.removeEventListener('updatefound', onUpdateFound))
    }

    void navigator.serviceWorker.getRegistration().then(registration => {
      if (cancelled || !registration) return
      trackWaiting(registration)
    })

    const onControllerChange = () => {
      if (sessionStorage.getItem('sw-controller-reload')) return
      sessionStorage.setItem('sw-controller-reload', '1')
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
    cleanups.push(() => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    })

    return () => {
      cancelled = true
      for (const fn of cleanups) fn()
    }
  }, [])

  if (!waiting) return null

  return (
    <div className="pwa-update-banner" role="status">
      <span>Nueva versión disponible</span>
      <button
        type="button"
        onClick={() => waiting.postMessage({ type: 'SKIP_WAITING' })}
      >
        Actualizar
      </button>
    </div>
  )
}
