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

    const trackWaiting = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting) setWaiting(registration.waiting)
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing
        if (!installing) return
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            setWaiting(registration.waiting)
          }
        })
      })
    }

    void navigator.serviceWorker.getRegistration().then(registration => {
      if (cancelled || !registration) return
      trackWaiting(registration)
    })

    const onControllerChange = () => {
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    return () => {
      cancelled = true
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
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
