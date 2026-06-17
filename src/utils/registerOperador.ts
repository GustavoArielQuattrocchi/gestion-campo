import { doc, setDoc, Timestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

/** Vincula el nombre del operador al uid de Firebase Auth (colección `operadores`). */
export async function registerOperador(nombre: string): Promise<void> {
  const user = auth.currentUser
  if (!user) {
    throw new Error('No hay sesión de Firebase activa')
  }

  const trimmed = nombre.trim()
  if (!trimmed) {
    throw new Error('El nombre del operador no puede estar vacío')
  }

  await setDoc(
    doc(db, 'operadores', user.uid),
    {
      nombre: trimmed,
      actualizadoEn: Timestamp.now(),
    },
    { merge: true },
  )
}
