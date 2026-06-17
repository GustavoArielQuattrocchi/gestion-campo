import { addDoc, collection, Timestamp } from 'firebase/firestore'
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
    creadoEn: Timestamp.now(),
  })

  return docRef.id
}
