import { format, isSameDay } from 'date-fns'
import type { ParteDeLabores, Tarea } from '../types'

export function isParteAbierto(parte: ParteDeLabores): boolean {
  return parte.estado === 'abierto'
}

export function isParteCerrado(parte: ParteDeLabores): boolean {
  return parte.estado === 'cerrado'
}

export function findParteAbierto(partes: ParteDeLabores[], tareaId: string): ParteDeLabores | undefined {
  return partes.find(p => p.tareaId === tareaId && p.estado === 'abierto')
}

export function tieneParteAbierto(partes: ParteDeLabores[], tareaId: string): boolean {
  return partes.some(p => p.tareaId === tareaId && p.estado === 'abierto')
}

/** Tareas con parte de labores abierto (pendientes de cierre de jornada). */
export function filterTareasConParteAbierto(tareas: Tarea[], partesAbiertos: ParteDeLabores[]): Tarea[] {
  const ids = new Set(partesAbiertos.filter(isParteAbierto).map(p => p.tareaId))
  return tareas.filter(t => ids.has(t.id))
}

export function parteSortKey(parte: ParteDeLabores): number {
  const ts = parte.estado === 'cerrado' && parte.cerradoEn ? parte.cerradoEn : parte.abiertoEn
  return ts.seconds
}

export function parteDiaClave(parte: ParteDeLabores): string {
  const ts =
    parte.estado === 'abierto'
      ? parte.abiertoEn
      : (parte.cerradoEn ?? parte.abiertoEn)
  return format(ts.toDate(), 'yyyy-MM-dd')
}

export function isParteCerradoHoy(parte: ParteDeLabores, referenceDate = new Date()): boolean {
  return (
    parte.estado === 'cerrado' &&
    !!parte.cerradoEn?.toDate &&
    isSameDay(parte.cerradoEn.toDate(), referenceDate)
  )
}

export interface PartesDashboardGroups {
  enEjecucion: ParteDeLabores[]
  cerradosHoy: ParteDeLabores[]
  historico: ParteDeLabores[]
}

export function groupPartesForDashboard(
  partes: ParteDeLabores[],
  referenceDate = new Date(),
): PartesDashboardGroups {
  const enEjecucion: ParteDeLabores[] = []
  const cerradosHoy: ParteDeLabores[] = []
  const historico: ParteDeLabores[] = []

  for (const parte of partes) {
    if (isParteAbierto(parte)) {
      enEjecucion.push(parte)
      continue
    }
    if (parte.cerradoEn?.toDate && isSameDay(parte.cerradoEn.toDate(), referenceDate)) {
      cerradosHoy.push(parte)
    } else {
      historico.push(parte)
    }
  }

  const byDesc = (a: ParteDeLabores, b: ParteDeLabores) => parteSortKey(b) - parteSortKey(a)
  enEjecucion.sort(byDesc)
  cerradosHoy.sort(byDesc)
  historico.sort(byDesc)

  return { enEjecucion, cerradosHoy, historico }
}

export function historicoPorDia(partes: ParteDeLabores[]): Map<string, ParteDeLabores[]> {
  const map = new Map<string, ParteDeLabores[]>()
  for (const parte of partes) {
    if (!parte.cerradoEn?.toDate) continue
    const key = format(parte.cerradoEn.toDate(), 'yyyy-MM-dd')
    const list = map.get(key) ?? []
    list.push(parte)
    map.set(key, list)
  }
  for (const [, list] of map) {
    list.sort((a, b) => parteSortKey(b) - parteSortKey(a))
  }
  return new Map([...map.entries()].sort(([a], [b]) => b.localeCompare(a)))
}
