/**
 * Feature: relevamiento de labores desde el mapa del escritorio (catch-up cuando Campo no relevó).
 *
 * Para desactivar o eliminar la feature:
 * 1. Poner MAP_RELEVAMIENTO_ENABLED en false (oculta UI sin borrar código).
 * 2. Para quitar por completo: borrar src/features/mapRelevamiento/ y revertir los
 *    imports marcados con "map-relevamiento" en VineyardMap, DashboardMapLayer y Dashboard.
 * 3. Revertir reglas Firestore marcadas con "relevamiento escritorio".
 */
export const MAP_RELEVAMIENTO_ENABLED = true

/** Operador registrado en tareas creadas desde escritorio (sin parte de labores). */
export const ESCRITORIO_OPERADOR = 'escritorio'

export function isMapRelevamientoEnabled(): boolean {
  return MAP_RELEVAMIENTO_ENABLED
}
