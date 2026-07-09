import { deleteField, doc, getDoc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import type { ParteDeLabores, RendimientoDiario, RendimientoUnidad } from '../types'
import { formatRendimiento } from './rendimiento'
import {
  applyRendimientoEdit,
  resolveParteDeletion,
  type RendimientoMatch,
} from './partesLaboresSync'

function readEntries(data: Record<string, unknown> | undefined): RendimientoDiario[] {
  const raw = data?.rendimientosDiarios
  return Array.isArray(raw) ? (raw as RendimientoDiario[]) : []
}

function matchFromParte(parte: ParteDeLabores): RendimientoMatch {
  return { parteId: parte.id, operador: parte.operador, texto: parte.rendimiento ?? '' }
}

/** Edita el rendimiento de un parte y sincroniza el historial de la tarea. */
export async function updateParteRendimiento(
  parte: ParteDeLabores,
  cantidad: number,
  unidad: RendimientoUnidad,
): Promise<void> {
  const texto = formatRendimiento(cantidad, unidad)
  const parteRef = doc(db, 'partes_labores', parte.id)
  const tareaRef = doc(db, 'tareas', parte.tareaId)

  const tareaSnap = await getDoc(tareaRef)
  const batch = writeBatch(db)

  batch.update(parteRef, {
    rendimiento: texto,
    rendimientoCantidad: cantidad,
    rendimientoUnidad: unidad,
  })

  if (tareaSnap.exists()) {
    const entries = readEntries(tareaSnap.data())
    const result = applyRendimientoEdit(entries, matchFromParte(parte), cantidad, unidad, texto)
    if (result.changed) {
      batch.update(tareaRef, {
        rendimientosDiarios: result.entries,
        rendimiento: result.rendimiento,
      })
    }
  }

  await batch.commit()
}

/**
 * Elimina un parte por completo: borra el documento, quita su registro del
 * historial de la tarea y, si este parte finalizó la tarea (o era su último
 * registro), la reabre para que no quede como finalizada. Todo en un batch atómico.
 */
export async function deleteParte(parte: ParteDeLabores): Promise<void> {
  const parteRef = doc(db, 'partes_labores', parte.id)
  const tareaRef = doc(db, 'tareas', parte.tareaId)

  const tareaSnap = await getDoc(tareaRef)
  const batch = writeBatch(db)

  batch.delete(parteRef)

  if (tareaSnap.exists()) {
    const data = tareaSnap.data()
    const entries = readEntries(data)
    const result = resolveParteDeletion(entries, matchFromParte(parte), {
      finalizada: data.estado === 'finalizada',
      finalizoTarea: parte.finalizoTarea,
    })

    if (result.changed || result.reopen) {
      const update: Record<string, unknown> = {}
      if (result.changed) {
        update.rendimientosDiarios = result.entries
        update.rendimiento = result.rendimiento
      }
      if (result.reopen) {
        update.estado = 'en_progreso'
        update.fechaFin = deleteField()
      }
      batch.update(tareaRef, update)
    }
  }

  await batch.commit()
}
