import {
  addDoc,
  collection,
  doc,
  getDocs,
  Timestamp,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore'
import { auth, db } from '../../../firebase'
import {
  createProductoExtra,
  getCatalogo,
  type ProductoCatalogoAlta,
} from '../../ordenesCura/services/catalogoService'
import type { StockProductoPropuesta } from '../types'

const COLLECTION = 'stockProductoPropuestas'

function col() {
  return collection(db, COLLECTION)
}

function toStr(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function toTs(value: unknown): Timestamp {
  return value instanceof Timestamp ? value : Timestamp.now()
}

function actor() {
  const user = auth.currentUser
  if (!user) throw new Error('No hay sesión de Firebase activa')
  return { uid: user.uid, email: user.email ?? '' }
}

function mapPropuesta(id: string, data: DocumentData): StockProductoPropuesta {
  const estado = toStr(data.estado)
  return {
    id,
    categoria: toStr(data.categoria),
    nombre: toStr(data.nombre),
    ia: toStr(data.ia),
    presentacion: toStr(data.presentacion),
    dosis_ha: toStr(data.dosis_ha),
    description: toStr(data.description),
    management: toStr(data.management),
    estado: estado === 'confirmada' || estado === 'rechazada' ? estado : 'pendiente',
    operador: toStr(data.operador),
    owner_id: toStr(data.owner_id),
    created_at: toTs(data.created_at),
    confirmadoPor: toStr(data.confirmadoPor) || undefined,
    confirmadoEn: data.confirmadoEn instanceof Timestamp ? data.confirmadoEn : undefined,
  }
}

export async function getProductoPropuestas(): Promise<StockProductoPropuesta[]> {
  const snap = await getDocs(col())
  return snap.docs
    .map(d => mapPropuesta(d.id, d.data()))
    .sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis())
}

export async function proponerProducto(
  input: ProductoCatalogoAlta,
  operador: string,
): Promise<void> {
  const { uid } = actor()
  const nombre = input.nombre.trim()
  const categoria = input.categoria.trim()
  if (!nombre || !categoria || !input.ia.trim() || !input.presentacion.trim()) {
    throw new Error('incompleto')
  }
  await addDoc(col(), {
    categoria,
    nombre,
    ia: input.ia.trim(),
    presentacion: input.presentacion.trim(),
    dosis_ha: input.dosis_ha.trim(),
    description: input.description.trim(),
    management: input.management.trim() || 'Convencional',
    estado: 'pendiente',
    operador,
    owner_id: uid,
    created_at: Timestamp.now(),
  })
}

export async function confirmarProductoPropuesta(
  propuestaId: string,
  adminEmail: string,
): Promise<void> {
  const propuestas = await getProductoPropuestas()
  const propuesta = propuestas.find(p => p.id === propuestaId)
  if (!propuesta || propuesta.estado !== 'pendiente') throw new Error('estado')
  const catalogo = await getCatalogo()
  await createProductoExtra({
    categoria: propuesta.categoria,
    nombre: propuesta.nombre,
    ia: propuesta.ia,
    presentacion: propuesta.presentacion,
    dosis_ha: propuesta.dosis_ha,
    description: propuesta.description,
    management: propuesta.management,
  }, catalogo)
  await updateDoc(doc(db, COLLECTION, propuestaId), {
    estado: 'confirmada',
    confirmadoPor: adminEmail,
    confirmadoEn: Timestamp.now(),
  })
}

export async function rechazarProductoPropuesta(
  propuestaId: string,
  adminEmail: string,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, propuestaId), {
    estado: 'rechazada',
    confirmadoPor: adminEmail,
    confirmadoEn: Timestamp.now(),
  })
}
