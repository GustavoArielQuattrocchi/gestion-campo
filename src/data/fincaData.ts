import { BASE_DATOS_FINCAS, type CuadroCatalogo } from './fincas'
import { CUADROS_CATALOGO_MAPA } from './cuadrosCatalogoMapa'
import type { Cuadro, Finca } from '../types'

export interface CuadroDetalle extends Cuadro {
  variedad: string
  vinedo: string
  hectareas: number
  finca: string
  extras?: Record<string, string>
}

function mergeCuadro(mapEntry: CuadroCatalogo, manual?: CuadroCatalogo): CuadroCatalogo {
  if (!manual) return mapEntry
  return {
    ...mapEntry,
    ...manual,
    extras: { ...mapEntry.extras, ...manual.extras },
  }
}

const VARIEDADES_EXCLUIDAS = new Set(['centeno', 'inculto'])

/** True si el cuadro es viñedo o nogal (excluye centeno, inculto, etc.). */
export function esCuadroProductivo(c: CuadroCatalogo): boolean {
  return !VARIEDADES_EXCLUIDAS.has(c.variedad.toLowerCase())
}

/** Catálogo completo (mapa + overrides manuales) para mapa, QR y consulta por id. */
function buildCatalogoUnificado(): Record<string, CuadroCatalogo[]> {
  const result: Record<string, CuadroCatalogo[]> = {}
  const fincas = new Set([
    ...Object.keys(CUADROS_CATALOGO_MAPA),
    ...Object.keys(BASE_DATOS_FINCAS),
  ])

  for (const finca of fincas) {
    const fromMap = CUADROS_CATALOGO_MAPA[finca] ?? []
    const manual = BASE_DATOS_FINCAS[finca] ?? []
    const manualById = new Map(manual.map(c => [c.id, c]))
    const mergedIds = new Set<string>()

    const merged: CuadroCatalogo[] = fromMap.map(entry => {
      mergedIds.add(entry.id)
      return mergeCuadro(entry, manualById.get(entry.id))
    })

    for (const entry of manual) {
      if (!mergedIds.has(entry.id)) {
        merged.push(entry)
      }
    }

    merged.sort((a, b) => a.id.localeCompare(b.id, 'es'))
    result[finca] = merged
  }

  return result
}

const CATALOGO_UNIFICADO = buildCatalogoUnificado()

export const fincas: Finca[] = Object.keys(CATALOGO_UNIFICADO).map(nombre => ({
  id: nombre,
  nombre,
}))

/** Cuadros operativos (app campo): lista manual enriquecida con extras del mapa. */
export function getCuadrosPorFinca(fincaNombre: string): CuadroDetalle[] {
  const manual = BASE_DATOS_FINCAS[fincaNombre] ?? []
  const mapById = new Map((CUADROS_CATALOGO_MAPA[fincaNombre] ?? []).map(c => [c.id, c]))
  return manual.map(entry => {
    const mapEntry = mapById.get(entry.id)
    const merged = mapEntry ? mergeCuadro(mapEntry, entry) : entry
    return { ...merged, finca: fincaNombre }
  })
}

export function getCuadroDetalleById(cuadroId: string): CuadroDetalle | null {
  for (const [finca, cuadros] of Object.entries(CATALOGO_UNIFICADO)) {
    const found = cuadros.find(c => c.id === cuadroId)
    if (found) return { ...found, finca }
  }
  return null
}

export function getTotalHectareasFinca(fincaId: string): number {
  const cuadros = CATALOGO_UNIFICADO[fincaId]
  if (!cuadros) return 0
  return cuadros.filter(esCuadroProductivo).reduce((sum, c) => sum + c.hectareas, 0)
}

export function getHectareasCuadro(fincaId: string, cuadroId: string): number {
  const cuadros = CATALOGO_UNIFICADO[fincaId]
  if (!cuadros) return 0
  return cuadros.find(c => c.id === cuadroId)?.hectareas ?? 0
}

export function getNombreCuadro(fincaId: string, cuadroId: string): string {
  const found = getCuadroDetalleById(cuadroId)
  if (found && found.finca === fincaId) return found.nombre
  const cuadros = BASE_DATOS_FINCAS[fincaId]
  if (!cuadros) return cuadroId
  return cuadros.find(c => c.id === cuadroId)?.nombre ?? cuadroId
}

export function getCuadroDetalle(fincaId: string, cuadroId: string): CuadroDetalle | null {
  const found = getCuadroDetalleById(cuadroId)
  if (!found) return null
  if (fincaId && found.finca !== fincaId) return null
  return found
}
