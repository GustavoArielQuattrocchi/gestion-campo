import { useCallback, useEffect, useMemo, useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '../../../providers/AuthProvider'
import { esCuadroProductivo, getCuadrosPorFinca, type CuadroDetalle } from '../../../data/fincaData'
import { getOrdenById, getOrdenes } from '../../ordenesCura/services/ordenesCuraService'
import type { OrdenCura, OrdenCuraWithItems } from '../../ordenesCura/types'
import { parseLeadingNumber } from '../../ordenesCura/utils/factor'
import {
  calcularTurno,
  catalogFincaFromOc,
  type CalculoTurnoResult,
} from '../../../utils/aplicacionFitosanitaria'
import {
  createAplicacion,
  deleteAplicacion,
  getAplicaciones,
  updateAplicacion,
} from '../services/aplicacionesService'
import type { AplicacionFitosanitaria } from '../types'

export interface CuadroRow {
  localId: string
  cuadroId: string
  hileras: string
  nombre?: string
  canopia_hil?: number
  canopia_ha?: number
}

type Banner = { type: 'success' | 'error'; text: string } | null

function todayInput(): string {
  const now = new Date()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${mm}-${dd}`
}

function tsToInput(ts: Timestamp): string {
  const d = ts.toDate()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function inputToTs(value: string): Timestamp {
  if (!value) return Timestamp.now()
  const d = new Date(`${value}T00:00:00`)
  return Number.isNaN(d.getTime()) ? Timestamp.now() : Timestamp.fromDate(d)
}

function newLocalId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `row-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function emptyCuadroRow(): CuadroRow {
  return { localId: newLocalId(), cuadroId: '', hileras: '' }
}

function rowsFromTurno(turno: AplicacionFitosanitaria): CuadroRow[] {
  const rows = turno.cuadros
    .filter(c => c.cuadroId)
    .map(c => ({
      localId: newLocalId(),
      cuadroId: c.cuadroId,
      hileras: String(c.hileras),
      nombre: c.nombre,
      canopia_hil: c.canopia_hil,
      canopia_ha: c.canopia_ha,
    }))
  return rows.length > 0 ? rows : [emptyCuadroRow()]
}

export function useAplicacionesFitosanitarias() {
  const { user } = useAuth()
  const [ordenes, setOrdenes] = useState<OrdenCura[]>([])
  const [aplicaciones, setAplicaciones] = useState<AplicacionFitosanitaria[]>([])
  const [orden, setOrden] = useState<OrdenCuraWithItems | null>(null)
  const [turnoId, setTurnoId] = useState<string | null>(null)
  const [readOnly, setReadOnly] = useState(false)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingOrden, setLoadingOrden] = useState(false)
  const [saving, setSaving] = useState(false)
  const [banner, setBanner] = useState<Banner>(null)
  const [fecha, setFecha] = useState(todayInput)
  const [volumenLitros, setVolumenLitros] = useState('')
  const [cuadros, setCuadros] = useState<CuadroRow[]>([emptyCuadroRow()])

  const userId = user?.uid ?? ''
  const registradoPor = user?.email ?? ''

  const refresh = useCallback(async () => {
    if (!userId) {
      setLoadingList(false)
      return
    }
    setLoadingList(true)
    try {
      const [listOrdenes, listApps] = await Promise.all([
        getOrdenes(),
        getAplicaciones(),
      ])
      setOrdenes(listOrdenes)
      setAplicaciones(listApps)
    } catch (err) {
      console.error('[Aplicaciones] Error al listar:', err)
      setBanner({ type: 'error', text: 'No se pudieron cargar las órdenes.' })
    } finally {
      setLoadingList(false)
    }
  }, [userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const resetForm = useCallback(() => {
    setTurnoId(null)
    setReadOnly(false)
    setFecha(todayInput())
    setVolumenLitros('')
    setCuadros([emptyCuadroRow()])
    setBanner(null)
  }, [])

  const aplicarTurnoAlForm = useCallback((turno: AplicacionFitosanitaria, soloLectura: boolean) => {
    setTurnoId(turno.id)
    setReadOnly(soloLectura)
    setFecha(tsToInput(turno.fecha))
    setVolumenLitros(String(turno.volumenLitros))
    setCuadros(rowsFromTurno(turno))
  }, [])

  const seleccionarOrden = useCallback(
    async (ordenId: string) => {
      setLoadingOrden(true)
      setBanner(null)
      try {
        const full = await getOrdenById(ordenId)
        setOrden(full)
        resetForm()
      } catch (err) {
        console.error('[Aplicaciones] Error al abrir la orden:', err)
        setBanner({ type: 'error', text: 'No se pudo abrir la orden.' })
      } finally {
        setLoadingOrden(false)
      }
    },
    [resetForm],
  )

  const cerrarOrden = useCallback(() => {
    setOrden(null)
    resetForm()
    setBanner(null)
  }, [resetForm])

  const fincaCatalogo = orden ? catalogFincaFromOc(orden.finca) : ''

  const cuadrosCatalogo: CuadroDetalle[] = useMemo(() => {
    if (!fincaCatalogo) return []
    return getCuadrosPorFinca(fincaCatalogo)
      .filter(c => esCuadroProductivo(c))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  }, [fincaCatalogo])

  const cuadrosById = useMemo(() => {
    return new Map(cuadrosCatalogo.map(c => [c.id, c]))
  }, [cuadrosCatalogo])

  const calculo: CalculoTurnoResult = useMemo(() => {
    const litros = Number(volumenLitros.replace(',', '.'))
    const volAplicacion = orden?.vol_aplicacion ?? 0
    const inputs = cuadros.map(row => {
      const cat = cuadrosById.get(row.cuadroId)
      const canopiaHil = cat && cat.canopia_hil > 0 ? cat.canopia_hil : (row.canopia_hil ?? 0)
      const canopiaHa = cat && cat.canopia_ha > 0 ? cat.canopia_ha : (row.canopia_ha ?? 0)
      return {
        cuadroId: row.cuadroId,
        nombre: cat?.nombre ?? row.nombre ?? row.cuadroId,
        hileras: Number(row.hileras.replace(',', '.')) || 0,
        canopia_hil: canopiaHil,
        canopia_ha: canopiaHa,
      }
    })
    const productos = (orden?.items ?? []).map(item => ({
      producto: item.producto,
      ia: item.ia,
      presentacion: item.presentacion,
      dosisHa: parseLeadingNumber(item.dosis_ha),
      dosisMaquinada: item.dosis_maquinada,
    }))
    return calcularTurno(litros, volAplicacion, inputs, productos)
  }, [volumenLitros, orden, cuadros, cuadrosById])

  const turnosDeOrden = useMemo(() => {
    if (!orden) return []
    return aplicaciones.filter(a => a.ordenId === orden.id)
  }, [aplicaciones, orden])

  const puedeGuardar = useMemo(() => {
    if (!orden || !userId || readOnly || saving) return false
    const litros = Number(volumenLitros.replace(',', '.'))
    if (!Number.isFinite(litros) || litros <= 0) return false
    if (orden.vol_aplicacion <= 0) return false
    if (calculo.haTotal <= 0) return false
    return calculo.productos.some(p => p.gasto !== null)
  }, [orden, userId, readOnly, saving, volumenLitros, calculo])

  const addCuadro = useCallback(() => {
    setCuadros(rows => [...rows, emptyCuadroRow()])
  }, [])

  const removeCuadro = useCallback((localId: string) => {
    setCuadros(rows => (rows.length <= 1 ? [emptyCuadroRow()] : rows.filter(r => r.localId !== localId)))
  }, [])

  const updateCuadro = useCallback((localId: string, patch: Partial<Pick<CuadroRow, 'cuadroId' | 'hileras'>>) => {
    setCuadros(rows => rows.map(r => (r.localId === localId ? { ...r, ...patch } : r)))
  }, [])

  const payloadTurno = useCallback(() => {
    if (!orden) return null
    const litros = Number(volumenLitros.replace(',', '.'))
    return {
      ordenId: orden.id,
      oc: orden.oc,
      finca: orden.finca,
      fincaCatalogo,
      cultivo: orden.cultivo,
      fecha: inputToTs(fecha),
      volumenLitros: litros,
      vol_aplicacion: orden.vol_aplicacion,
      vol_maquinaria: orden.vol_maquinaria,
      cuadros: calculo.cuadros
        .filter(c => c.cuadroId)
        .map(c => ({
          cuadroId: c.cuadroId,
          nombre: c.nombre,
          hileras: c.hileras,
          canopia_hil: c.canopia_hil,
          canopia_ha: c.canopia_ha,
          haEstimada: c.haEstimada,
        })),
      haTotal: calculo.haTotal,
      productos: calculo.productos.map(p => ({
        producto: p.producto,
        ia: p.ia,
        presentacion: p.presentacion,
        dosisHaReceta: p.dosisHaReceta,
        dosisMaquinada: p.dosisMaquinada,
        gasto: p.gasto,
        dosisRealHa: p.dosisRealHa,
      })),
    }
  }, [orden, volumenLitros, fincaCatalogo, fecha, calculo])

  const guardar = useCallback(async () => {
    if (!orden || !userId || !puedeGuardar) return
    const payload = payloadTurno()
    if (!payload) return
    setSaving(true)
    setBanner(null)
    try {
      if (turnoId) {
        await updateAplicacion(turnoId, payload)
        const listApps = await getAplicaciones()
        setAplicaciones(listApps)
        setReadOnly(true)
        setBanner({ type: 'success', text: 'Turno actualizado.' })
      } else {
        const newId = await createAplicacion({
          ...payload,
          owner_id: userId,
          registrado_por: registradoPor,
        })
        const listApps = await getAplicaciones()
        setAplicaciones(listApps)
        setTurnoId(newId)
        setReadOnly(true)
        setBanner({ type: 'success', text: 'Turno guardado. Podés verlo o editarlo desde la lista.' })
      }
    } catch (err) {
      console.error('[Aplicaciones] Error al guardar:', err)
      setBanner({ type: 'error', text: 'No se pudo guardar el turno.' })
    } finally {
      setSaving(false)
    }
  }, [orden, userId, puedeGuardar, payloadTurno, turnoId, registradoPor])

  const abrirTurno = useCallback(
    (id: string, modo: 'ver' | 'editar') => {
      const turno = aplicaciones.find(a => a.id === id)
      if (!turno) {
        setBanner({ type: 'error', text: 'No se encontró el turno.' })
        return
      }
      aplicarTurnoAlForm(turno, modo === 'ver')
      setBanner({
        type: 'success',
        text: modo === 'ver'
          ? `Viendo el turno del ${tsToInput(turno.fecha)}. Usá Editar para corregirlo.`
          : `Editando el turno del ${tsToInput(turno.fecha)}.`,
      })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [aplicaciones, aplicarTurnoAlForm],
  )

  const editarTurnoAbierto = useCallback(() => {
    if (!turnoId) return
    setReadOnly(false)
    setBanner({ type: 'success', text: 'Ya podés modificar litros, cuadros e hileras.' })
  }, [turnoId])

  const eliminarTurno = useCallback(
    async (id: string) => {
      const objetivo = aplicaciones.find(a => a.id === id)
      const ok = window.confirm(
        `¿Eliminar el turno de ${objetivo?.oc ?? 'esta orden'}? Esta acción no se puede deshacer.`,
      )
      if (!ok) return
      try {
        await deleteAplicacion(id)
        setAplicaciones(list => list.filter(a => a.id !== id))
        if (turnoId === id) resetForm()
        setBanner({ type: 'success', text: 'Turno eliminado.' })
      } catch (err) {
        console.error('[Aplicaciones] Error al eliminar:', err)
        setBanner({ type: 'error', text: 'No se pudo eliminar el turno.' })
      }
    },
    [aplicaciones, turnoId, resetForm],
  )

  return {
    ordenes,
    aplicaciones,
    orden,
    turnoId,
    readOnly,
    loadingList,
    loadingOrden,
    saving,
    banner,
    fecha,
    setFecha,
    volumenLitros,
    setVolumenLitros,
    cuadros,
    cuadrosCatalogo,
    fincaCatalogo,
    calculo,
    turnosDeOrden,
    puedeGuardar,
    registradoPor,
    seleccionarOrden,
    cerrarOrden,
    nuevoTurno: resetForm,
    abrirTurno,
    editarTurnoAbierto,
    addCuadro,
    removeCuadro,
    updateCuadro,
    guardar,
    eliminarTurno,
  }
}
