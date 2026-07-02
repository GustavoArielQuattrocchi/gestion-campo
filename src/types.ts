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

/** Unidades de medida disponibles para el rendimiento de una labor. */
export type RendimientoUnidad = 'jornal' | 'hileras' | 'claros' | 'plantas'

export const RENDIMIENTO_UNIDADES: RendimientoUnidad[] = [
  'jornal',
  'hileras',
  'claros',
  'plantas',
]

/** Registro diario de rendimiento desde la app campo (la tarea sigue en progreso). */
export interface RendimientoDiario {
  fecha: Timestamp
  texto: string
  operador: string
  /** Valor numérico del rendimiento (documentos nuevos). */
  cantidad?: number
  /** Unidad de medida asociada (documentos nuevos). */
  unidad?: RendimientoUnidad
  /** Id del parte de labores vinculado a este registro. */
  parteId?: string
}

interface TareaBase {
  id: string
  fincaId: string
  fincaNombre: string
  tarea: string
  cuadros: string[]
  /** IDs de cuadro del catálogo (ej. FOA-5). Opcional en documentos legacy. */
  cuadroIds?: string[]
  /** Cuadros marcados como finalizados desde el dashboard. */
  cuadroIdsFinalizados?: string[]
  estado: TareaEstado
  operador: string
  fechaInicio: Timestamp
  fechaFin?: Timestamp
  /** Último rendimiento registrado (texto libre). */
  rendimiento?: string
  /** Historial de cierres diarios desde campo. */
  rendimientosDiarios?: RendimientoDiario[]
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
  /** Modelo del tractor (ej. NEW HOLLAND TT-65-D). Opcional en documentos legacy. */
  maquinariaModelo?: string
  maquinariaId?: string
}

export type Tarea = TareaManual | TareaMecanica

/** Parte de labores cerrado desde campo al registrar el cierre del día. */
export interface ParteDeLabores {
  id: string
  tareaId: string
  fincaId: string
  fincaNombre: string
  tarea: string
  tipo: TareaTipo
  operador: string
  rendimiento: string
  /** Valor numérico del rendimiento (documentos nuevos). */
  rendimientoCantidad?: number
  /** Unidad de medida del rendimiento (documentos nuevos). */
  rendimientoUnidad?: RendimientoUnidad
  /** true si este parte finalizó la tarea (cierre definitivo desde campo). */
  finalizoTarea?: boolean
  cuadros: string[]
  cuadroIds?: string[]
  cuadrilla?: string
  cantidadPersonas?: number
  persona?: string
  maquinaria?: string
  maquinariaModelo?: string
  maquinariaId?: string
  cerradoEn: Timestamp
}
