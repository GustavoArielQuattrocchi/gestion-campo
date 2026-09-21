import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../providers/AuthProvider'
import { getCatalogo } from '../../ordenesCura/services/catalogoService'
import type { ProductoCatalogo } from '../../ordenesCura/services/catalogoService'
import { getAplicaciones, updateAplicacion } from '../../aplicacionesFitosanitarias/services/aplicacionesService'
import type { AplicacionFitosanitaria } from '../../aplicacionesFitosanitarias/types'
import { PUNTOS_STOCK, type PuntoStock } from '../constants'
import {
  aplicarEgresoTurno,
  confirmarTransferencia,
  getStockMovimientos,
  getStockSaldos,
  rechazarTransferencia,
  registrarAjuste,
  registrarConteo,
  registrarIngreso,
  solicitarTransferencia,
} from '../services/stockService'
import { faltantesDeEgreso, productoKeyFromNombre } from '../utils/stockMath'
import {
  confirmarProductoPropuesta,
  getProductoPropuestas,
  rechazarProductoPropuesta,
} from '../services/stockProductoPropuestas'
import type { StockCargaInput, StockFaltante, StockMovimiento, StockProductoPropuesta, StockSaldo } from '../types'

type Banner = { type: 'success' | 'error'; text: string } | null

export function useStockAdmin() {
  const { user } = useAuth()
  const adminEmail = user?.email ?? ''
  const [saldos, setSaldos] = useState<StockSaldo[]>([])
  const [movimientos, setMovimientos] = useState<StockMovimiento[]>([])
  const [propuestas, setPropuestas] = useState<StockProductoPropuesta[]>([])
  const [catalogo, setCatalogo] = useState<ProductoCatalogo[]>([])
  const [turnos, setTurnos] = useState<AplicacionFitosanitaria[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [banner, setBanner] = useState<Banner>(null)
  const [puntoFiltro, setPuntoFiltro] = useState<PuntoStock | 'todos'>('todos')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [s, m, p, c, t] = await Promise.all([
        getStockSaldos(),
        getStockMovimientos(),
        getProductoPropuestas(),
        getCatalogo(),
        getAplicaciones(),
      ])
      setSaldos(s)
      setMovimientos(m)
      setPropuestas(p)
      setCatalogo(c)
      setTurnos(t)
    } catch (err) {
      console.error('[Stock admin]', err)
      setBanner({ type: 'error', text: 'No se pudo cargar el stock.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const saldosFiltrados = useMemo(
    () => puntoFiltro === 'todos' ? saldos : saldos.filter(s => s.punto === puntoFiltro),
    [puntoFiltro, saldos],
  )

  const pendientesTransfer = useMemo(
    () => movimientos.filter(m => m.tipo === 'transferencia' && m.estado === 'pendiente'),
    [movimientos],
  )

  const propuestasPendientes = useMemo(
    () => propuestas.filter(p => p.estado === 'pendiente'),
    [propuestas],
  )

  const turnosSinDeposito = useMemo(
    () => turnos.filter(t => !t.depositoPunto),
    [turnos],
  )

  const run = useCallback(async (fn: () => Promise<void>, ok: string) => {
    setSaving(true)
    setBanner(null)
    try {
      await fn()
      await refresh()
      setBanner({ type: 'success', text: ok })
    } catch (err) {
      console.error('[Stock admin]', err)
      setBanner({ type: 'error', text: 'No se pudo completar la acción.' })
    } finally {
      setSaving(false)
    }
  }, [refresh])

  const cargarAdmin = useCallback((input: StockCargaInput, modo: 'ingreso' | 'conteo' | 'ajuste', delta?: number) => {
    const operador = adminEmail || 'escritorio'
    if (modo === 'ingreso') return run(() => registrarIngreso(input, operador), 'Ingreso guardado.')
    if (modo === 'conteo') return run(() => registrarConteo(input, operador), 'Conteo guardado.')
    return run(() => registrarAjuste({ ...input, delta: delta ?? 0 }, operador), 'Ajuste guardado.')
  }, [adminEmail, run])

  const transferirAdmin = useCallback((input: Parameters<typeof solicitarTransferencia>[0]) => {
    return run(
      async () => {
        const id = await solicitarTransferencia(input, adminEmail || 'escritorio')
        await confirmarTransferencia(id, adminEmail)
      },
      'Transferencia confirmada.',
    )
  }, [adminEmail, run])

  return {
    saldos: saldosFiltrados,
    movimientos,
    catalogo,
    pendientesTransfer,
    propuestasPendientes,
    turnosSinDeposito,
    loading,
    saving,
    banner,
    setBanner,
    puntoFiltro,
    setPuntoFiltro,
    puntos: PUNTOS_STOCK,
    refresh,
    cargarAdmin,
    transferirAdmin,
    confirmarTransfer: (id: string) => run(() => confirmarTransferencia(id, adminEmail), 'Transferencia confirmada.'),
    rechazarTransfer: (id: string) => run(() => rechazarTransferencia(id, adminEmail), 'Transferencia rechazada.'),
    confirmarProducto: (id: string) => run(() => confirmarProductoPropuesta(id, adminEmail), 'Producto agregado al catálogo.'),
    rechazarProducto: (id: string) => run(() => rechazarProductoPropuesta(id, adminEmail), 'Producto rechazado.'),
    asignarDepositoTurno: async (turno: AplicacionFitosanitaria, punto: PuntoStock, confirmarNegativo = false) => {
      const lineas = turno.productos.map(p => ({
        producto: p.producto,
        productoKey: productoKeyFromNombre(p.producto),
        ia: p.ia,
        presentacion: p.presentacion,
        gasto: p.gasto,
      }))
      const faltantes = faltantesDeEgreso(saldos, punto, lineas)
      if (faltantes.length > 0 && !confirmarNegativo) return faltantes
      await run(async () => {
        await updateAplicacion(turno.id, {
          ordenId: turno.ordenId,
          oc: turno.oc,
          finca: turno.finca,
          fincaCatalogo: turno.fincaCatalogo,
          cultivo: turno.cultivo,
          fecha: turno.fecha,
          volumenLitros: turno.volumenLitros,
          vol_aplicacion: turno.vol_aplicacion,
          vol_maquinaria: turno.vol_maquinaria,
          cuadros: turno.cuadros,
          haTotal: turno.haTotal,
          productos: turno.productos,
          depositoPunto: punto,
        })
        await aplicarEgresoTurno({
          turnoId: turno.id,
          ordenId: turno.ordenId,
          oc: turno.oc,
          punto,
          operador: adminEmail,
          productos: lineas,
        })
      }, `Turno ${turno.oc} asignado a ${punto}.`)
      return [] as StockFaltante[]
    },
    productoKeyFromNombre,
  }
}
