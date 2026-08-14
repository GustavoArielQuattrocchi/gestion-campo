import { tareasManuales, tareasMecanicas } from '../data/catalog'
import { ACCIDENTE_OTROS_ID, NATURALEZAS_LESION, PARTES_CUERPO } from '../data/accidenteChecklist'
import type { ValidationResult } from './tareaCreate'

export type AccidenteTipoTarea = 'manual' | 'mecanica'

const TAREAS_POR_TIPO: Record<AccidenteTipoTarea, Set<string>> = {
  manual: new Set(tareasManuales.map(t => t.nombre)),
  mecanica: new Set(tareasMecanicas.map(t => t.nombre)),
}

const PARTE_IDS = new Set(PARTES_CUERPO.map(i => i.id))
const NATURALEZA_IDS = new Set(NATURALEZAS_LESION.map(i => i.id))

export interface AccidentReportInput {
  operador: string
  fincaId: string
  fincaNombre: string
  descripcion: string
  tieneFoto: boolean
  afectadoNombre: string
  afectadoDni: string
  partesCuerpo: string[]
  parteCuerpoOtro: string
  naturalezasLesion: string[]
  naturalezaLesionOtro: string
  tipo: AccidenteTipoTarea | ''
  tarea: string
}

export type ValidatedAccidentReport = Omit<AccidentReportInput, 'tipo'> & {
  tipo: AccidenteTipoTarea
}

export function normalizeDni(raw: string): string {
  return (raw ?? '').replace(/\D/g, '')
}

export function isValidDni(raw: string): boolean {
  return /^\d{7,8}$/.test(normalizeDni(raw))
}

function uniqueKnownIds(ids: unknown, allowed: Set<string>): string[] | null {
  if (!Array.isArray(ids)) return null
  const cleaned = [...new Set(ids.filter((id): id is string => typeof id === 'string' && allowed.has(id)))]
  return cleaned
}

function requireOtrosTexto(ids: string[], texto: string, campo: string): string | null {
  if (!ids.includes(ACCIDENTE_OTROS_ID)) return null
  if (!texto.trim()) return `Completá el detalle de Otros en ${campo}`
  return null
}

export function validateAccidentReport(input: AccidentReportInput): ValidationResult<ValidatedAccidentReport> {
  const operador = input.operador?.trim() ?? ''
  const fincaId = input.fincaId?.trim() ?? ''
  const fincaNombre = input.fincaNombre?.trim() ?? ''
  const descripcion = input.descripcion?.trim() ?? ''
  const afectadoNombre = input.afectadoNombre?.trim() ?? ''
  const afectadoDni = normalizeDni(input.afectadoDni)
  const parteCuerpoOtro = input.parteCuerpoOtro?.trim() ?? ''
  const naturalezaLesionOtro = input.naturalezaLesionOtro?.trim() ?? ''

  if (!operador) return { success: false, reason: 'Falta el nombre del operador' }
  if (!fincaId || !fincaNombre) return { success: false, reason: 'Seleccioná la finca donde ocurrió el hecho' }
  if (!afectadoNombre) return { success: false, reason: 'Ingresá el nombre del operario afectado' }
  if (!isValidDni(afectadoDni)) return { success: false, reason: 'Ingresá un DNI válido (7 u 8 dígitos)' }

  const tipo = input.tipo === 'manual' || input.tipo === 'mecanica' ? input.tipo : null
  const tarea = input.tarea?.trim() ?? ''
  if (!tipo) return { success: false, reason: 'Seleccioná si la labor era manual o mecánica' }
  if (!tarea || !TAREAS_POR_TIPO[tipo].has(tarea)) {
    return { success: false, reason: 'Seleccioná la tarea del catálogo' }
  }

  const partesCuerpo = uniqueKnownIds(input.partesCuerpo, PARTE_IDS)
  if (!partesCuerpo || partesCuerpo.length === 0) {
    return { success: false, reason: 'Seleccioná al menos una parte del cuerpo lesionada' }
  }
  const partesOtrosErr = requireOtrosTexto(partesCuerpo, parteCuerpoOtro, 'parte del cuerpo')
  if (partesOtrosErr) return { success: false, reason: partesOtrosErr }

  const naturalezasLesion = uniqueKnownIds(input.naturalezasLesion, NATURALEZA_IDS)
  if (!naturalezasLesion || naturalezasLesion.length === 0) {
    return { success: false, reason: 'Seleccioná al menos una naturaleza de la lesión' }
  }
  const natOtrosErr = requireOtrosTexto(naturalezasLesion, naturalezaLesionOtro, 'naturaleza de la lesión')
  if (natOtrosErr) return { success: false, reason: natOtrosErr }

  if (!descripcion) return { success: false, reason: 'Ingresá una descripción del accidente' }

  return {
    success: true,
    data: {
      operador,
      fincaId,
      fincaNombre,
      descripcion,
      tieneFoto: Boolean(input.tieneFoto),
      afectadoNombre,
      afectadoDni,
      partesCuerpo,
      parteCuerpoOtro: partesCuerpo.includes(ACCIDENTE_OTROS_ID) ? parteCuerpoOtro : '',
      naturalezasLesion,
      naturalezaLesionOtro: naturalezasLesion.includes(ACCIDENTE_OTROS_ID) ? naturalezaLesionOtro : '',
      tipo,
      tarea,
    },
  }
}
