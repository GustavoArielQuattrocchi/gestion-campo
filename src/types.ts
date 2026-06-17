import type { Timestamp } from 'firebase/firestore'

export interface Finca {
  id: string
  nombre: string
}

export interface Cuadro {
  id: string
  nombre: string
  variedad: string
  vinedo: string
  hectareas: number
}

export interface Cuadrilla {
  id: string
  nombre: string
}

export interface Maquinaria {
  id: string
  nombre: string
}

/** Ítem de catálogo (tareas manuales/mecánicas con descripción opcional). */
export interface CatalogItem {
  id: string
  nombre: string
  descripcion?: string
}

export type TareaEstado = 'en_progreso' | 'finalizada'
export type TareaTipo = 'manual' | 'mecanica'

export interface CuadroSelection {
  cuadros: string[]
  cuadroIds: string[]
}

export const emptyCuadroSelection = (): CuadroSelection => ({ cuadros: [], cuadroIds: [] })

interface TareaBase {
  id: string
  fincaId: string
  fincaNombre: string
  tarea: string
  cuadros: string[]
  /** IDs de cuadro del catálogo (ej. FOA-5). Opcional en documentos legacy. */
  cuadroIds?: string[]
  estado: TareaEstado
  operador: string
  fechaInicio: Timestamp
  fechaFin?: Timestamp
  rendimiento?: string
}

export interface TareaManual extends TareaBase {
  tipo: 'manual'
  cuadrilla: string
  cantidadPersonas: number
}

export interface TareaMecanica extends TareaBase {
  tipo: 'mecanica'
  persona: string
  maquinaria: string
}

export type Tarea = TareaManual | TareaMecanica
