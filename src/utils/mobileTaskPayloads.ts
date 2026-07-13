import type { Timestamp } from 'firebase/firestore'
import type { ManualTaskCreateInput, MechanicalTaskCreateInput } from '../validation/tareaCreate'
import { buildEjecutorPorCuadroPatch } from './tareaEjecutor'

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
  ejecutorPorCuadro?: Record<string, string>
}

export interface MechanicalTaskFirestorePayload {
  fincaId: string
  fincaNombre: string
  tipo: 'mecanica'
  tarea: string
  persona: string
  maquinaria: string
  maquinariaModelo?: string
  maquinariaId?: string
  ordenCuraRef?: string
  cuadros: string[]
  cuadroIds: string[]
  estado: 'en_progreso'
  operador: string
  fechaInicio: Timestamp
  ejecutorPorCuadro?: Record<string, string>
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
  const ejecutorPorCuadro = buildEjecutorPorCuadroPatch(validated.cuadroIds, validated.cuadrilla)
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
    operador: ctx.operadorNombre.trim(),
    fechaInicio: ctx.fechaInicio,
    ejecutorPorCuadro,
  }
}

export function buildMechanicalTaskFirestorePayload(
  validated: MechanicalTaskCreateInput,
  ctx: { fincaId: string; fincaNombre: string; operadorNombre: string; fechaInicio: Timestamp },
): MechanicalTaskFirestorePayload {
  const modelo = validated.maquinariaModelo?.trim()
  const ejecutorLabel = modelo
    ? `${validated.persona} · ${validated.maquinaria} (${modelo})`
    : `${validated.persona} · ${validated.maquinaria}`
  const ejecutorPorCuadro = buildEjecutorPorCuadroPatch(validated.cuadroIds, ejecutorLabel)
  return {
    fincaId: ctx.fincaId,
    fincaNombre: ctx.fincaNombre,
    tipo: 'mecanica',
    tarea: validated.tarea,
    persona: validated.persona,
    maquinaria: validated.maquinaria,
    ...(validated.maquinariaModelo ? { maquinariaModelo: validated.maquinariaModelo } : {}),
    ...(validated.maquinariaId ? { maquinariaId: validated.maquinariaId } : {}),
    ...(validated.ordenCuraRef ? { ordenCuraRef: validated.ordenCuraRef } : {}),
    cuadros: validated.cuadros,
    cuadroIds: validated.cuadroIds,
    estado: 'en_progreso',
    operador: ctx.operadorNombre.trim(),
    fechaInicio: ctx.fechaInicio,
    ejecutorPorCuadro,
  }
}
