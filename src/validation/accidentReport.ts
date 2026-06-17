import type { ValidationResult } from './tareaCreate'

export interface AccidentReportInput {
  operador: string
  fincaId: string
  fincaNombre: string
  descripcion: string
  tieneFoto: boolean
}

export function validateAccidentReport(input: AccidentReportInput): ValidationResult<AccidentReportInput> {
  const operador = input.operador?.trim() ?? ''
  const fincaId = input.fincaId?.trim() ?? ''
  const fincaNombre = input.fincaNombre?.trim() ?? ''
  const descripcion = input.descripcion?.trim() ?? ''

  if (!operador) return { success: false, reason: 'Falta el nombre del operador' }
  if (!fincaId || !fincaNombre) return { success: false, reason: 'Seleccioná la finca donde ocurrió el hecho' }
  if (!descripcion) return { success: false, reason: 'Ingresá una descripción del hecho o condición insegura' }

  return {
    success: true,
    data: { operador, fincaId, fincaNombre, descripcion, tieneFoto: input.tieneFoto },
  }
}
