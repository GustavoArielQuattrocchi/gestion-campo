import type { FeatureCollection, Feature, Polygon } from 'geojson'
import mapaVinedos from './mapa_vinedos.json'
import { getCuadrosPorFinca } from './fincaData'

export interface CuadroFeatureProps {
  name: string
  description?: string
  fill?: string
  stroke?: string
  'fill-opacity'?: number
  'stroke-opacity'?: number
  [key: string]: unknown
}

export type CuadroFeature = Feature<Polygon, CuadroFeatureProps>

const collection = mapaVinedos as unknown as FeatureCollection<Polygon, CuadroFeatureProps>

export const mapaCollection: FeatureCollection<Polygon, CuadroFeatureProps> = collection

export interface FincaBounds {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

const FINCA_PREFIXES = ['FOA', 'FLP', 'FSP', 'FET', 'FC2', 'FC3']

export function getFincaPrefix(featureName: string): string | null {
  for (const prefix of FINCA_PREFIXES) {
    if (featureName.startsWith(`${prefix}-`)) return prefix
  }
  return null
}

/** Quita colores KML del feature para que Leaflet no los use al hacer hover. */
function withoutKmlStyle(feature: CuadroFeature): CuadroFeature {
  const { name, description } = feature.properties
  return {
    ...feature,
    properties: { name, description },
  }
}

export function getFeaturesByFinca(fincaNombre: string): CuadroFeature[] {
  return collection.features
    .filter((f) => getFincaPrefix(f.properties.name) === fincaNombre)
    .map(withoutKmlStyle)
}

export function getAllVineyardFeatures(): CuadroFeature[] {
  return collection.features
    .filter((f) => getFincaPrefix(f.properties.name) !== null)
    .map(withoutKmlStyle)
}

export function getFincaBounds(fincaNombre: string): FincaBounds | null {
  const features = getFeaturesByFinca(fincaNombre)
  if (features.length === 0) return null
  return computeBoundsFromFeatures(features)
}

export function getGlobalBounds(): FincaBounds {
  return computeBoundsFromFeatures(getAllVineyardFeatures())
}

function computeBoundsFromFeatures(features: CuadroFeature[]): FincaBounds {
  let minLat = Infinity
  let maxLat = -Infinity
  let minLng = Infinity
  let maxLng = -Infinity
  for (const f of features) {
    for (const ring of f.geometry.coordinates) {
      for (const [lng, lat] of ring) {
        if (lat < minLat) minLat = lat
        if (lat > maxLat) maxLat = lat
        if (lng < minLng) minLng = lng
        if (lng > maxLng) maxLng = lng
      }
    }
  }
  return { minLat, maxLat, minLng, maxLng }
}

export function parseDescripcion(description?: string): Record<string, string> {
  if (!description) return {}
  const result: Record<string, string> = {}
  const lines = description.split('\n').map((l) => l.trim()).filter(Boolean)
  for (const line of lines) {
    const idx = line.indexOf(':')
    if (idx <= 0) continue
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    if (key && value) result[key] = value
  }
  return result
}

/**
 * En las tareas guardamos los cuadros por su `nombre` (ej "Cuartel 5"),
 * pero los features del GeoJSON usan el `id` (ej "FOA-5"). Este helper
 * arma el mapeo nombre -> id para una finca dada.
 */
export function buildNombreToIdMap(fincaNombre: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const c of getCuadrosPorFinca(fincaNombre)) {
    map.set(c.nombre, c.id)
  }
  return map
}
