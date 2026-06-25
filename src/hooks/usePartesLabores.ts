import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import type { ParteDeLabores } from '../types'
import { parsePartesFromSnapshot } from '../utils/parseParteDeLabores'

export function usePartesLabores() {
  const [partes, setPartes] = useState<ParteDeLabores[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [parseWarning, setParseWarning] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'partes_labores'),
      snapshot => {
        const { partes: data, invalid } = parsePartesFromSnapshot(
          snapshot.docs.map(d => ({ id: d.id, data: () => d.data() as Record<string, unknown> })),
        )
        setPartes(data)
        setParseWarning(
          invalid > 0
            ? `${invalid} parte(s) de labores no se pudieron leer por datos incompletos.`
            : null,
        )
        setLoading(false)
        setError(null)
      },
      err => {
        console.error('[Dashboard] Error en partes_labores:', err)
        setPartes([])
        setParseWarning(null)
        setError(err.message ?? 'No se pudieron cargar los partes de labores.')
        setLoading(false)
      },
    )

    return unsubscribe
  }, [])

  const fincasDisponibles = useMemo(() => {
    const set = new Set(partes.map(p => p.fincaNombre))
    return [...set].sort()
  }, [partes])

  return { partes, loading, error, parseWarning, fincasDisponibles }
}
