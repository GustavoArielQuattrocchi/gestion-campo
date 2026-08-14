import type { Timestamp } from 'firebase/firestore'
import type { AccidenteTipoTarea } from '../validation/accidentReport'

export interface InformeAccidente {
  id: string
  operador: string
  fincaId: string
  fincaNombre: string
  descripcion: string
  tieneFoto: boolean
  creadoEn: Timestamp
  afectadoNombre?: string
  afectadoDni?: string
  partesCuerpo?: string[]
  parteCuerpoOtro?: string
  naturalezasLesion?: string[]
  naturalezaLesionOtro?: string
  tipo?: AccidenteTipoTarea
  tarea?: string
}

export type InformeAccidenteCompleto = InformeAccidente & {
  afectadoNombre: string
  afectadoDni: string
  partesCuerpo: string[]
  parteCuerpoOtro: string
  naturalezasLesion: string[]
  naturalezaLesionOtro: string
  tipo: AccidenteTipoTarea
  tarea: string
}

function asStringList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  const items = value.filter((v): v is string => typeof v === 'string')
  return items.length === value.length ? items : null
}

export function isInformeCompleto(informe: InformeAccidente): informe is InformeAccidenteCompleto {
  return (
    typeof informe.afectadoNombre === 'string' &&
    informe.afectadoNombre.trim().length > 0 &&
    typeof informe.afectadoDni === 'string' &&
    informe.afectadoDni.trim().length > 0 &&
    Array.isArray(informe.partesCuerpo) &&
    informe.partesCuerpo.length > 0 &&
    typeof informe.parteCuerpoOtro === 'string' &&
    Array.isArray(informe.naturalezasLesion) &&
    informe.naturalezasLesion.length > 0 &&
    typeof informe.naturalezaLesionOtro === 'string' &&
    (informe.tipo === 'manual' || informe.tipo === 'mecanica') &&
    typeof informe.tarea === 'string' &&
    informe.tarea.trim().length > 0
  )
}

export function parseInformeAccidente(id: string, raw: Record<string, unknown>): InformeAccidente | null {
  if (
    typeof raw.operador !== 'string' ||
    typeof raw.fincaId !== 'string' ||
    typeof raw.fincaNombre !== 'string' ||
    typeof raw.descripcion !== 'string' ||
    typeof raw.tieneFoto !== 'boolean' ||
    !raw.creadoEn
  ) {
    return null
  }

  const base: InformeAccidente = {
    id,
    operador: raw.operador,
    fincaId: raw.fincaId,
    fincaNombre: raw.fincaNombre,
    descripcion: raw.descripcion,
    tieneFoto: raw.tieneFoto,
    creadoEn: raw.creadoEn as Timestamp,
  }

  if (typeof raw.afectadoNombre === 'string') base.afectadoNombre = raw.afectadoNombre
  if (typeof raw.afectadoDni === 'string') base.afectadoDni = raw.afectadoDni
  const partes = asStringList(raw.partesCuerpo)
  if (partes) base.partesCuerpo = partes
  if (typeof raw.parteCuerpoOtro === 'string') base.parteCuerpoOtro = raw.parteCuerpoOtro
  const naturalezas = asStringList(raw.naturalezasLesion)
  if (naturalezas) base.naturalezasLesion = naturalezas
  if (typeof raw.naturalezaLesionOtro === 'string') base.naturalezaLesionOtro = raw.naturalezaLesionOtro
  if (raw.tipo === 'manual' || raw.tipo === 'mecanica') base.tipo = raw.tipo
  if (typeof raw.tarea === 'string') base.tarea = raw.tarea

  return base
}
