import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import type { Tarea } from '../types'
import { parseTareasFromSnapshot } from '../utils/parseTarea'
import {
  agruparTareasCuadro,
  filterTareasPorCuadro,
  type CuadroTareasAgrupadas,
} from '../utils/cuadroTareas'
import { sortByFechaInicio } from '../utils/dashboardFilters'

interface UseCuadroTareasResult {
  loading: boolean
  error: string | null
  grupos: CuadroTareasAgrupadas
}

export function useCuadroTareas(fincaId: string, cuadroId: string): UseCuadroTareasResult {
  const [allTareas, setAllTareas] = useState<Tarea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const unsubscribe = onSnapshot(
      collection(db, 'tareas'),
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
  }, [])

  const grupos = useMemo(() => {
    const decodedFinca = decodeURIComponent(fincaId)
    const decodedCuadro = decodeURIComponent(cuadroId)
    const filtradas = filterTareasPorCuadro(allTareas, decodedFinca, decodedCuadro)
    return agruparTareasCuadro(filtradas)
  }, [allTareas, fincaId, cuadroId])

  return { loading, error, grupos }
}
