import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import type { ParteDeLabores } from '../types'
import { parsePartesFromSnapshot } from '../utils/parseParteDeLabores'
import { getFincaNombres } from '../data/catalog'
import { readFilterParam } from '../utils/dashboardState'
import { buildPartesDashboardQuery } from '../utils/firestoreDashboardQueries'

export function usePartesLabores() {
  const [searchParams] = useSearchParams()
  const fincasAllowed = useMemo(() => new Set(['todas', ...getFincaNombres()]), [])
  const filtroFinca = readFilterParam(searchParams, 'finca', 'todas', fincasAllowed)
  const filtroTipo = readFilterParam(
    searchParams,
    'tipo',
    'todos',
    new Set(['todos', 'manual', 'mecanica']),
  )

  const [partes, setPartes] = useState<ParteDeLabores[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [parseWarning, setParseWarning] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    const unsubscribe = onSnapshot(
      buildPartesDashboardQuery(db, { finca: filtroFinca, tipo: filtroTipo }),
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
  }, [filtroFinca, filtroTipo])

  const fincasDisponibles = useMemo(() => {
    const set = new Set(partes.map(p => p.fincaNombre))
    return [...set].sort()
  }, [partes])

  return { partes, loading, error, parseWarning, fincasDisponibles }
}
