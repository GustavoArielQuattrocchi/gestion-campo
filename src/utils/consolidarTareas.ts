import { collection, doc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import type { Tarea, TareaManual } from '../types'
import { findDuplicados, type GrupoDuplicado } from './consolidarTareasLogic'
import {
  getEjecutorLabelFromTarea,
  inferEjecutorPorCuadroFromTarea,
  mergeEjecutorPorCuadro,
} from './tareaEjecutor'

export type { GrupoDuplicado } from './consolidarTareasLogic'
export { findDuplicados } from './consolidarTareasLogic'

function mergeEjecutorMaps(principal: Tarea, duplicadas: Tarea[]): Record<string, string> {
  let merged = { ...(principal.ejecutorPorCuadro ?? inferEjecutorPorCuadroFromTarea(principal)) }
  for (const dup of duplicadas) {
    const dupMap = dup.ejecutorPorCuadro ?? inferEjecutorPorCuadroFromTarea(dup)
    merged = mergeEjecutorPorCuadro(merged, dupMap)
    const fallbackLabel = getEjecutorLabelFromTarea(dup)
    for (const id of dup.cuadroIds ?? []) {
      if (!merged[id]) merged[id] = fallbackLabel
    }
  }
  return merged
}

/**
 * Consolida tareas duplicadas: fusiona cuadros, cuadroIds, cuadroIdsFinalizados,
 * rendimientosDiarios y ejecutorPorCuadro en la tarea principal, y elimina las duplicadas
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

  const ejecutorPorCuadro = mergeEjecutorMaps(principal, duplicadas)

  const updateData: Record<string, unknown> = {
    cuadros: [...allCuadros],
    cuadroIds: [...allCuadroIds],
    ejecutorPorCuadro,
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
