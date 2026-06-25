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
  writeBatch,
} from 'firebase/firestore'
import { auth, db } from '../firebase'
import type { Tarea } from '../types'
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
import { buildParteDeLaboresPayload } from '../utils/buildParteDeLaboresPayload'

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
  successMsg: { message: string; detail: string }
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
  }) => Promise<boolean>
  handleRegisterRendimiento: (tareaId: string, rendimiento: string) => Promise<void>
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
  const [successMsg, setSuccessMsg] = useState({ message: '', detail: '' })
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
        const operador = operadorNombre.trim()
        setTareasActivas(operador ? tareas.filter(t => t.operador === operador) : tareas)
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
      await addDoc(collection(db, 'tareas'), payload)
      setFirestoreError(null)
      if (!navigator.onLine) {
        markPendingSync()
        showToast(OFFLINE_WRITE_TOAST, 'info')
      }
      return true
    } catch (err) {
      console.error('Error al crear tarea manual:', err)
      setFirestoreError('Error al guardar la tarea manual. Revisá la conexión y las reglas de Firestore.')
      return false
    } finally {
      submittingRef.current = false
    }
  }, [fincaId, fincaNombre, operadorNombre, showToast, markPendingSync])

  const handleStartMechanicalTask = useCallback(async (data: {
    tarea: string
    persona: string
    maquinaria: string
    maquinariaModelo?: string
    maquinariaId?: string
    cuadros: string[]
    cuadroIds: string[]
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
      await addDoc(collection(db, 'tareas'), payload)
      setFirestoreError(null)
      if (!navigator.onLine) {
        markPendingSync()
        showToast(OFFLINE_WRITE_TOAST, 'info')
      }
      return true
    } catch (err) {
      console.error('Error al crear tarea mecánica:', err)
      setFirestoreError('Error al guardar la tarea mecánica. Revisá la conexión y las reglas de Firestore.')
      return false
    } finally {
      submittingRef.current = false
    }
  }, [fincaId, fincaNombre, operadorNombre, showToast, markPendingSync])

  const handleRegisterRendimiento = useCallback(async (tareaId: string, rendimiento: string) => {
    if (submittingRef.current) return
    const tarea = tareasActivas.find(t => t.id === tareaId)
    if (!tarea) return

    const texto = rendimiento.trim()
    if (!texto) return

    const entry = {
      fecha: Timestamp.now(),
      texto,
      operador: operadorNombre,
    }

    submittingRef.current = true
    try {
      await registerOperador(operadorNombre)
      const cerradoEn = Timestamp.now()
      const batch = writeBatch(db)
      batch.update(doc(db, 'tareas', tareaId), {
        rendimientosDiarios: arrayUnion(entry),
        rendimiento: texto,
      })
      const parteRef = doc(collection(db, 'partes_labores'))
      batch.set(parteRef, buildParteDeLaboresPayload(tarea, texto, operadorNombre, cerradoEn))
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
      successMsg,
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
      handleRegisterRendimiento,
      handleAccidentSuccess,
      getTareaActiva,
    }),
    [
      operadorNombre,
      fincaId,
      fincaNombre,
      tareasActivas,
      successMsg,
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
