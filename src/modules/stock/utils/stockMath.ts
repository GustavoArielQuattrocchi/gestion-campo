import { claveProducto } from '../../../data/productoCatalogoAlias'
import { isPuntoStock, type PuntoStock } from '../constants'
import type { StockFaltante, StockProductoRef } from '../types'

export function roundStock(value: number): number {
  return Math.round((value + Number.EPSILON) * 10_000) / 10_000
}

export function productoKeyFromNombre(nombre: string): string {
  return claveProducto(nombre)
}

export function saldoDocId(punto: PuntoStock, productoKey: string): string {
  const safeKey = productoKey.replace(/[/#[\]]/g, '_').replace(/\s+/g, '_').trim()
  return `${punto}__${safeKey}`
}

export function nextSaldo(actual: number, delta: number): number {
  return roundStock((Number.isFinite(actual) ? actual : 0) + delta)
}

export function conteoDelta(actual: number, nuevo: number): number {
  return roundStock(nuevo - (Number.isFinite(actual) ? actual : 0))
}

export function parseCantidadStock(value: string): number | null {
  const n = Number(value.replace(',', '.').trim())
  if (!Number.isFinite(n) || n < 0) return null
  return roundStock(n)
}

export function lookupSaldo(
  saldos: Array<{ punto: string; productoKey: string; cantidad: number }>,
  punto: PuntoStock,
  productoKey: string,
): number {
  const row = saldos.find(s => s.punto === punto && s.productoKey === productoKey)
  return row?.cantidad ?? 0
}

export function faltantesDeEgreso(
  saldos: Array<{ punto: string; productoKey: string; cantidad: number }>,
  punto: PuntoStock,
  lineas: Array<StockProductoRef & { gasto: number | null }>,
): StockFaltante[] {
  const faltantes: StockFaltante[] = []
  for (const linea of lineas) {
    if (linea.gasto == null || linea.gasto <= 0) continue
    const disponible = lookupSaldo(saldos, punto, linea.productoKey || productoKeyFromNombre(linea.producto))
    if (disponible + 1e-9 < linea.gasto) {
      faltantes.push({
        producto: linea.producto,
        presentacion: linea.presentacion,
        solicitado: linea.gasto,
        disponible,
      })
    }
  }
  return faltantes
}

export { isPuntoStock }

export function parsePuntoStock(value: string | null | undefined): PuntoStock | null {
  return isPuntoStock(value) ? value : null
}
