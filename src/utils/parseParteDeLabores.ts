import type { Timestamp } from 'firebase/firestore'
import type { ParteDeLabores, ParteEstado, TareaTipo, WeatherSnapshot } from '../types'
import { isRendimientoUnidad } from './rendimiento'
import { parteSortKey } from './parteEstado'

function isTimestamp(value: unknown): value is Timestamp {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as Timestamp).toDate === 'function'
  )
}

function parseClima(raw: unknown): WeatherSnapshot | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const o = raw as Record<string, unknown>
  const nums = ['temperatureMax', 'temperatureMin', 'precipitation', 'windSpeedMax', 'weatherCode'] as const
  if (!nums.every(k => typeof o[k] === 'number' && Number.isFinite(o[k]))) return undefined
  return {
    temperatureMax: o.temperatureMax as number,
    temperatureMin: o.temperatureMin as number,
    precipitation: o.precipitation as number,
    windSpeedMax: o.windSpeedMax as number,
    weatherCode: o.weatherCode as number,
  }
}

function parseEstado(raw: Record<string, unknown>): ParteEstado | null {
  if (raw.estado === 'abierto' || raw.estado === 'cerrado') return raw.estado
  if (isTimestamp(raw.cerradoEn)) return 'cerrado'
  return null
}

export function parseParteDeLabores(
  id: string,
  raw: Record<string, unknown>,
): ParteDeLabores | null {
  const fincaId = typeof raw.fincaId === 'string' ? raw.fincaId.trim() : ''
  const fincaNombre = typeof raw.fincaNombre === 'string' ? raw.fincaNombre.trim() : ''
  const tareaId = typeof raw.tareaId === 'string' ? raw.tareaId.trim() : ''
  const tarea = typeof raw.tarea === 'string' ? raw.tarea.trim() : ''
  const operador = typeof raw.operador === 'string' ? raw.operador.trim() : ''
  const tipo = raw.tipo as TareaTipo
  const estado = parseEstado(raw)

  if (!fincaId || !fincaNombre || !tareaId || !tarea || !operador || !estado) return null
  if (tipo !== 'manual' && tipo !== 'mecanica') return null

  const rendimiento = typeof raw.rendimiento === 'string' ? raw.rendimiento.trim() : undefined
  const cerradoEn = isTimestamp(raw.cerradoEn) ? raw.cerradoEn : undefined
  const abiertoEn = isTimestamp(raw.abiertoEn)
    ? raw.abiertoEn
    : estado === 'cerrado' && cerradoEn
      ? cerradoEn
      : undefined

  if (!abiertoEn) return null
  if (estado === 'cerrado' && (!cerradoEn || !rendimiento)) return null

  const cuadros = Array.isArray(raw.cuadros)
    ? raw.cuadros.filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
    : []

  const cuadroIds = Array.isArray(raw.cuadroIds)
    ? raw.cuadroIds.filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
    : undefined

  const rendimientoCantidad =
    typeof raw.rendimientoCantidad === 'number' && Number.isFinite(raw.rendimientoCantidad)
      ? raw.rendimientoCantidad
      : undefined
  const rendimientoUnidad = isRendimientoUnidad(raw.rendimientoUnidad)
    ? raw.rendimientoUnidad
    : undefined

  const clima = parseClima(raw.clima)

  const base: ParteDeLabores = {
    id,
    tareaId,
    fincaId,
    fincaNombre,
    tarea,
    tipo,
    operador,
    estado,
    abiertoEn,
    ...(cerradoEn ? { cerradoEn } : {}),
    ...(rendimiento ? { rendimiento } : {}),
    ...(rendimientoCantidad !== undefined ? { rendimientoCantidad } : {}),
    ...(rendimientoUnidad ? { rendimientoUnidad } : {}),
    cuadros,
    ...(cuadroIds?.length ? { cuadroIds } : {}),
    ...(typeof raw.horaInicio === 'string' && raw.horaInicio ? { horaInicio: raw.horaInicio } : {}),
    ...(typeof raw.horaFin === 'string' && raw.horaFin ? { horaFin: raw.horaFin } : {}),
    ...(typeof raw.observaciones === 'string' && raw.observaciones
      ? { observaciones: raw.observaciones }
      : {}),
    ...(clima ? { clima } : {}),
  }

  if (tipo === 'manual') {
    const cuadrilla = typeof raw.cuadrilla === 'string' ? raw.cuadrilla.trim() : ''
    const cantidadPersonas = typeof raw.cantidadPersonas === 'number' ? raw.cantidadPersonas : NaN
    if (!cuadrilla || !Number.isFinite(cantidadPersonas) || cantidadPersonas < 1) return null
    return { ...base, cuadrilla, cantidadPersonas }
  }

  const persona = typeof raw.persona === 'string' ? raw.persona.trim() : ''
  const maquinaria = typeof raw.maquinaria === 'string' ? raw.maquinaria.trim() : ''
  if (!persona || !maquinaria) return null

  return {
    ...base,
    persona,
    maquinaria,
    ...(typeof raw.maquinariaModelo === 'string' && raw.maquinariaModelo.trim()
      ? { maquinariaModelo: raw.maquinariaModelo.trim() }
      : {}),
    ...(typeof raw.maquinariaId === 'string' && raw.maquinariaId.trim()
      ? { maquinariaId: raw.maquinariaId.trim() }
      : {}),
  }
}

export function parsePartesFromSnapshot(
  docs: { id: string; data: () => Record<string, unknown> }[],
): { partes: ParteDeLabores[]; invalid: number } {
  const partes: ParteDeLabores[] = []
  let invalid = 0

  for (const docSnap of docs) {
    const parsed = parseParteDeLabores(docSnap.id, docSnap.data())
    if (parsed) {
      partes.push(parsed)
    } else {
      invalid += 1
    }
  }

  partes.sort((a, b) => parteSortKey(b) - parteSortKey(a))
  return { partes, invalid }
}
