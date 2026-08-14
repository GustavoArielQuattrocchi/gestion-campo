import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import {
  parseInformeAccidente,
  type InformeAccidente,
} from '../utils/parseInformeAccidente'

export type { InformeAccidente, InformeAccidenteCompleto } from '../utils/parseInformeAccidente'

export function useInformesAccidente(enabled = true) {
  const [informes, setInformes] = useState<InformeAccidente[]>([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = onSnapshot(
      collection(db, 'informes_accidente'),
      snapshot => {
        const data: InformeAccidente[] = []
        for (const d of snapshot.docs) {
          const parsed = parseInformeAccidente(d.id, d.data() as Record<string, unknown>)
          if (parsed) data.push(parsed)
        }
        setInformes(data)
        setLoading(false)
        setError(null)
      },
      err => {
        console.error('[Dashboard] Error en informes_accidente:', err)
        setInformes([])
        setError(err.message ?? 'No se pudieron cargar los informes de accidentes.')
        setLoading(false)
      },
    )

    return unsubscribe
  }, [enabled])

  const fincasDisponibles = useMemo(() => {
    const set = new Set(informes.map(i => i.fincaNombre))
    return [...set].sort()
  }, [informes])

  return { informes, loading, error, fincasDisponibles }
}
