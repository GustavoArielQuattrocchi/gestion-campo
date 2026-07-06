import { collection, doc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import type { Tarea, TareaManual } from '../types'

/** Clave que identifica tareas duplicadas (misma finca + labor + ejecutor). */
function duplicateKey(t: Tarea): string {
  const ejecutor = t.tipo === 'manual' ? t.cuadrilla : t.persona
  return `${t.fincaId}|${t.tarea}|${t.tipo}|${ejecutor}`.toLowerCase()
}

export interface GrupoDuplicado {
  key: string
  principal: Tarea
  duplicadas: Tarea[]
}

/** Encuentra grupos de tareas en_progreso duplicadas (misma finca+labor+ejecutor). */
export function findDuplicados(tareas: Tarea[]): GrupoDuplicado[] {
  const enProgreso = tareas.filter(t => t.estado === 'en_progreso')
  const grupos = new Map<string, Tarea[]>()

  for (const t of enProgreso) {
    const key = duplicateKey(t)
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

/**
 * Consolida tareas duplicadas: fusiona cuadros, cuadroIds, cuadroIdsFinalizados
 * y rendimientosDiarios en la tarea principal, y elimina las duplicadas
 * (junto con sus partes de labores reasignándolos a la principal).
 */
export async function consolidarGrupo(grupo: GrupoDuplicado): Promise<void> {
  const { principal, duplicadas } = grupo

  const allCuadros = new Set(principal.cuadros ?? [])
  const allCuadroIds = new Set(principal.cuadroIds ?? [])
  const allFinalizados = new Set(principal.cuadroIdsFinalizados ?? [])
  const allRendimientos = [...(principal.rendimientosDiarios ?? [])]

  let maxPersonas = principal.tipo === 'manual' ? (principal as TareaManual).cantidadPersonas : 0

  for (const dup of duplicadas) {
    for (const c of dup.cuadros ?? []) allCuadros.add(c)
    for (const id of dup.cuadroIds ?? []) allCuadroIds.add(id)
    for (const id of dup.cuadroIdsFinalizados ?? []) allFinalizados.add(id)
    for (const r of dup.rendimientosDiarios ?? []) allRendimientos.push(r)
    if (dup.tipo === 'manual') {
      maxPersonas = Math.max(maxPersonas, (dup as TareaManual).cantidadPersonas)
    }
  }

  const updateData: Record<string, unknown> = {
    cuadros: [...allCuadros],
    cuadroIds: [...allCuadroIds],
  }

  if (allFinalizados.size > 0) {
    updateData.cuadroIdsFinalizados = [...allFinalizados]
  }

  if (allRendimientos.length > (principal.rendimientosDiarios?.length ?? 0)) {
    updateData.rendimientosDiarios = allRendimientos
    const last = allRendimientos[allRendimientos.length - 1]
    if (last?.texto) updateData.rendimiento = last.texto
  }

  if (principal.tipo === 'manual' && maxPersonas > (principal as TareaManual).cantidadPersonas) {
    updateData.cantidadPersonas = maxPersonas
  }

  await updateDoc(doc(db, 'tareas', principal.id), updateData)

  for (const dup of duplicadas) {
    const partesSnap = await getDocs(
      query(collection(db, 'partes_labores'), where('tareaId', '==', dup.id)),
    )
    if (!partesSnap.empty) {
      const batch = writeBatch(db)
      partesSnap.forEach(parteDoc => {
        batch.update(parteDoc.ref, { tareaId: principal.id })
      })
      batch.delete(doc(db, 'tareas', dup.id))
      await batch.commit()
    } else {
      const { deleteDoc: del } = await import('firebase/firestore')
      await del(doc(db, 'tareas', dup.id))
    }
  }
}

/** Consolida todos los grupos de duplicados encontrados. */
export async function consolidarTodos(tareas: Tarea[]): Promise<number> {
  const grupos = findDuplicados(tareas)
  for (const grupo of grupos) {
    await consolidarGrupo(grupo)
  }
  return grupos.reduce((sum, g) => sum + g.duplicadas.length, 0)
}
