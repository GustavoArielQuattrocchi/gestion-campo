import { useEffect, useState } from 'react'

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(
    () => typeof navigator !== 'undefined' && navigator.onLine,
  )

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  return online
}

export const OFFLINE_WRITE_TOAST =
  'Guardado en el dispositivo. Se sincronizará al recuperar señal.'

export const OFFLINE_SYNCED_TOAST = 'Datos sincronizados con el servidor.'

export const OFFLINE_FIRST_LAUNCH_ERROR =
  'Sin conexión. Abrí la app con internet al menos una vez para activarla en este dispositivo.'
