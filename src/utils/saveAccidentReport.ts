import { addDoc, collection, deleteDoc, doc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { validateAccidentReport, type AccidentReportInput } from '../validation/accidentReport'

export async function saveAccidentReport(input: AccidentReportInput): Promise<string> {
  const validated = validateAccidentReport(input)
  if (!validated.success) {
    throw new Error(validated.reason)
  }

  const docRef = await addDoc(collection(db, 'informes_accidente'), {
    operador: validated.data.operador,
    fincaId: validated.data.fincaId,
    fincaNombre: validated.data.fincaNombre,
    descripcion: validated.data.descripcion,
    tieneFoto: validated.data.tieneFoto,
    afectadoNombre: validated.data.afectadoNombre,
    afectadoDni: validated.data.afectadoDni,
    partesCuerpo: validated.data.partesCuerpo,
    parteCuerpoOtro: validated.data.parteCuerpoOtro,
    naturalezasLesion: validated.data.naturalezasLesion,
    naturalezaLesionOtro: validated.data.naturalezaLesionOtro,
    tipo: validated.data.tipo,
    tarea: validated.data.tarea,
    creadoEn: Timestamp.now(),
  })

  return docRef.id
}

export async function deleteAccidentReport(informeId: string): Promise<void> {
  const id = informeId.trim()
  if (!id) throw new Error('Falta el identificador del informe')
  await deleteDoc(doc(db, 'informes_accidente', id))
}
