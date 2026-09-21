import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore'
import { auth, db } from '../../../firebase'
import { claveProducto } from '../../../data/productoCatalogoAlias'
import {
  type PuntoStock,
  type StockMovimientoEstado,
  type StockMovimientoTipo,
} from '../constants'
import type {
  StockCargaInput,
  StockMovimiento,
  StockProductoRef,
  StockSaldo,
} from '../types'
import { conteoDelta, nextSaldo, productoKeyFromNombre, saldoDocId } from '../utils/stockMath'

const SALDOS = 'stockSaldos'
const MOVIMIENTOS = 'stockMovimientos'

function saldosCol() {
  return collection(db, SALDOS)
}

function movimientosCol() {
  return collection(db, MOVIMIENTOS)
}

function toStr(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function toNum(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function toTs(value: unknown): Timestamp {
  return value instanceof Timestamp ? value : Timestamp.now()
}

function actor() {
  const user = auth.currentUser
  if (!user) throw new Error('No hay sesión de Firebase activa')
  return { uid: user.uid, email: user.email ?? '' }
}

function mapSaldo(id: string, data: DocumentData): StockSaldo | null {
  const punto = toStr(data.punto)
  if (punto !== 'FOA' && punto !== 'FLP' && punto !== 'FSC' && punto !== 'FSP') return null
  return {
    id,
    punto,
    producto: toStr(data.producto),
    productoKey: toStr(data.productoKey) || claveProducto(toStr(data.producto)),
    ia: toStr(data.ia),
    presentacion: toStr(data.presentacion),
    cantidad: toNum(data.cantidad),
    actualizadoEn: toTs(data.actualizadoEn),
  }
}

function mapMovimiento(id: string, data: DocumentData): StockMovimiento {
  const punto = toStr(data.punto)
  const origen = toStr(data.puntoOrigen)
  const destino = toStr(data.puntoDestino)
  return {
    id,
    tipo: toStr(data.tipo) as StockMovimientoTipo,
    estado: toStr(data.estado) as StockMovimientoEstado,
    producto: toStr(data.producto),
    productoKey: toStr(data.productoKey) || claveProducto(toStr(data.producto)),
    ia: toStr(data.ia),
    presentacion: toStr(data.presentacion),
    cantidad: toNum(data.cantidad),
    delta: toNum(data.delta),
    punto: punto === 'FOA' || punto === 'FLP' || punto === 'FSC' || punto === 'FSP' ? punto : undefined,
    puntoOrigen: origen === 'FOA' || origen === 'FLP' || origen === 'FSC' || origen === 'FSP' ? origen : undefined,
    puntoDestino: destino === 'FOA' || destino === 'FLP' || destino === 'FSC' || destino === 'FSP' ? destino : undefined,
    operador: toStr(data.operador),
    owner_id: toStr(data.owner_id),
    nota: toStr(data.nota) || undefined,
    turnoId: toStr(data.turnoId) || undefined,
    ordenId: toStr(data.ordenId) || undefined,
    oc: toStr(data.oc) || undefined,
    created_at: toTs(data.created_at),
    confirmadoPor: toStr(data.confirmadoPor) || undefined,
    confirmadoEn: data.confirmadoEn instanceof Timestamp ? data.confirmadoEn : undefined,
  }
}

function refProducto(input: StockProductoRef): StockProductoRef {
  const producto = input.producto.trim()
  return {
    producto,
    productoKey: input.productoKey || productoKeyFromNombre(producto),
    ia: input.ia.trim(),
    presentacion: input.presentacion.trim(),
  }
}

type StockTx = Parameters<Parameters<typeof runTransaction>[1]>[0]

function saldoRef(punto: PuntoStock, productoKey: string) {
  return doc(db, SALDOS, saldoDocId(punto, productoKey))
}

async function readSaldoTx(tx: StockTx, punto: PuntoStock, productoKey: string): Promise<number> {
  const snap = await tx.get(saldoRef(punto, productoKey))
  return snap.exists() ? toNum(snap.data()?.cantidad) : 0
}

function writeSaldoTx(
  tx: StockTx,
  punto: PuntoStock,
  producto: StockProductoRef,
  cantidad: number,
  now: Timestamp,
) {
  tx.set(saldoRef(punto, producto.productoKey), {
    punto,
    ...producto,
    cantidad,
    actualizadoEn: now,
  }, { merge: true })
}

export async function getStockSaldos(punto?: PuntoStock): Promise<StockSaldo[]> {
  const snap = punto
    ? await getDocs(query(saldosCol(), where('punto', '==', punto)))
    : await getDocs(saldosCol())
  return snap.docs
    .map(d => mapSaldo(d.id, d.data()))
    .filter((s): s is StockSaldo => s !== null)
    .sort((a, b) => a.punto.localeCompare(b.punto) || a.producto.localeCompare(b.producto, 'es'))
}

export async function getStockMovimientos(): Promise<StockMovimiento[]> {
  const snap = await getDocs(movimientosCol())
  return snap.docs
    .map(d => mapMovimiento(d.id, d.data()))
    .sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis())
}

export async function registrarIngreso(input: StockCargaInput, operador: string): Promise<void> {
  const { uid } = actor()
  const producto = refProducto(input)
  const cantidad = input.cantidad
  if (cantidad <= 0) throw new Error('cantidad')
  const now = Timestamp.now()
  await runTransaction(db, async tx => {
    const actual = await readSaldoTx(tx, input.punto, producto.productoKey)
    writeSaldoTx(tx, input.punto, producto, nextSaldo(actual, cantidad), now)
    tx.set(doc(movimientosCol()), {
      tipo: 'ingreso',
      estado: 'confirmado',
      ...producto,
      cantidad,
      delta: cantidad,
      punto: input.punto,
      operador,
      owner_id: uid,
      nota: input.nota?.trim() || '',
      created_at: now,
    })
  })
}

export async function registrarConteo(input: StockCargaInput, operador: string): Promise<void> {
  const { uid } = actor()
  const producto = refProducto(input)
  const now = Timestamp.now()
  await runTransaction(db, async tx => {
    const actual = await readSaldoTx(tx, input.punto, producto.productoKey)
    const delta = conteoDelta(actual, input.cantidad)
    writeSaldoTx(tx, input.punto, producto, input.cantidad, now)
    tx.set(doc(movimientosCol()), {
      tipo: 'conteo',
      estado: 'confirmado',
      ...producto,
      cantidad: input.cantidad,
      delta,
      punto: input.punto,
      operador,
      owner_id: uid,
      nota: input.nota?.trim() || '',
      created_at: now,
    })
  })
}

export async function registrarAjuste(
  input: StockCargaInput & { delta: number },
  operador: string,
): Promise<void> {
  const { uid } = actor()
  const producto = refProducto(input)
  if (input.delta === 0) throw new Error('delta')
  const now = Timestamp.now()
  await runTransaction(db, async tx => {
    const actual = await readSaldoTx(tx, input.punto, producto.productoKey)
    writeSaldoTx(tx, input.punto, producto, nextSaldo(actual, input.delta), now)
    tx.set(doc(movimientosCol()), {
      tipo: 'ajuste',
      estado: 'confirmado',
      ...producto,
      cantidad: Math.abs(input.delta),
      delta: input.delta,
      punto: input.punto,
      operador,
      owner_id: uid,
      nota: input.nota?.trim() || '',
      created_at: now,
    })
  })
}

export async function solicitarTransferencia(
  input: StockProductoRef & {
    puntoOrigen: PuntoStock
    puntoDestino: PuntoStock
    cantidad: number
    nota?: string
  },
  operador: string,
): Promise<string> {
  if (input.puntoOrigen === input.puntoDestino) throw new Error('mismo_punto')
  if (input.cantidad <= 0) throw new Error('cantidad')
  const { uid } = actor()
  const producto = refProducto(input)
  const ref = await addDoc(movimientosCol(), {
    tipo: 'transferencia',
    estado: 'pendiente',
    ...producto,
    cantidad: input.cantidad,
    delta: 0,
    puntoOrigen: input.puntoOrigen,
    puntoDestino: input.puntoDestino,
    operador,
    owner_id: uid,
    nota: input.nota?.trim() || '',
    created_at: Timestamp.now(),
  })
  return ref.id
}

export async function confirmarTransferencia(movimientoId: string, adminEmail: string): Promise<void> {
  const now = Timestamp.now()
  await runTransaction(db, async tx => {
    const movRef = doc(db, MOVIMIENTOS, movimientoId)
    const snap = await tx.get(movRef)
    if (!snap.exists()) throw new Error('no_existe')
    const mov = mapMovimiento(snap.id, snap.data())
    if (mov.tipo !== 'transferencia' || mov.estado !== 'pendiente') throw new Error('estado')
    if (!mov.puntoOrigen || !mov.puntoDestino) throw new Error('puntos')
    const producto = refProducto(mov)
    const origenActual = await readSaldoTx(tx, mov.puntoOrigen, producto.productoKey)
    const destinoActual = await readSaldoTx(tx, mov.puntoDestino, producto.productoKey)
    writeSaldoTx(tx, mov.puntoOrigen, producto, nextSaldo(origenActual, -mov.cantidad), now)
    writeSaldoTx(tx, mov.puntoDestino, producto, nextSaldo(destinoActual, mov.cantidad), now)
    tx.update(movRef, {
      estado: 'confirmado',
      delta: -mov.cantidad,
      confirmadoPor: adminEmail,
      confirmadoEn: now,
    })
  })
}

export async function rechazarTransferencia(movimientoId: string, adminEmail: string): Promise<void> {
  await updateDoc(doc(db, MOVIMIENTOS, movimientoId), {
    estado: 'rechazado',
    confirmadoPor: adminEmail,
    confirmadoEn: Timestamp.now(),
  })
}

export async function aplicarEgresoTurno(input: {
  turnoId: string
  ordenId: string
  oc: string
  punto: PuntoStock
  operador: string
  productos: Array<StockProductoRef & { gasto: number | null }>
}): Promise<void> {
  const { uid } = actor()
  const now = Timestamp.now()
  const lineas = input.productos
    .map(p => ({ ...refProducto(p), gasto: p.gasto }))
    .filter(p => p.gasto != null && p.gasto > 0) as Array<StockProductoRef & { gasto: number }>
  if (lineas.length === 0) return

  await runTransaction(db, async tx => {
    const actuales: number[] = []
    for (const linea of lineas) {
      actuales.push(await readSaldoTx(tx, input.punto, linea.productoKey))
    }
    lineas.forEach((linea, index) => {
      writeSaldoTx(tx, input.punto, linea, nextSaldo(actuales[index] ?? 0, -linea.gasto), now)
    })
    for (const linea of lineas) {
      tx.set(doc(movimientosCol()), {
        tipo: 'egreso_turno',
        estado: 'confirmado',
        ...linea,
        cantidad: linea.gasto,
        delta: -linea.gasto,
        punto: input.punto,
        operador: input.operador,
        owner_id: uid,
        turnoId: input.turnoId,
        ordenId: input.ordenId,
        oc: input.oc,
        created_at: now,
      })
    }
  })
}

export async function revertirEgresoTurno(turnoId: string, operador: string): Promise<void> {
  const snap = await getDocs(query(movimientosCol(), where('turnoId', '==', turnoId)))
  const vigentes = snap.docs
    .map(d => mapMovimiento(d.id, d.data()))
    .filter(m => m.tipo === 'egreso_turno' && m.estado === 'confirmado' && m.punto)
  if (vigentes.length === 0) return

  const now = Timestamp.now()
  await runTransaction(db, async tx => {
    const actuales: number[] = []
    for (const mov of vigentes) {
      actuales.push(await readSaldoTx(tx, mov.punto as PuntoStock, refProducto(mov).productoKey))
    }
    vigentes.forEach((mov, index) => {
      const producto = refProducto(mov)
      writeSaldoTx(tx, mov.punto as PuntoStock, producto, nextSaldo(actuales[index] ?? 0, mov.cantidad), now)
      tx.update(doc(db, MOVIMIENTOS, mov.id), {
        estado: 'anulado',
        confirmadoPor: operador,
        confirmadoEn: now,
      })
    })
  })
}
