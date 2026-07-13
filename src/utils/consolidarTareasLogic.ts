import type { Tarea } from '../types'
import { laborTaskGroupKey } from './laborTaskKey'

export interface GrupoDuplicado {
  key: string
  principal: Tarea
  duplicadas: Tarea[]
}

/** Encuentra grupos de tareas en_progreso duplicadas (misma finca + labor + tipo). */
export function findDuplicados(tareas: Tarea[]): GrupoDuplicado[] {
  const enProgreso = tareas.filter(t => t.estado === 'en_progreso')
  const grupos = new Map<string, Tarea[]>()

  for (const t of enProgreso) {
    const key = laborTaskGroupKey(t)
    const arr = grupos.get(key) ?? []
    arr.push(t)
    grupos.set(key, arr)
  }

  const result: GrupoDuplicado[] = []
  for (const [key, group] of grupos) {
    if (group.length < 2) continue
    const sorted = [...group].sort((a, b) => {
      const ta = a.fechaInicio?.toDate?.()?.getTime() ?? 0
      const tb = b.fechaInicio?.toDate?.()?.getTime() ?? 0
      return ta - tb
    })
    result.push({ key, principal: sorted[0], duplicadas: sorted.slice(1) })
  }
  return result
}
