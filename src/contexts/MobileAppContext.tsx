import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection,
  addDoc,
  doc,
  query,
  where,
  onSnapshot,
  onSnapshotsInSync,
  Timestamp,
  arrayUnion,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { auth, db } from '../firebase'
import type { ParteDeLabores, RendimientoUnidad, Tarea, WeatherSnapshot } from '../types'
import { formatRendimiento } from '../utils/rendimiento'
import { MOBILE_ROUTES } from '../mobile/routes'
import { parseTareasFromSnapshot } from '../utils/parseTarea'
import type { MobileToastState, MobileToastVariant } from '../components/mobile/MobileToast'
import { registerOperador } from '../utils/registerOperador'
import { buildActiveTasksWarning } from '../utils/dashboardState'
import {
  buildManualTaskFirestorePayload,
  buildMechanicalTaskFirestorePayload,
  hasMobileSession,
} from '../utils/mobileTaskPayloads'
import {
  validateManualTaskCreate,
  validateMechanicalTaskCreate,
} from '../validation/tareaCreate'
import {
  clearMobileSession,
  loadMobileSession,
  saveMobileSession,
} from '../utils/mobileSession'
import {
  OFFLINE_FIRST_LAUNCH_ERROR,
  OFFLINE_SYNCED_TOAST,
  OFFLINE_WRITE_TOAST,
  useOnlineStatus,
} from '../hooks/useOnlineStatus'
import { buildParteAbiertoPayload, buildParteCierreUpdate, type ParteEjecutorOverride } from '../utils/buildParteDeLaboresPayload'
import {
  buildEjecutorPorCuadroPatch,
  ejecutorLabelFromContinueOptions,
  mergeEjecutorPorCuadro,
  type ContinueTaskOptions,
} from '../utils/tareaEjecutor'
import { parsePartesFromSnapshot } from '../utils/parseParteDeLabores'
import { tieneParteAbierto, resolveCerradoEn } from '../utils/parteEstado'

function initialSessionState() {
  const session = loadMobileSession()
  return {
    operadorNombre: session?.operadorNombre ?? '',
    fincaId: session?.fincaId ?? '',
    fincaNombre: session?.fincaNombre ?? '',
  }
}

interface MobileAppContextValue {
  operadorNombre: string
  fincaId: string
  fincaNombre: string
  tareasActivas: Tarea[]
  partesAbiertos: ParteDeLabores[]
  successMsg: { message: string; detail: string }
  lastCreatedTareaId: string | null
  firestoreError: string | null
  parseWarning: string | null
  toast: MobileToastState | null
  isOnline: boolean
  pendingSync: boolean
  hasSession: boolean
  showToast: (message: string, variant?: MobileToastVariant) => void
  clearToast: () => void
  goToInicio: () => void
  handleOperatorSubmit: (nombre: string) => Promise<boolean>
  handleWelcomeDone: () => void
  handleSelectFinca: (id: string, nombre: string) => void
  handleStartManualTask: (data: {
    cuadrilla: string
    tarea: string
    cantidadPersonas: number
    cuadros: string[]
    cuadroIds: string[]
  }) => Promise<boolean>
  handleStartMechanicalTask: (data: {
    tarea: string
    persona: string
    maquinaria: string
    maquinariaModelo?: string
    maquinariaId?: string
    cuadros: string[]
    cuadroIds: string[]
    ordenCuraRef?: string
  }) => Promise<boolean>
  handleRegisterRendimiento: (
    tareaId: string,
    cantidad: number,
    unidad: RendimientoUnidad,
    extras?: {
      horaInicio?: string
      horaFin?: string
      observaciones?: string
      clima?: WeatherSnapshot
    },
  ) => Promise<void>
  handleContinueTask: (
    tareaId: string,
    cuadros: string[],
    cuadroIds: string[],
    options?: ContinueTaskOptions,
  ) => Promise<boolean>
  handleAccidentSuccess: (detail?: string) => void
  getTareaActiva: (tareaId: string) => Tarea | undefined
}

