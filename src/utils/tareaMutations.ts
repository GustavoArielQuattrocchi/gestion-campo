import { collection, deleteDoc, doc, getDocs, query, where, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Elimina una tarea por completo junto con sus partes de labores asociados,
 * para no dejar partes huérfanos en la app. Solo un admin puede hacerlo (reglas).
 */
export async function deleteTareaConPartes(tareaId: string): Promise<void> {
  const partesSnap = await getDocs(
    query(collection(db, 'partes_labores'), where('tareaId', '==', tareaId)),
  )

  if (partesSnap.empty) {
    await deleteDoc(doc(db, 'tareas', tareaId))
    return
  }

  const batch = writeBatch(db)
  partesSnap.forEach(parteDoc => batch.delete(parteDoc.ref))
  batch.delete(doc(db, 'tareas', tareaId))
  await batch.commit()
}
