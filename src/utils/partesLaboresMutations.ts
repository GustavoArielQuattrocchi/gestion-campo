import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { ParteDeLabores, RendimientoDiario, RendimientoUnidad } from '../types'
import { formatRendimiento } from './rendimiento'
import {
  applyRendimientoEdit,
  removeRendimientoEntry,
  type RendimientoMatch,
} from './partesLaboresSync'

function readEntries(data: Record<string, unknown> | undefined): RendimientoDiario[] {
  const raw = data?.rendimientosDiarios
  return Array.isArray(raw) ? (raw as RendimientoDiario[]) : []
}

/** Edita el rendimiento de un parte y sincroniza el historial de la tarea. */
export async function updateParteRendimiento(
  parte: ParteDeLabores,
  cantidad: number,
  unidad: RendimientoUnidad,
): Promise<void> {
  const texto = formatRendimiento(cantidad, unidad)

  await updateDoc(doc(db, 'partes_labores', parte.id), {
    rendimiento: texto,
    rendimientoCantidad: cantidad,
    rendimientoUnidad: unidad,
  })

  const tareaRef = doc(db, 'tareas', parte.tareaId)
  const tareaSnap = await getDoc(tareaRef)
  if (!tareaSnap.exists()) return

  const match: RendimientoMatch = {
    parteId: parte.id,
    operador: parte.operador,
    texto: parte.rendimiento,
  }
  const entries = readEntries(tareaSnap.data())
  const result = applyRendimientoEdit(entries, match, cantidad, unidad, texto)
  if (!result.changed) return

  await updateDoc(tareaRef, {
    rendimientosDiarios: result.entries,
    rendimiento: result.rendimiento,
  })
}

/** Elimina un parte y quita el registro correspondiente del historial de la tarea. */
export async function deleteParte(parte: ParteDeLabores): Promise<void> {
  const tareaRef = doc(db, 'tareas', parte.tareaId)
  const tareaSnap = await getDoc(tareaRef)

  await deleteDoc(doc(db, 'partes_labores', parte.id))

  if (!tareaSnap.exists()) return

  const match: RendimientoMatch = {
    parteId: parte.id,
    operador: parte.operador,
    texto: parte.rendimiento,
  }
  const entries = readEntries(tareaSnap.data())
  const result = removeRendimientoEntry(entries, match)
  if (!result.changed) return

  await updateDoc(tareaRef, {
    rendimientosDiarios: result.entries,
    rendimiento: result.rendimiento,
  })
}