const MobileAppContext = createContext<MobileAppContextValue | null>(null)

export function MobileAppProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [sessionInit] = useState(initialSessionState)
  const [operadorNombre, setOperadorNombre] = useState(sessionInit.operadorNombre)
  const [fincaId, setFincaId] = useState(sessionInit.fincaId)
  const [fincaNombre, setFincaNombre] = useState(sessionInit.fincaNombre)
  const [tareasActivas, setTareasActivas] = useState<Tarea[]>([])
  const [partesAbiertos, setPartesAbiertos] = useState<ParteDeLabores[]>([])
  const [successMsg, setSuccessMsg] = useState({ message: '', detail: '' })
  const [lastCreatedTareaId, setLastCreatedTareaId] = useState<string | null>(null)
  const [firestoreError, setFirestoreError] = useState<string | null>(null)
  const [parseWarning, setParseWarning] = useState<string | null>(null)
  const [toast, setToast] = useState<MobileToastState | null>(null)
  const isOnline = useOnlineStatus()
  const isOnlineRef = useRef(isOnline)
  isOnlineRef.current = isOnline
  const [pendingSync, setPendingSync] = useState(false)
  const shouldAnnounceSync = useRef(false)
  const submittingRef = useRef(false)

  const markPendingSync = useCallback(() => {
    setPendingSync(true)
    shouldAnnounceSync.current = true
  }, [])

  const showToast = useCallback((message: string, variant: MobileToastVariant = 'info') => {
    setToast({ message, variant })
  }, [])

  const clearToast = useCallback(() => {
    setToast(null)
  }, [])

  const hasSession = hasMobileSession(operadorNombre, fincaId, fincaNombre)

  const partesAbiertosRef = useRef(partesAbiertos)
  partesAbiertosRef.current = partesAbiertos

  const abrirParteDeLabores = useCallback(async (tarea: Tarea, ejecutor?: ParteEjecutorOverride) => {
    if (tieneParteAbierto(partesAbiertosRef.current, tarea.id)) return
    await addDoc(
      collection(db, 'partes_labores'),
      buildParteAbiertoPayload(tarea, operadorNombre, Timestamp.now(), ejecutor),
    )
  }, [operadorNombre])

  useEffect(() => {
    if (!fincaId) {
      setPartesAbiertos([])
      return
    }

    const q = query(
      collection(db, 'partes_labores'),
      where('fincaId', '==', fincaId),
      where('estado', '==', 'abierto'),
    )

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const { partes } = parsePartesFromSnapshot(
          snapshot.docs.map(d => ({ id: d.id, data: () => d.data() as Record<string, unknown> })),
        )
        setPartesAbiertos(partes)
      },
      err => {
        console.error('[MobileApp] Error en partes abiertos:', err)
        if (!isOnlineRef.current) return
        setPartesAbiertos([])
      },
    )

    return unsubscribe
  }, [fincaId])

  useEffect(() => {
    const unsubscribe = onSnapshotsInSync(db, () => {
      if (!shouldAnnounceSync.current || !navigator.onLine) return
      shouldAnnounceSync.current = false
      setPendingSync(false)
      showToast(OFFLINE_SYNCED_TOAST, 'success')
    })
    return unsubscribe
  }, [showToast])

  useEffect(() => {
    const nombre = operadorNombre.trim()
    if (!nombre || !auth.currentUser) return

    registerOperador(nombre).catch(err => {
      console.error('[MobileApp] No se pudo sincronizar operador:', err)
    })
  }, [operadorNombre])

  useEffect(() => {
    if (!fincaId) {
      setTareasActivas([])
      setParseWarning(null)
      return
    }

    setTareasActivas([])

    const q = query(
      collection(db, 'tareas'),
      where('fincaId', '==', fincaId),
      where('estado', '==', 'en_progreso'),
    )

    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: true },
      snapshot => {
        const { tareas, invalid } = parseTareasFromSnapshot(
          snapshot.docs.map(d => ({ id: d.id, data: () => d.data() as Record<string, unknown> })),
        )
        setTareasActivas(tareas)
        setParseWarning(buildActiveTasksWarning(invalid.length))
        setPendingSync(snapshot.metadata.hasPendingWrites)
        if (snapshot.metadata.hasPendingWrites) {
          shouldAnnounceSync.current = true
        }
        if (!snapshot.metadata.fromCache || isOnlineRef.current) {
          setFirestoreError(null)
        }
      },
      err => {
        console.error('[MobileApp] Error en tareas activas:', err)
        if (!isOnlineRef.current) {
          setFirestoreError('Sin conexión. Mostrando datos guardados en el dispositivo.')
          return
        }
        setTareasActivas([])
        setParseWarning(null)
        setFirestoreError(
          err.message ?? 'No se pudieron cargar las tareas activas. Verificá Firestore e índices.',
        )
      },
    )

    return unsubscribe
  }, [fincaId, operadorNombre])

  const goToInicio = useCallback(() => {
    clearMobileSession()
    setOperadorNombre('')
    setFincaId('')
    setFincaNombre('')
    navigate(MOBILE_ROUTES.inicio)
  }, [navigate])

  const handleOperatorSubmit = useCallback(async (nombre: string): Promise<boolean> => {
    try {
      await registerOperador(nombre)
      setOperadorNombre(nombre)
      setFirestoreError(null)
      navigate(MOBILE_ROUTES.bienvenida)
      return true
    } catch (err) {
      console.error('Error al registrar operador:', err)
      if (!navigator.onLine) {
        setFirestoreError(OFFLINE_FIRST_LAUNCH_ERROR)
        showToast(OFFLINE_FIRST_LAUNCH_ERROR, 'error')
      } else {
        setFirestoreError(
          'No se pudo registrar el operador. Verificá la conexión y las reglas de Firestore (colección operadores).',
        )
      }
      return false
    }
  }, [navigate, showToast])

  const handleWelcomeDone = useCallback(() => {
    navigate(MOBILE_ROUTES.finca)
  }, [navigate])

  const handleSelectFinca = useCallback((id: string, nombre: string) => {
    setFincaId(id)
    setFincaNombre(nombre)
    setOperadorNombre(current => {
      saveMobileSession({ operadorNombre: current, fincaId: id, fincaNombre: nombre })
      return current
    })
    navigate(MOBILE_ROUTES.menu)
  }, [navigate])

  const handleStartManualTask = useCallback(async (data: {
    cuadrilla: string
    tarea: string
    cantidadPersonas: number
    cuadros: string[]
    cuadroIds: string[]
  }): Promise<boolean> => {
    if (submittingRef.current) return false
    const validated = validateManualTaskCreate(data)
    if (!validated.success) {
      showToast(validated.reason, 'error')
      return false
    }

    const payload = buildManualTaskFirestorePayload(validated.data, {
      fincaId,
      fincaNombre,
      operadorNombre,
      fechaInicio: Timestamp.now(),
    })

    submittingRef.current = true
    try {
      const docRef = await addDoc(collection(db, 'tareas'), payload)
      const nuevaTarea: Tarea = {
        id: docRef.id,
        fincaId,
        fincaNombre,
        tipo: 'manual',
        tarea: validated.data.tarea,
        cuadrilla: validated.data.cuadrilla,
        cantidadPersonas: validated.data.cantidadPersonas,
        cuadros: validated.data.cuadros,
        cuadroIds: validated.data.cuadroIds,
        ...(payload.ejecutorPorCuadro ? { ejecutorPorCuadro: payload.ejecutorPorCuadro } : {}),
        estado: 'en_progreso',
        operador: operadorNombre.trim(),
        fechaInicio: payload.fechaInicio,
      }
      await abrirParteDeLabores(nuevaTarea)
      setFirestoreError(null)
      setLastCreatedTareaId(docRef.id)
      setSuccessMsg({
        message: 'Parte de labores abierto',
        detail: `${data.tarea} — ${data.cuadrilla} con ${data.cantidadPersonas} personas`,
      })
      if (!navigator.onLine) {
        markPendingSync()
        showToast(OFFLINE_WRITE_TOAST, 'info')
      }
      navigate(`${MOBILE_ROUTES.exito}?motivo=inicio`)
      return true
    } catch (err) {
      console.error('Error al crear tarea manual:', err)
      setFirestoreError('Error al guardar la tarea manual. Revisá la conexión y las reglas de Firestore.')
      return false
    } finally {
      submittingRef.current = false
    }
  }, [fincaId, fincaNombre, operadorNombre, showToast, markPendingSync, navigate, abrirParteDeLabores])

  const handleStartMechanicalTask = useCallback(async (data: {
    tarea: string
    persona: string
    maquinaria: string
    maquinariaModelo?: string
    maquinariaId?: string
    cuadros: string[]
    cuadroIds: string[]
    ordenCuraRef?: string
  }): Promise<boolean> => {
    if (submittingRef.current) return false
    const validated = validateMechanicalTaskCreate(data)
    if (!validated.success) {
      showToast(validated.reason, 'error')
      return false
    }

    const payload = buildMechanicalTaskFirestorePayload(validated.data, {
      fincaId,
      fincaNombre,
      operadorNombre,
      fechaInicio: Timestamp.now(),
    })

    submittingRef.current = true
    try {
      const docRef = await addDoc(collection(db, 'tareas'), payload)
      const nuevaTarea: Tarea = {
        id: docRef.id,
        fincaId,
        fincaNombre,
        tipo: 'mecanica',
        tarea: validated.data.tarea,
        persona: validated.data.persona,
        maquinaria: validated.data.maquinaria,
        ...(validated.data.maquinariaModelo ? { maquinariaModelo: validated.data.maquinariaModelo } : {}),
        ...(validated.data.maquinariaId ? { maquinariaId: validated.data.maquinariaId } : {}),
        ...(validated.data.ordenCuraRef ? { ordenCuraRef: validated.data.ordenCuraRef } : {}),
        cuadros: validated.data.cuadros,
        cuadroIds: validated.data.cuadroIds,
        ...(payload.ejecutorPorCuadro ? { ejecutorPorCuadro: payload.ejecutorPorCuadro } : {}),
        estado: 'en_progreso',
        operador: operadorNombre.trim(),
        fechaInicio: payload.fechaInicio,
      }
      await abrirParteDeLabores(nuevaTarea)
      setFirestoreError(null)
      setLastCreatedTareaId(docRef.id)
      setSuccessMsg({
        message: 'Parte de labores abierto',
        detail: `${data.tarea} — ${data.persona} con ${data.maquinaria}`,
      })
      if (!navigator.onLine) {
        markPendingSync()
        showToast(OFFLINE_WRITE_TOAST, 'info')
      }
      navigate(`${MOBILE_ROUTES.exito}?motivo=inicio`)
      return true
    } catch (err) {
      console.error('Error al crear tarea mecánica:', err)
      setFirestoreError('Error al guardar la tarea mecánica. Revisá la conexión y las reglas de Firestore.')
      return false
    } finally {
      submittingRef.current = false
    }
  }, [fincaId, fincaNombre, operadorNombre, showToast, markPendingSync, navigate, abrirParteDeLabores])

  const handleContinueTask = useCallback(async (
    tareaId: string,
    cuadros: string[],
    cuadroIds: string[],
    options: ContinueTaskOptions = {},
  ): Promise<boolean> => {
    if (submittingRef.current) return false
    submittingRef.current = true
    try {
      const tarea = tareasActivas.find(t => t.id === tareaId)
      if (!tarea) {
        setFirestoreError('No se encontró la tarea activa.')
        return false
      }

      const ejecutorLabel = ejecutorLabelFromContinueOptions(tarea.tipo, options)
      const ejecutorPatch = ejecutorLabel
        ? buildEjecutorPorCuadroPatch(cuadroIds, ejecutorLabel)
        : {}

      const updates: Record<string, unknown> = {
        cuadros: arrayUnion(...cuadros),
        cuadroIds: arrayUnion(...cuadroIds),
      }
      if (Object.keys(ejecutorPatch).length > 0) {
        updates.ejecutorPorCuadro = mergeEjecutorPorCuadro(tarea.ejecutorPorCuadro, ejecutorPatch)
      }
      if (options.cantidadPersonas !== undefined && tarea.tipo === 'manual') {
        updates.cantidadPersonas = Math.max(tarea.cantidadPersonas, options.cantidadPersonas)
      }

      await updateDoc(doc(db, 'tareas', tareaId), updates)

      const tareaActualizada: Tarea = {
        ...tarea,
        cuadros: [...new Set([...(tarea.cuadros ?? []), ...cuadros])],
        cuadroIds: [...new Set([...(tarea.cuadroIds ?? []), ...cuadroIds])],
        ...(Object.keys(ejecutorPatch).length > 0
          ? { ejecutorPorCuadro: mergeEjecutorPorCuadro(tarea.ejecutorPorCuadro, ejecutorPatch) }
          : {}),
        ...(options.cantidadPersonas !== undefined && tarea.tipo === 'manual'
          ? { cantidadPersonas: Math.max(tarea.cantidadPersonas, options.cantidadPersonas) }
          : {}),
      }

      const parteEjecutor: ParteEjecutorOverride | undefined =
        tarea.tipo === 'manual'
          ? {
              cuadrilla: options.cuadrilla,
              cantidadPersonas: options.cantidadPersonas,
            }
          : {
              persona: options.persona,
              maquinaria: options.maquinaria,
              maquinariaModelo: options.maquinariaModelo,
              maquinariaId: options.maquinariaId,
            }

      await abrirParteDeLabores(tareaActualizada, parteEjecutor)
      setFirestoreError(null)
      setLastCreatedTareaId(tareaId)
      setSuccessMsg({
        message: 'Cuadros agregados a tarea existente',
        detail: `Se agregaron ${cuadros.length} cuadro${cuadros.length > 1 ? 's' : ''} a la labor ${tarea.tarea}`,
      })
      if (!navigator.onLine) {
        markPendingSync()
        showToast(OFFLINE_WRITE_TOAST, 'info')
      }
      navigate(`${MOBILE_ROUTES.exito}?motivo=inicio`)
      return true
    } catch (err) {
      console.error('Error al continuar tarea:', err)
      setFirestoreError('Error al agregar cuadros a la tarea. Revisá la conexión y las reglas de Firestore.')
      return false
    } finally {
      submittingRef.current = false
    }
  }, [tareasActivas, abrirParteDeLabores, showToast, markPendingSync, navigate])

  const handleRegisterRendimiento = useCallback(async (
    tareaId: string,
    cantidad: number,
    unidad: RendimientoUnidad,
    extras: { horaInicio?: string; horaFin?: string; observaciones?: string; clima?: WeatherSnapshot } = {},
  ) => {
    if (submittingRef.current) return
    const tarea = tareasActivas.find(t => t.id === tareaId)
    const parteAbierto = partesAbiertosRef.current.find(p => p.tareaId === tareaId)
    if (!tarea || !parteAbierto) {
      showToast('No hay un parte de labores abierto para esta tarea.', 'error')
      return
    }

    if (!Number.isFinite(cantidad) || cantidad <= 0) return
    const texto = formatRendimiento(cantidad, unidad)

    submittingRef.current = true
    try {
      await registerOperador(operadorNombre)
      const cerradoEn = Timestamp.fromDate(resolveCerradoEn(parteAbierto))
      const batch = writeBatch(db)
      const entry: Record<string, unknown> = {
        fecha: cerradoEn,
        texto,
        operador: operadorNombre,
        cantidad,
        unidad,
        parteId: parteAbierto.id,
      }
      if (extras.horaInicio) entry.horaInicio = extras.horaInicio
      if (extras.horaFin) entry.horaFin = extras.horaFin
      if (extras.observaciones) entry.observaciones = extras.observaciones
      if (extras.clima) entry.clima = extras.clima
      batch.update(doc(db, 'tareas', tareaId), {
        rendimientosDiarios: arrayUnion(entry),
        rendimiento: texto,
      })
      batch.update(
        doc(db, 'partes_labores', parteAbierto.id),
        buildParteCierreUpdate(texto, cerradoEn, cantidad, unidad, extras),
      )
      await batch.commit()

      setFirestoreError(null)
      if (!navigator.onLine) {
        markPendingSync()
        showToast(OFFLINE_WRITE_TOAST, 'info')
      }
      setSuccessMsg({
        message: 'Parte de labores cerrado',
        detail: `${tarea.tarea} — ${texto}`,
      })
      navigate(`${MOBILE_ROUTES.exito}?motivo=rendimiento`)
    } catch (err) {
      console.error('Error al cerrar parte de labores:', err)
      setFirestoreError('Error al guardar el parte de labores. Revisá la conexión y las reglas de Firestore.')
    } finally {
      submittingRef.current = false
    }
  }, [navigate, tareasActivas, operadorNombre, showToast, markPendingSync])

  const handleAccidentSuccess = useCallback((detail?: string) => {
    setSuccessMsg({
      message: 'Informe enviado',
      detail: detail ?? 'El informe fue compartido correctamente.',
    })
    navigate(`${MOBILE_ROUTES.exito}?motivo=accidente`)
  }, [navigate])

  const getTareaActiva = useCallback(
    (tareaId: string) => tareasActivas.find(t => t.id === tareaId),
    [tareasActivas],
  )

  const value = useMemo(
    () => ({
      operadorNombre,
      fincaId,
      fincaNombre,
      tareasActivas,
      partesAbiertos,
      successMsg,
      lastCreatedTareaId,
      firestoreError,
      parseWarning,
      toast,
      isOnline,
      pendingSync,
      hasSession,
      showToast,
      clearToast,
      goToInicio,
      handleOperatorSubmit,
      handleWelcomeDone,
      handleSelectFinca,
      handleStartManualTask,
      handleStartMechanicalTask,
      handleContinueTask,
      handleRegisterRendimiento,
      handleAccidentSuccess,
      getTareaActiva,
    }),
    [
      operadorNombre,
      fincaId,
      fincaNombre,
      tareasActivas,
      partesAbiertos,
      successMsg,
      lastCreatedTareaId,
      firestoreError,
      parseWarning,
      toast,
      isOnline,
      pendingSync,
      hasSession,
      showToast,
      clearToast,
      goToInicio,
      handleOperatorSubmit,
      handleWelcomeDone,
      handleSelectFinca,
      handleStartManualTask,
      handleStartMechanicalTask,
      handleContinueTask,
      handleRegisterRendimiento,
      handleAccidentSuccess,
      getTareaActiva,
    ],
  )

  return <MobileAppContext.Provider value={value}>{children}</MobileAppContext.Provider>
}

export function useMobileAppContext(): MobileAppContextValue {
  const ctx = useContext(MobileAppContext)
  if (!ctx) {
    throw new Error('useMobileAppContext debe usarse dentro de MobileAppProvider')
  }
  return ctx
}
