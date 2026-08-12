/** Ventana de histórico en escritorio (tareas/partes cerrados antiguos no se escuchan). */
export const DASHBOARD_LOOKBACK_DAYS = 365

/** Tope de documentos por listener (seguridad). */
export const DASHBOARD_QUERY_LIMIT = 800

export type DashboardQueryFilters = {
  finca: string
  tipo: string
  estado: string
}

export function dashboardLookbackDate(now = new Date()): Date {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - DASHBOARD_LOOKBACK_DAYS)
  return d
}

/** Qué listeners de tareas activar según filtro de estado. */
export function tareasQueryModes(estado: string): {
  enProgreso: boolean
  historico: boolean
} {
  if (estado === 'en_progreso') return { enProgreso: true, historico: false }
  if (estado === 'finalizada') return { enProgreso: false, historico: true }
  return { enProgreso: true, historico: true }
}
