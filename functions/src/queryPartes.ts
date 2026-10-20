import type { Firestore, DocumentData, Timestamp } from 'firebase-admin/firestore'
import { Timestamp as FirestoreTimestamp } from 'firebase-admin/firestore'
import { formatDayKey, lookbackStart } from './dates'
import { canonicalFinca } from './fincas'
import { norm } from './text'
import {
  LOOKBACK_DAYS,
  OPEN_SCAN_LIMIT,
  RESULT_LIMIT,
  SCAN_LIMIT,
  type AsesorRow,
  type ParteEstadoFiltro,
  type ResolvedFilters,
} from './types'

interface ParteDoc {
  id: string
  tareaId: string
  fincaId: string
  fincaNombre: string
  tarea: string
  tipo: string
  estado: string
  operador: string
  responsable: string
  cuadrilla: string
  persona: string
  cuadros: string[]
  cuadroIds: string[]
  abiertoEn: Date | null
  cerradoEn: Date | null
}

export interface QueryPartesResult {
  rows: AsesorRow[]
  truncated: boolean
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (
    value
    && typeof value === 'object'
    && 'toDate' in value
    && typeof (value as { toDate: unknown }).toDate === 'function'
  ) {
    const date = (value as { toDate: () => Date }).toDate()
    if (date instanceof Date && !Number.isNaN(date.getTime())) return date
  }
  return null
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map(item => item.trim())
}

function readString(data: DocumentData, key: string): string {
  const value = data[key]
  return typeof value === 'string' ? value.trim() : ''
}

function parseParte(id: string, data: DocumentData): ParteDoc | null {
  const estado = readString(data, 'estado')
  if (estado !== 'abierto' && estado !== 'cerrado') return null
  return {
    id,
    tareaId: readString(data, 'tareaId'),
    fincaId: readString(data, 'fincaId'),
    fincaNombre: readString(data, 'fincaNombre'),
    tarea: readString(data, 'tarea'),
    tipo: readString(data, 'tipo'),
    estado,
    operador: readString(data, 'operador'),
    responsable: readString(data, 'responsable'),
    cuadrilla: readString(data, 'cuadrilla'),
    persona: readString(data, 'persona'),
    cuadros: asStringList(data.cuadros),
    cuadroIds: asStringList(data.cuadroIds),
    abiertoEn: toDate(data.abiertoEn),
    cerradoEn: toDate(data.cerradoEn),
  }
}

function wholeNumber(value: string, num: string): boolean {
  return new RegExp(`(?:^|[^0-9])${num}(?:[^0-9]|$)`).test(value)
}

function cuartelMatches(parte: ParteDoc, raw: string): boolean {
  const needle = norm(raw)
  if (!needle) return true
  const num = needle.match(/\d+/)?.[0] ?? null
  const finca = canonicalFinca(parte.fincaId) ?? (parte.fincaId ? parte.fincaId.toUpperCase() : null)

  for (const id of parte.cuadroIds) {
    const idNorm = norm(id)
    if (idNorm === needle) return true
    const upper = id.toUpperCase()
    if (num && finca && upper === `${finca}-${num}`) return true
    if (num && wholeNumber(upper, num) && (!finca || upper.startsWith(`${finca}-`))) return true
  }

  for (const name of parte.cuadros) {
    const nameNorm = norm(name)
    if (nameNorm === needle || nameNorm.includes(needle)) return true
    if (num && wholeNumber(nameNorm, num)) return true
  }

  return false
}

function fincaMatches(parte: ParteDoc, filter: string): boolean {
  const wanted = canonicalFinca(filter) ?? norm(filter)
  const id = canonicalFinca(parte.fincaId) ?? norm(parte.fincaId)
  const nombre = canonicalFinca(parte.fincaNombre) ?? norm(parte.fincaNombre)
  return id === wanted || nombre === wanted || norm(parte.fincaId) === norm(filter) || norm(parte.fincaNombre) === norm(filter)
}

function peopleBlob(parte: ParteDoc): string {
  return norm([parte.responsable, parte.persona, parte.cuadrilla, parte.operador].filter(Boolean).join(' '))
}

function responsableLabel(parte: ParteDoc): string {
  if (parte.responsable) return parte.responsable
  if (parte.tipo === 'manual' && parte.cuadrilla) return parte.cuadrilla
  if (parte.persona) return parte.persona
  if (parte.operador) return parte.operador
  return 'Sin responsable'
}

function cuartelLabel(parte: ParteDoc): string {
  if (parte.cuadros.length > 0) return parte.cuadros.join(', ')
  if (parte.cuadroIds.length > 0) return parte.cuadroIds.join(', ')
  return 'Toda la finca'
}

function fechaKey(parte: ParteDoc): string | null {
  if (parte.estado === 'cerrado' && parte.cerradoEn) return formatDayKey(parte.cerradoEn)
  if (parte.abiertoEn) return formatDayKey(parte.abiertoEn)
  return null
}

function matchesFecha(parte: ParteDoc, fecha: string | null, estado: ParteEstadoFiltro | null): boolean {
  if (!fecha) return true
  if (estado === 'cerrado' || (estado == null && parte.estado === 'cerrado')) {
    return parte.estado === 'cerrado' && !!parte.cerradoEn && formatDayKey(parte.cerradoEn) === fecha
  }
  if (estado === 'abierto' || parte.estado === 'abierto') {
    return parte.estado === 'abierto' && !!parte.abiertoEn && formatDayKey(parte.abiertoEn) === fecha
  }
  return false
}

