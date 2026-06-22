import type { Timestamp } from 'firebase/firestore'
import type { Tarea, TareaEstado, TareaTipo } from '../types'

export interface ParseInvalidEntry {
  id: string
  reason: string
}

export interface ParseTareasResult {
  tareas: Tarea[]
  invalid: ParseInvalidEntry[]
}

function isEstado(v: unknown): v is TareaEstado {
  return v === 'en_progreso' || v === 'finalizada'
}

function isTipo(v: unknown): v is TareaTipo {
  return v === 'manual' || v === 'mecanica'
}

function parseTimestamp(value: unknown): Timestamp | undefined {
  if (!value || typeof value !== 'object' || !('toDate' in value)) return undefined
  try {
    const ts = value as Timestamp
    ts.toDate()
    return ts
  } catch {
    return undefined
  }
}

function parseCantidadPersonas(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n < 1) return null
  return Math.floor(n)
}

export type ParseTareaResult =
  | { success: true; tarea: Tarea }
  | { success: false; reason: string }

/** Valida y normaliza un documento Firestore antes de usarlo en la UI. */
export function parseTarea(id: string, raw: Record<string, unknown>): ParseTareaResult {
  const fincaId = typeof raw.fincaId === 'string' ? raw.fincaId.trim() : ''
  const fincaNombre = typeof raw.fincaNombre === 'string' ? raw.fincaNombre.trim() : ''
  const tareaNombre = typeof raw.tarea === 'string' ? raw.tarea.trim() : ''
  const operador = typeof raw.operador === 'string' ? raw.operador : ''
  const estado = raw.estado
  const tipo = raw.tipo

  if (!fincaId) return { success: false, reason: 'falta fincaId' }
  if (!fincaNombre) return { success: false, reason: 'falta fincaNombre' }
  if (!tareaNombre) return { success: false, reason: 'falta nombre de tarea' }
  if (!isEstado(estado)) return { success: false, reason: 'estado inválido' }
  if (!isTipo(tipo)) return { success: false, reason: 'tipo inválido' }

  const fechaInicio = parseTimestamp(raw.fechaInicio)
  if (!fechaInicio) return { success: false, reason: 'fechaInicio inválida' }

  const fechaFin = parseTimestamp(raw.fechaFin)

  const cuadros = Array.isArray(raw.cuadros)
    ? raw.cuadros.filter((c): c is string => typeof c === 'string')
    : []

  const cuadroIds = Array.isArray(raw.cuadroIds)
    ? raw.cuadroIds.filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
    : []

  const base = {
    id,
    fincaId,
    fincaNombre,
    tarea: tareaNombre,
    cuadros,
    ...(cuadroIds.length > 0 ? { cuadroIds } : {}),
    estado,
    operador,
    fechaInicio,
    ...(fechaFin ? { fechaFin } : {}),
    rendimiento: typeof raw.rendimiento === 'string' ? raw.rendimiento : undefined,
  }

  if (tipo === 'manual') {
    const cuadrilla = typeof raw.cuadrilla === 'string' ? raw.cuadrilla.trim() : ''
    if (!cuadrilla) return { success: false, reason: 'falta cuadrilla (manual)' }

    const cantidadPersonas = parseCantidadPersonas(raw.cantidadPersonas)
    if (cantidadPersonas === null) {
      return { success: false, reason: 'cantidadPersonas inválida (debe ser ≥ 1)' }
    }

    return { success: true, tarea: { ...base, tipo: 'manual', cuadrilla, cantidadPersonas } }
  }

  const persona = typeof raw.persona === 'string' ? raw.persona.trim() : ''
  const maquinaria = typeof raw.maquinaria === 'string' ? raw.maquinaria.trim() : ''
  if (!persona) return { success: false, reason: 'falta persona (mecánica)' }
  if (!maquinaria) return { success: false, reason: 'falta maquinaria (mecánica)' }

  const maquinariaModelo =
    typeof raw.maquinariaModelo === 'string' && raw.maquinariaModelo.trim()
      ? raw.maquinariaModelo.trim()
      : undefined
  const maquinariaId =
    typeof raw.maquinariaId === 'string' && raw.maquinariaId.trim()
      ? raw.maquinariaId.trim()
      : undefined

  return {
    success: true,
    tarea: {
      ...base,
      tipo: 'mecanica',
      persona,
      maquinaria,
      ...(maquinariaModelo ? { maquinariaModelo } : {}),
      ...(maquinariaId ? { maquinariaId } : {}),
    },
  }
}

function logInvalidInDev(invalid: ParseInvalidEntry[]) {
  if (invalid.length === 0 || !import.meta.env?.DEV) return
  for (const entry of invalid) {
    console.warn(`[parseTarea] Documento ignorado (${entry.id}): ${entry.reason}`)
  }
}

export function parseTareasFromSnapshot(
  docs: { id: string; data: () => Record<string, unknown> }[],
): ParseTareasResult {
  const tareas: Tarea[] = []
  const invalid: ParseInvalidEntry[] = []

  for (const d of docs) {
    const result = parseTarea(d.id, d.data())
    if (result.success) {
      tareas.push(result.tarea)
    } else {
      invalid.push({ id: d.id, reason: result.reason })
    }
  }

  logInvalidInDev(invalid)
  return { tareas, invalid }
}
