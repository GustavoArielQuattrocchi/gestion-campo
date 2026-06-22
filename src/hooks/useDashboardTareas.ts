import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { arrayUnion, collection, doc, onSnapshot, Timestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { Tarea } from '../types'
import { getFincaNombres } from '../data/catalog'
import { computeDashboardStats } from '../utils/dashboardMetrics'
import { getMetricDetail, type MetricKey } from '../utils/getMetricDetail'
import { parseTareasFromSnapshot } from '../utils/parseTarea'
import { TAREAS_PAGE_SIZE } from '../utils/dashboardState'
import { parseFirestoreError } from '../utils/firestoreError'
import { applyDashboardFilters, sortByFechaInicio } from '../utils/dashboardFilters'
import { allCuadrosTareaFinalizados } from '../utils/tareaProgress'
import {
  buildFilterSearchParams,
  buildInvalidDocsWarning,
  buildMetricsNote,
  hasMoreTareas,
  nextVisibleCount,
  paginateTareas,
  readFilterParam,
} from '../utils/dashboardState'

export type DashboardPanelKey = 'resumen' | 'en_progreso' | 'filtros' | 'tareas'

export function useDashboardTareas() {
  const [searchParams, setSearchParams] = useSearchParams()
  const fincasFiltro = useMemo(() => getFincaNombres(), [])
  const fincasAllowed = useMemo(() => new Set(['todas', ...fincasFiltro]), [fincasFiltro])

  const [allTareas, setAllTareas] = useState<Tarea[]>([])
  const [visibleCount, setVisibleCount] = useState(TAREAS_PAGE_SIZE)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [indexCreateUrl, setIndexCreateUrl] = useState<string | null>(null)
  const [filtroFinca, setFiltroFinca] = useState(() =>
    readFilterParam(searchParams, 'finca', 'todas', fincasAllowed),
  )
  const [filtroTipo, setFiltroTipo] = useState(() =>
    readFilterParam(searchParams, 'tipo', 'todos', new Set(['todos', 'manual', 'mecanica'])),
  )
  const [filtroEstado, setFiltroEstado] = useState(() =>
    readFilterParam(searchParams, 'estado', 'todos', new Set(['todos', 'en_progreso', 'finalizada'])),
  )
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [panelsOpen, setPanelsOpen] = useState<Record<DashboardPanelKey, boolean>>({
    resumen: true,
    en_progreso: true,
    filtros: true,
    tareas: false,
  })
  const [selectedMetric, setSelectedMetric] = useState<MetricKey | null>(null)
  const [parseWarning, setParseWarning] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    const params = buildFilterSearchParams(filtroFinca, filtroTipo, filtroEstado)
    setSearchParams(params, { replace: true })
  }, [filtroFinca, filtroTipo, filtroEstado, setSearchParams])

  useEffect(() => {
    setVisibleCount(TAREAS_PAGE_SIZE)
  }, [filtroFinca, filtroTipo, filtroEstado])

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'tareas'),
      snapshot => {
        const { tareas: data, invalid } = parseTareasFromSnapshot(
          snapshot.docs.map(d => ({ id: d.id, data: () => d.data() as Record<string, unknown> })),
        )
        setAllTareas(sortByFechaInicio(data))
        setParseWarning(buildInvalidDocsWarning(invalid.length))
        setLoading(false)
        setError(null)
        setIndexCreateUrl(null)
      },
      err => {
        console.error('[Dashboard] Error en onSnapshot:', err)
        const parsed = parseFirestoreError(err.message ?? 'Error desconocido al leer tareas')
        setError(parsed.message)
        setIndexCreateUrl(parsed.indexCreateUrl)
        setParseWarning(null)
        setAllTareas([])
        setLoading(false)
      },
    )

    return unsubscribe
  }, [])

  const tareasFiltradas = useMemo(
    () => applyDashboardFilters(allTareas, filtroFinca, filtroTipo, filtroEstado),
    [allTareas, filtroFinca, filtroTipo, filtroEstado],
  )

  const tareasEnTabla = useMemo(
    () => paginateTareas(tareasFiltradas, visibleCount),
    [tareasFiltradas, visibleCount],
  )

  const hasMore = hasMoreTareas(tareasFiltradas.length, visibleCount)

  const stats = useMemo(() => computeDashboardStats(tareasFiltradas), [tareasFiltradas])

  const metricDetail = useMemo(() => {
    if (!selectedMetric) return null
    return getMetricDetail(selectedMetric, tareasFiltradas)
  }, [selectedMetric, tareasFiltradas])

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    setVisibleCount(count => nextVisibleCount(count, tareasFiltradas.length))
    setLoadingMore(false)
  }, [hasMore, loadingMore, tareasFiltradas.length])

  const metricsNote = buildMetricsNote(tareasEnTabla.length, tareasFiltradas.length, hasMore)

  const togglePanel = (key: DashboardPanelKey) => {
    setPanelsOpen(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const finalizarCuadro = useCallback(async (tareaId: string, cuadroId: string) => {
    setActionError(null)
    try {
      await updateDoc(doc(db, 'tareas', tareaId), {
        cuadroIdsFinalizados: arrayUnion(cuadroId),
      })
    } catch (err) {
      console.error('[Dashboard] Error al finalizar cuadro:', err)
      setActionError('No se pudo finalizar el cuadro. Revisá la conexión y las reglas de Firestore.')
      throw err
    }
  }, [])

  const finalizarTarea = useCallback(async (tareaId: string) => {
    const tarea = allTareas.find(t => t.id === tareaId)
    if (!tarea || !allCuadrosTareaFinalizados(tarea)) return

    setActionError(null)
    try {
      await updateDoc(doc(db, 'tareas', tareaId), {
        estado: 'finalizada',
        fechaFin: Timestamp.now(),
      })
    } catch (err) {
      console.error('[Dashboard] Error al cerrar tarea:', err)
      setActionError('No se pudo cerrar la tarea. Revisá la conexión y las reglas de Firestore.')
      throw err
    }
  }, [allTareas])

  return {
    loading,
    loadingMore,
    hasMore,
    loadMore,
    error,
    indexCreateUrl,
    parseWarning,
    sidebarOpen,
    setSidebarOpen,
    panelsOpen,
    togglePanel,
    filtroFinca,
    setFiltroFinca,
    filtroTipo,
    setFiltroTipo,
    filtroEstado,
    setFiltroEstado,
    fincasFiltro,
    tareasFiltradas,
    tareasEnTabla,
    stats,
    selectedMetric,
    setSelectedMetric,
    metricDetail,
    metricsNote,
    actionError,
    finalizarCuadro,
    finalizarTarea,
  }
}
