/** Validación compartida para payloads de alta de tareas (mobile → Firestore). */

import type { TareaAlcance } from '../types'
import { ALCANCE_FINCA, esTareaTodaLaFinca } from '../utils/tareaAlcance'

export interface CuadroFields {
  cuadros: string[]
  cuadroIds: string[]
  alcance?: TareaAlcance
}

export interface ManualTaskCreateInput extends CuadroFields {
  cuadrilla: string
  tarea: string
  cantidadPersonas: number
}

export interface MechanicalTaskCreateInput extends CuadroFields {
  tarea: string
  persona: string
  maquinaria: string
  maquinariaModelo?: string
  maquinariaId?: string
  ordenCuraRef?: string
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; reason: string }

function nonEmptyStrings(values: string[], field: string): string | null {
  if (!Array.isArray(values) || values.length === 0) {
    return `${field}: seleccioná al menos un cuadro`
  }
  if (!values.every(v => typeof v === 'string' && v.trim().length > 0)) {
    return `${field}: valores inválidos`
  }
  return null
}

function validateCuadros(cuadros: string[], cuadroIds: string[], alcance?: TareaAlcance): string | null {
  if (esTareaTodaLaFinca({ alcance })) return null
  const cuadrosErr = nonEmptyStrings(cuadros, 'cuadros')
  if (cuadrosErr) return cuadrosErr
  const idsErr = nonEmptyStrings(cuadroIds, 'cuadroIds')
  if (idsErr) return idsErr
  return null
}

function normalizeAlcance(alcance?: TareaAlcance): TareaAlcance | undefined {
  return alcance === ALCANCE_FINCA ? ALCANCE_FINCA : undefined
}

function normalizeCuadros(input: CuadroFields): CuadroFields {
  if (esTareaTodaLaFinca(input)) {
    return { cuadros: [], cuadroIds: [], alcance: ALCANCE_FINCA }
  }
  return { cuadros: input.cuadros, cuadroIds: input.cuadroIds }
}

export function validateManualTaskCreate(input: ManualTaskCreateInput): ValidationResult<ManualTaskCreateInput> {
  const cuadrilla = input.cuadrilla?.trim() ?? ''
  const tarea = input.tarea?.trim() ?? ''
  const n = input.cantidadPersonas
  const alcance = normalizeAlcance(input.alcance)

  if (!cuadrilla) return { success: false, reason: 'Seleccioná una cuadrilla' }
  if (!tarea) return { success: false, reason: 'Seleccioná una tarea' }
  if (!Number.isFinite(n) || n < 1) {
    return { success: false, reason: 'La cantidad de personas debe ser al menos 1' }
  }

  const cuadrosErr = validateCuadros(input.cuadros, input.cuadroIds, alcance)
  if (cuadrosErr) return { success: false, reason: cuadrosErr }

  return {
    success: true,
    data: {
      cuadrilla,
      tarea,
      cantidadPersonas: Math.floor(n),
      ...normalizeCuadros({ ...input, alcance }),
    },
  }
}

export function validateMechanicalTaskCreate(
  input: MechanicalTaskCreateInput,
): ValidationResult<MechanicalTaskCreateInput> {
  const tarea = input.tarea?.trim() ?? ''
  const persona = input.persona?.trim() ?? ''
  const maquinaria = input.maquinaria?.trim() ?? ''
  const maquinariaModelo = input.maquinariaModelo?.trim() ?? ''
  const maquinariaId = input.maquinariaId?.trim() ?? ''
  const ordenCuraRef = input.ordenCuraRef?.trim() ?? ''
  const alcance = normalizeAlcance(input.alcance)

  if (!tarea) return { success: false, reason: 'Seleccioná una tarea' }
  if (!persona) return { success: false, reason: 'Ingresá la persona responsable' }
  if (!maquinaria) return { success: false, reason: 'Seleccioná la maquinaria' }

  const cuadrosErr = validateCuadros(input.cuadros, input.cuadroIds, alcance)
  if (cuadrosErr) return { success: false, reason: cuadrosErr }

  return {
    success: true,
    data: {
      tarea,
      persona,
      maquinaria,
      ...(maquinariaModelo ? { maquinariaModelo } : {}),
      ...(maquinariaId ? { maquinariaId } : {}),
      ...(ordenCuraRef ? { ordenCuraRef } : {}),
      ...normalizeCuadros({ ...input, alcance }),
    },
  }
}
