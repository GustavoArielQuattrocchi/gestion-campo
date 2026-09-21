import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import type { ProductoCatalogoVista } from '../data/agroQuimicos'
import { getCatalogo } from '../modules/ordenesCura/services/catalogoService'
import type { ProductoCatalogoAlta } from '../modules/ordenesCura/services/catalogoService'
import { PUNTO_STOCK_LABEL, type PuntoStock } from '../modules/stock/constants'
import {
  getStockSaldos,
  registrarConteo,
  registrarIngreso,
  solicitarTransferencia,
} from '../modules/stock/services/stockService'
import { proponerProducto } from '../modules/stock/services/stockProductoPropuestas'
import type { StockCargaInput, StockSaldo } from '../modules/stock/types'
import { STOCK_ROUTES } from '../stock/routes'
import type { MobileToastState } from '../components/mobile/MobileToast'
import { useOnlineStatus, OFFLINE_FIRST_LAUNCH_ERROR, OFFLINE_WRITE_TOAST } from '../hooks/useOnlineStatus'
import { loadRememberedOperador, saveRememberedOperador } from '../utils/mobileLocalMemory'
import { registerOperador } from '../utils/registerOperador'
import {
  clearStockSession,
  hasStockSession,
  loadStockSession,
  saveStockSession,
} from '../utils/stockSession'

interface StockAppContextValue {
  operadorNombre: string
  punto: PuntoStock | ''
  hasSession: boolean
  catalogo: ProductoCatalogoVista[]
  saldos: StockSaldo[]
  loading: boolean
  firestoreError: string | null
  toast: MobileToastState | null
  clearToast: () => void
  isOnline: boolean
  pendingSync: boolean
  submitOperador: (nombre: string) => Promise<boolean>
  finishWelcome: () => void
  selectPunto: (punto: PuntoStock) => void
  goToInicio: () => void
  refresh: () => Promise<void>
  cargar: (input: Omit<StockCargaInput, 'punto'>, modo: 'ingreso' | 'conteo') => Promise<boolean>
  proponer: (input: ProductoCatalogoAlta) => Promise<boolean>
  transferir: (input: {
    producto: string
    productoKey: string
    ia: string
    presentacion: string
    puntoDestino: PuntoStock
    cantidad: number
    nota?: string
  }) => Promise<boolean>
}

const StockAppContext = createContext<StockAppContextValue | null>(null)

export function useStockAppContext(): StockAppContextValue {
  const ctx = useContext(StockAppContext)
  if (!ctx) throw new Error('useStockAppContext fuera de StockAppProvider')
  return ctx
}

