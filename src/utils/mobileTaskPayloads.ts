import type { Timestamp } from 'firebase/firestore'
import type { ManualTaskCreateInput, MechanicalTaskCreateInput } from '../validation/tareaCreate'

export interface ManualTaskFirestorePayload {
  fincaId: string
  fincaNombre: string
  tipo: 'manual'
  tarea: string
  cuadrilla: string
  cantidadPersonas: number
  cuadros: string[]
  cuadroIds: string[]
  estado: 'en_progreso'
  operador: string
  fechaInicio: Timestamp
}

export interface MechanicalTaskFirestorePayload {
  fincaId: string
  fincaNombre: string
  tipo: 'mecanica'
  tarea: string
  persona: string
  maquinaria: string
  cuadros: string[]
  cuadroIds: string[]
  estado: 'en_progreso'
  operador: string
  fechaInicio: Timestamp
}

export function hasMobileSession(
  operadorNombre: string,
  fincaId: string,
  fincaNombre: string,
): boolean {
  return Boolean(operadorNombre.trim() && fincaId.trim() && fincaNombre.trim())
}

export function buildManualTaskFirestorePayload(
  validated: ManualTaskCreateInput,
  ctx: { fincaId: string; fincaNombre: string; operadorNombre: string; fechaInicio: Timestamp },
): ManualTaskFirestorePayload {
  return {
    fincaId: ctx.fincaId,
    fincaNombre: ctx.fincaNombre,
    tipo: 'manual',
    tarea: validated.tarea,
    cuadrilla: validated.cuadrilla,
    cantidadPersonas: validated.cantidadPersonas,
    cuadros: validated.cuadros,
    cuadroIds: validated.cuadroIds,
    estado: 'en_progreso',
    operador: ctx.operadorNombre,
    fechaInicio: ctx.fechaInicio,
  }
}

export function buildMechanicalTaskFirestorePayload(
  validated: MechanicalTaskCreateInput,
  ctx: { fincaId: string; fincaNombre: string; operadorNombre: string; fechaInicio: Timestamp },
): MechanicalTaskFirestorePayload {
  return {
    fincaId: ctx.fincaId,
    fincaNombre: ctx.fincaNombre,
    tipo: 'mecanica',
    tarea: validated.tarea,
    persona: validated.persona,
    maquinaria: validated.maquinaria,
    cuadros: validated.cuadros,
    cuadroIds: validated.cuadroIds,
    estado: 'en_progreso',
    operador: ctx.operadorNombre,
    fechaInicio: ctx.fechaInicio,
  }
}
