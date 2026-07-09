import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, type Timestamp } from 'firebase/firestore'
import { db } from '../firebase'

export interface InformeAccidente {
  id: string
  operador: string
  fincaId: string
  fincaNombre: string
  descripcion: string
  tieneFoto: boolean
  creadoEn: Timestamp
}

function parseInforme(id: string, raw: Record<string, unknown>): InformeAccidente | null {
  if (
    typeof raw.operador !== 'string' ||
    typeof raw.fincaId !== 'string' ||
    typeof raw.fincaNombre !== 'string' ||
    typeof raw.descripcion !== 'string' ||
    typeof raw.tieneFoto !== 'boolean' ||
    !raw.creadoEn
  ) {
    return null
  }

  return {
    id,
    operador: raw.operador,
    fincaId: raw.fincaId,
    fincaNombre: raw.fincaNombre,
    descripcion: raw.descripcion,
    tieneFoto: raw.tieneFoto,
    creadoEn: raw.creadoEn as Timestamp,
  }
}

export function useInformesAccidente() {
  const [informes, setInformes] = useState<InformeAccidente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'informes_accidente'),
      snapshot => {
        const data: InformeAccidente[] = []
        for (const d of snapshot.docs) {
          const parsed = parseInforme(d.id, d.data() as Record<string, unknown>)
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
  }, [])

  const fincasDisponibles = useMemo(() => {
    const set = new Set(informes.map(i => i.fincaNombre))
    return [...set].sort()
  }, [informes])

  return { informes, loading, error, fincasDisponibles }
}