function matches(parte: ParteDoc, filters: ResolvedFilters): boolean {
  if (filters.estado && parte.estado !== filters.estado) return false
  if (!matchesFecha(parte, filters.fecha, filters.estado)) return false
  if (filters.finca && !fincaMatches(parte, filters.finca)) return false
  if (filters.cuartel && !cuartelMatches(parte, filters.cuartel)) return false
  if (filters.tipo_tarea && parte.tipo !== filters.tipo_tarea) return false
  if (filters.responsable && !peopleBlob(parte).includes(norm(filters.responsable))) return false
  return true
}

function toRow(parte: ParteDoc): AsesorRow | null {
  const fecha = fechaKey(parte)
  if (!fecha) return null
  if (parte.estado !== 'abierto' && parte.estado !== 'cerrado') return null
  return {
    finca: parte.fincaNombre || parte.fincaId || 'Sin finca',
    cuartel: cuartelLabel(parte),
    tarea: parte.tarea || 'Labor sin nombre',
    estado: parte.estado,
    responsable: responsableLabel(parte),
    fecha,
  }
}

async function loadTareas(db: Firestore, ids: string[]): Promise<Map<string, DocumentData>> {
  const map = new Map<string, DocumentData>()
  for (let index = 0; index < ids.length; index += 100) {
    const chunk = ids.slice(index, index + 100)
    if (chunk.length === 0) continue
    const refs = chunk.map(id => db.collection('tareas').doc(id))
    const docs = await db.getAll(...refs)
    for (const doc of docs) {
      if (doc.exists) map.set(doc.id, doc.data() ?? {})
    }
  }
  return map
}

function enrichFromTarea(parte: ParteDoc, tarea: DocumentData | undefined): ParteDoc {
  if (!tarea) return parte
  const next = { ...parte }
  if (!next.tarea) next.tarea = readString(tarea, 'tarea')
  if (!next.tipo) next.tipo = readString(tarea, 'tipo')
  if (!next.fincaId) next.fincaId = readString(tarea, 'fincaId')
  if (!next.fincaNombre) next.fincaNombre = readString(tarea, 'fincaNombre')
  if (next.cuadros.length === 0) next.cuadros = asStringList(tarea.cuadros)
  if (next.cuadroIds.length === 0) next.cuadroIds = asStringList(tarea.cuadroIds)
  if (!next.responsable) next.responsable = readString(tarea, 'responsable')
  if (!next.cuadrilla) next.cuadrilla = readString(tarea, 'cuadrilla')
  if (!next.persona) next.persona = readString(tarea, 'persona')
  if (!next.operador) next.operador = readString(tarea, 'operador')
  return next
}

async function collectPartes(db: Firestore, since: Timestamp, sinceDate: Date, includeOpen: boolean): Promise<ParteDoc[]> {
  const byId = new Map<string, ParteDoc>()
  const recent = await db
    .collection('partes_labores')
    .where('abiertoEn', '>=', since)
    .orderBy('abiertoEn', 'desc')
    .limit(SCAN_LIMIT)
    .get()

  for (const doc of recent.docs) {
    const parsed = parseParte(doc.id, doc.data())
    if (parsed) byId.set(doc.id, parsed)
  }

  if (!includeOpen) return [...byId.values()]

  const open = await db.collection('partes_labores').where('estado', '==', 'abierto').limit(OPEN_SCAN_LIMIT).get()
  for (const doc of open.docs) {
    if (byId.has(doc.id)) continue
    const parsed = parseParte(doc.id, doc.data())
    if (!parsed?.abiertoEn) continue
    if (parsed.abiertoEn.getTime() < sinceDate.getTime()) continue
    byId.set(doc.id, parsed)
  }

  return [...byId.values()]
}

/**
 * Lee partes_labores (y la tarea enlazada solo si faltan labor o cuarteles).
 * Los filtros de finca, cuartel, persona y tipo se aplican en memoria para no
 * depender de índices compuestos.
 */
export async function queryPartes(db: Firestore, filters: ResolvedFilters, now = new Date()): Promise<QueryPartesResult> {
  const sinceDate = lookbackStart(now, LOOKBACK_DAYS)
  const since = FirestoreTimestamp.fromDate(sinceDate)
  let partes = await collectPartes(db, since, sinceDate, filters.estado !== 'cerrado')

  const missingIds = [...new Set(
    partes
      .filter(parte => parte.tareaId && (!parte.tarea || (parte.cuadros.length === 0 && parte.cuadroIds.length === 0)))
      .map(parte => parte.tareaId),
  )]
  if (missingIds.length > 0) {
    const tareas = await loadTareas(db, missingIds)
    partes = partes.map(parte => enrichFromTarea(parte, tareas.get(parte.tareaId)))
  }

  const matched = partes
    .filter(parte => matches(parte, filters))
    .map(toRow)
    .filter((row): row is AsesorRow => row != null)
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || a.finca.localeCompare(b.finca, 'es') || a.cuartel.localeCompare(b.cuartel, 'es'))

  return {
    rows: matched.slice(0, RESULT_LIMIT),
    truncated: matched.length > RESULT_LIMIT,
  }
}
