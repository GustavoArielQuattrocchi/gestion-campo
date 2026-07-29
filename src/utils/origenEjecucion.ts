/** Origen del servicio / cuadrilla en el parte de labores. */
export type OrigenEjecucion = 'propia' | 'externa'

export function isOrigenEjecucion(value: unknown): value is OrigenEjecucion {
  return value === 'propia' || value === 'externa'
}

export function origenFromCuadrilla(cuadrilla: string): OrigenEjecucion {
  return cuadrilla.trim().toLowerCase().includes('extern') ? 'externa' : 'propia'
}

/** Label del campo según origen. */
export function labelResponsableCampo(origen: OrigenEjecucion): string {
  return origen === 'externa' ? 'Empresa' : 'Responsable'
}

export function normalizeResponsable(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}
