import { useEffect, useMemo, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import type { Tarea } from '../types'
import { parseTareasFromSnapshot } from '../utils/parseTarea'
import {
  agruparTareasCuadro,
  filterTareasPorCuadro,
  type CuadroTareasAgrupadas,
} from '../utils/cuadroTareas'
import { sortByFechaInicio } from '../utils/dashboardFilters'
import { buildCuadroTareasQuery } from '../utils/firestoreDashboardQueries'

interface UseCuadroTareasResult {
  loading: boolean
  error: string | null
  grupos: CuadroTareasAgrupadas
}

export function useCuadroTareas(fincaId: string, cuadroId: string): UseCuadroTareasResult {
  const [allTareas, setAllTareas] = useState<Tarea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const decodedFinca = decodeURIComponent(fincaId)
  const decodedCuadro = decodeURIComponent(cuadroId)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const unsubscribe = onSnapshot(
      buildCuadroTareasQuery(db, decodedFinca, decodedCuadro),
      snapshot => {
        const { tareas } = parseTareasFromSnapshot(
          snapshot.docs.map(d => ({ id: d.id, data: () => d.data() as Record<string, unknown> })),
        )
        setAllTareas(sortByFechaInicio(tareas))
        setLoading(false)
        setError(null)
      },
      err => {
        console.error('[CuadroPublic] Error leyendo tareas:', err)
        setError('No se pudieron cargar los trabajos de este cuadro.')
        setAllTareas([])
        setLoading(false)
      },
    )

    return unsubscribe
  }, [decodedFinca, decodedCuadro])

  const grupos = useMemo(() => {
    // Defensa: por si hay docs legacy sin fincaId alineado.
    const filtradas = filterTareasPorCuadro(allTareas, decodedFinca, decodedCuadro)
    return agruparTareasCuadro(filtradas)
  }, [allTareas, decodedFinca, decodedCuadro])

  return { loading, error, grupos }
}