export function StockAppProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const isOnline = useOnlineStatus()
  const initial = loadStockSession()
  const [operadorNombre, setOperadorNombre] = useState(initial?.operadorNombre ?? '')
  const [punto, setPunto] = useState<PuntoStock | ''>(initial?.punto ?? '')
  const [catalogo, setCatalogo] = useState<ProductoCatalogoVista[]>([])
  const [saldos, setSaldos] = useState<StockSaldo[]>([])
  const [loading, setLoading] = useState(false)
  const [firestoreError, setFirestoreError] = useState<string | null>(null)
  const [toast, setToast] = useState<MobileToastState | null>(null)
  const [pendingSync, setPendingSync] = useState(false)

  const hasSession = hasStockSession(operadorNombre, punto)

  const clearToast = useCallback(() => setToast(null), [])

  const refresh = useCallback(async () => {
    if (!punto) {
      setSaldos([])
      return
    }
    setLoading(true)
    try {
      const [cat, list] = await Promise.all([
        getCatalogo(),
        getStockSaldos(punto),
      ])
      setCatalogo(cat)
      setSaldos(list)
      setFirestoreError(null)
    } catch (err) {
      console.error('[Stock] Error al cargar:', err)
      setFirestoreError('No se pudo cargar el stock. Revisá la conexión.')
    } finally {
      setLoading(false)
    }
  }, [punto])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const submitOperador = useCallback(async (nombre: string) => {
    try {
      await registerOperador(nombre)
      saveRememberedOperador(nombre)
      setOperadorNombre(nombre)
      navigate(STOCK_ROUTES.bienvenida)
      return true
    } catch (err) {
      console.error('[Stock] registerOperador:', err)
      setToast({
        variant: 'error',
        message: isOnline ? 'No se pudo registrar el operador.' : OFFLINE_FIRST_LAUNCH_ERROR,
      })
      return false
    }
  }, [isOnline, navigate])

  const finishWelcome = useCallback(() => {
    navigate(STOCK_ROUTES.deposito)
  }, [navigate])

  const selectPunto = useCallback((next: PuntoStock) => {
    setPunto(next)
    saveStockSession({ operadorNombre, punto: next })
    navigate(STOCK_ROUTES.menu)
  }, [navigate, operadorNombre])

  const goToInicio = useCallback(() => {
    clearStockSession()
    setPunto('')
    setOperadorNombre(loadRememberedOperador() ?? '')
    navigate(STOCK_ROUTES.inicio)
  }, [navigate])

  const markOfflineWrite = useCallback(() => {
    if (!isOnline) {
      setPendingSync(true)
      setToast({ variant: 'success', message: OFFLINE_WRITE_TOAST })
    }
  }, [isOnline])

  const cargar = useCallback(async (
    input: Omit<StockCargaInput, 'punto'>,
    modo: 'ingreso' | 'conteo',
  ) => {
    if (!punto) return false
    try {
      const payload = { ...input, punto }
      if (modo === 'conteo') await registrarConteo(payload, operadorNombre)
      else await registrarIngreso(payload, operadorNombre)
      markOfflineWrite()
      await refresh()
      setToast({ variant: 'success', message: modo === 'conteo' ? 'Conteo guardado.' : 'Ingreso guardado.' })
      navigate(STOCK_ROUTES.menu)
      return true
    } catch (err) {
      console.error('[Stock] carga:', err)
      setToast({ variant: 'error', message: 'No se pudo guardar el stock.' })
      return false
    }
  }, [markOfflineWrite, navigate, operadorNombre, punto, refresh])

  const proponer = useCallback(async (input: ProductoCatalogoAlta) => {
    try {
      await proponerProducto(input, operadorNombre)
      markOfflineWrite()
      setToast({ variant: 'success', message: 'Producto enviado. El escritorio lo tiene que confirmar.' })
      navigate(STOCK_ROUTES.menu)
      return true
    } catch (err) {
      console.error('[Stock] producto:', err)
      setToast({ variant: 'error', message: 'Completá nombre, grupo, I.A. y unidad.' })
      return false
    }
  }, [markOfflineWrite, navigate, operadorNombre])

  const transferir = useCallback(async (input: {
    producto: string
    productoKey: string
    ia: string
    presentacion: string
    puntoDestino: PuntoStock
    cantidad: number
    nota?: string
  }) => {
    if (!punto) return false
    try {
      await solicitarTransferencia({
        ...input,
        puntoOrigen: punto,
      }, operadorNombre)
      markOfflineWrite()
      setToast({ variant: 'success', message: `Transferencia a ${PUNTO_STOCK_LABEL[input.puntoDestino]} pendiente de confirmación.` })
      navigate(STOCK_ROUTES.menu)
      return true
    } catch (err) {
      console.error('[Stock] transferencia:', err)
      setToast({ variant: 'error', message: 'No se pudo pedir la transferencia.' })
      return false
    }
  }, [markOfflineWrite, navigate, operadorNombre, punto])

  const value = useMemo<StockAppContextValue>(() => ({
    operadorNombre,
    punto,
    hasSession,
    catalogo,
    saldos,
    loading,
    firestoreError,
    toast,
    clearToast,
    isOnline,
    pendingSync,
    submitOperador,
    finishWelcome,
    selectPunto,
    goToInicio,
    refresh,
    cargar,
    proponer,
    transferir,
  }), [
    operadorNombre, punto, hasSession, catalogo, saldos, loading, firestoreError, toast,
    clearToast, isOnline, pendingSync, submitOperador, finishWelcome, selectPunto,
    goToInicio, refresh, cargar, proponer, transferir,
  ])

  return <StockAppContext.Provider value={value}>{children}</StockAppContext.Provider>
}
