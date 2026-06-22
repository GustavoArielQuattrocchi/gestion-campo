/** Validación compartida para payloads de alta de tareas (mobile → Firestore). */

export interface CuadroFields {
  cuadros: string[]
  cuadroIds: string[]
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

function validateCuadros(cuadros: string[], cuadroIds: string[]): string | null {
  const cuadrosErr = nonEmptyStrings(cuadros, 'cuadros')
  if (cuadrosErr) return cuadrosErr
  const idsErr = nonEmptyStrings(cuadroIds, 'cuadroIds')
  if (idsErr) return idsErr
  return null
}

export function validateManualTaskCreate(input: ManualTaskCreateInput): ValidationResult<ManualTaskCreateInput> {
  const cuadrilla = input.cuadrilla?.trim() ?? ''
  const tarea = input.tarea?.trim() ?? ''
  const n = input.cantidadPersonas

  if (!cuadrilla) return { success: false, reason: 'Seleccioná una cuadrilla' }
  if (!tarea) return { success: false, reason: 'Seleccioná una tarea' }
  if (!Number.isFinite(n) || n < 1) {
    return { success: false, reason: 'La cantidad de personas debe ser al menos 1' }
  }

  const cuadrosErr = validateCuadros(input.cuadros, input.cuadroIds)
  if (cuadrosErr) return { success: false, reason: cuadrosErr }

  return {
    success: true,
    data: {
      cuadrilla,
      tarea,
      cantidadPersonas: Math.floor(n),
      cuadros: input.cuadros,
      cuadroIds: input.cuadroIds,
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

  if (!tarea) return { success: false, reason: 'Seleccioná una tarea' }
  if (!persona) return { success: false, reason: 'Ingresá la persona responsable' }
  if (!maquinaria) return { success: false, reason: 'Seleccioná la maquinaria' }

  const cuadrosErr = validateCuadros(input.cuadros, input.cuadroIds)
  if (cuadrosErr) return { success: false, reason: cuadrosErr }

  return {
    success: true,
    data: {
      tarea,
      persona,
      maquinaria,
      ...(maquinariaModelo ? { maquinariaModelo } : {}),
      ...(maquinariaId ? { maquinariaId } : {}),
      cuadros: input.cuadros,
      cuadroIds: input.cuadroIds,
    },
  }
}
