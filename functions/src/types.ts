export const EMPTY_ANSWER = 'No encuentro tareas que coincidan con esa consulta.'

export const RESULT_LIMIT = 40
export const LOOKBACK_DAYS = 60
export const SCAN_LIMIT = 800
export const OPEN_SCAN_LIMIT = 300

export type ParteEstadoFiltro = 'abierto' | 'cerrado'
export type TipoTareaFiltro = 'manual' | 'mecanica'

/** Filtros que devolvió el modelo, ya validados (fecha todavía simbólica). */
export interface RawFilters {
  fecha: 'hoy' | 'ayer' | string | null
  finca: string | null
  cuartel: string | null
  estado: ParteEstadoFiltro | null
  responsable: string | null
  tipo_tarea: TipoTareaFiltro | null
}

/** Filtros con la fecha resuelta a YYYY-MM-DD en America/Argentina/Buenos_Aires, o null. */
export interface ResolvedFilters {
  fecha: string | null
  finca: string | null
  cuartel: string | null
  estado: ParteEstadoFiltro | null
  responsable: string | null
  tipo_tarea: TipoTareaFiltro | null
}

export interface AsesorRow {
  finca: string
  cuartel: string
  tarea: string
  estado: ParteEstadoFiltro
  responsable: string
  fecha: string
}

export interface ConversationTurn {
  role: 'user' | 'assistant'
  content: string
}

export const EMPTY_FILTERS: ResolvedFilters = {
  fecha: null,
  finca: null,
  cuartel: null,
  estado: null,
  responsable: null,
  tipo_tarea: null,
}
