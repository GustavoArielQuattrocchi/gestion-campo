import {
  NATURALEZAS_LESION,
  PARTES_CUERPO,
  formatChecklistLabels,
  type AccidenteChecklistItem,
} from '../data/accidenteChecklist'
import type { AccidenteTipoTarea } from '../validation/accidentReport'
import type { InformeAccidente, InformeAccidenteCompleto } from './parseInformeAccidente'
import { isInformeCompleto } from './parseInformeAccidente'

export { isInformeCompleto }
export type { InformeAccidenteCompleto }

export type AccidentChartPoint = { label: string; value: number }

export interface AfectadoRank {
  dni: string
  nombre: string
  count: number
  isTop: boolean
}

export function yearMonthKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function formatYearMonthLabel(key: string): string {
  const [y, m] = key.split('-')
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const idx = Number(m) - 1
  if (!y || idx < 0 || idx > 11) return key
  return `${months[idx]} ${y}`
}

export function listYearMonths(informes: InformeAccidente[]): string[] {
  const set = new Set(informes.map(i => yearMonthKey(i.creadoEn.toDate())))
  set.add(yearMonthKey(new Date()))
  return [...set].sort().reverse()
}

export function filterInformesCompletos(
  informes: InformeAccidente[],
  finca: string,
  yearMonth: string,
): InformeAccidenteCompleto[] {
  return informes.filter(isInformeCompleto).filter(i => {
    if (finca !== 'todas' && i.fincaNombre !== finca) return false
    return yearMonthKey(i.creadoEn.toDate()) === yearMonth
  })
}

function countMapToPoints(counts: Map<string, number>): AccidentChartPoint[] {
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'es'))
}

export function countAccidentesPorFinca(informes: InformeAccidenteCompleto[]): AccidentChartPoint[] {
  const counts = new Map<string, number>()
  for (const i of informes) {
    counts.set(i.fincaNombre, (counts.get(i.fincaNombre) ?? 0) + 1)
  }
  return countMapToPoints(counts)
}

export function laborAccidenteLabel(tipo: AccidenteTipoTarea, tarea: string): string {
  const tipoLabel = tipo === 'mecanica' ? 'Mecánica' : 'Manual'
  return `${tarea} (${tipoLabel})`
}

export function countAccidentesPorLabor(informes: InformeAccidenteCompleto[]): AccidentChartPoint[] {
  const counts = new Map<string, number>()
  for (const i of informes) {
    const label = laborAccidenteLabel(i.tipo, i.tarea)
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  return countMapToPoints(counts)
}

function countChecklist(
  informes: InformeAccidenteCompleto[],
  idsOf: (i: InformeAccidenteCompleto) => string[],
  otroOf: (i: InformeAccidenteCompleto) => string,
  catalog: AccidenteChecklistItem[],
): AccidentChartPoint[] {
  const counts = new Map<string, number>()
  for (const i of informes) {
    for (const label of formatChecklistLabels(idsOf(i), catalog, otroOf(i))) {
      counts.set(label, (counts.get(label) ?? 0) + 1)
    }
  }
  return countMapToPoints(counts)
}

export function countPartesCuerpo(informes: InformeAccidenteCompleto[]): AccidentChartPoint[] {
  return countChecklist(
    informes,
    i => i.partesCuerpo,
    i => i.parteCuerpoOtro,
    PARTES_CUERPO,
  )
}

export function countNaturalezasLesion(informes: InformeAccidenteCompleto[]): AccidentChartPoint[] {
  return countChecklist(
    informes,
    i => i.naturalezasLesion,
    i => i.naturalezaLesionOtro,
    NATURALEZAS_LESION,
  )
}

export function rankAfectados(informes: InformeAccidenteCompleto[]): AfectadoRank[] {
  const byDni = new Map<string, { nombre: string; count: number; lastMs: number }>()
  for (const i of informes) {
    const dni = i.afectadoDni
    const prev = byDni.get(dni)
    const ms = i.creadoEn.toDate().getTime()
    if (!prev) {
      byDni.set(dni, { nombre: i.afectadoNombre, count: 1, lastMs: ms })
      continue
    }
    prev.count += 1
    if (ms >= prev.lastMs) {
      prev.lastMs = ms
      prev.nombre = i.afectadoNombre
    }
  }

  const rows = [...byDni.entries()].map(([dni, v]) => ({
    dni,
    nombre: v.nombre,
    count: v.count,
    isTop: false,
  }))
  rows.sort((a, b) => b.count - a.count || a.nombre.localeCompare(b.nombre, 'es'))
  const max = rows[0]?.count ?? 0
  if (max > 1) {
    for (const row of rows) row.isTop = row.count === max
  }
  return rows
}
