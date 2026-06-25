import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../../../firebase'
import type {
  OrdenCura,
  OrdenCuraCreate,
  OrdenCuraWithItems,
  OrderItem,
} from '../types'

const ORDENES_COLLECTION = 'ordenesCura'
const ITEMS_SUBCOLLECTION = 'items'

function ordenesRef() {
  return collection(db, ORDENES_COLLECTION)
}

function itemsRef(ordenId: string) {
  return collection(db, ORDENES_COLLECTION, ordenId, ITEMS_SUBCOLLECTION)
}

function toStr(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function toNum(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function toTs(value: unknown): Timestamp {
  return value instanceof Timestamp ? value : Timestamp.now()
}

function mapOrden(id: string, data: DocumentData): OrdenCura {
  return {
    id,
    owner_id: toStr(data.owner_id),
    oc: toStr(data.oc),
    fecha: toTs(data.fecha),
    finca: toStr(data.finca),
    cultivo: toStr(data.cultivo),
    manejo: toStr(data.manejo),
    tecnico: toStr(data.tecnico),
    tractorista: toStr(data.tractorista),
    tractor: toStr(data.tractor),
    maquinaria: toStr(data.maquinaria),
    vol_maquinaria: toNum(data.vol_maquinaria),
    vol_aplicacion: toNum(data.vol_aplicacion),
    cuartel: toStr(data.cuartel),
    indicaciones: toStr(data.indicaciones),
    created_at: toTs(data.created_at),
    updated_at: toTs(data.updated_at),
  }
}

function mapItem(id: string, data: DocumentData): OrderItem {
  return {
    id,
    producto: toStr(data.producto),
    ia: toStr(data.ia),
    presentacion: toStr(data.presentacion),
    dosis_ha: toStr(data.dosis_ha),
    dosis_maquinada: toStr(data.dosis_maquinada),
    obs: toStr(data.obs),
  }
}

/** Campos persistibles de un item (sin `id`, que lo genera Firestore). */
function itemToData(item: Omit<OrderItem, 'id'>): DocumentData {
  return {
    producto: item.producto,
    ia: item.ia,
    presentacion: item.presentacion,
    dosis_ha: item.dosis_ha,
    dosis_maquinada: item.dosis_maquinada,
    obs: item.obs,
  }
}

/** Lista las órdenes del usuario, ordenadas por fecha de creación descendente. */
export async function getOrdenes(userId: string): Promise<OrdenCura[]> {
  // Se filtra por owner_id y se ordena en cliente para no requerir índice compuesto.
  const snap = await getDocs(query(ordenesRef(), where('owner_id', '==', userId)))
  const ordenes = snap.docs.map(d => mapOrden(d.id, d.data()))
  ordenes.sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis())
  return ordenes
}

/** Obtiene una orden con todos sus items. */
export async function getOrdenById(ordenId: string): Promise<OrdenCuraWithItems> {
  const ordenSnap = await getDoc(doc(db, ORDENES_COLLECTION, ordenId))
  if (!ordenSnap.exists()) {
    throw new Error(`La orden ${ordenId} no existe`)
  }
  const items = await getItemsByOrden(ordenId)
  return { ...mapOrden(ordenSnap.id, ordenSnap.data()), items }
}

/**
 * Crea una orden y sus items de forma atómica (batch write).
 * El `id` de cada item entrante se ignora: Firestore genera uno nuevo.
 */
export async function createOrden(
  data: OrdenCuraCreate,
  items: OrderItem[],
): Promise<string> {
  const batch = writeBatch(db)
  const now = Timestamp.now()
  const ordenRef = doc(ordenesRef())

  batch.set(ordenRef, {
    ...data,
    created_at: now,
    updated_at: now,
  })

  for (const item of items) {
    const itemRef = doc(itemsRef(ordenRef.id))
    batch.set(itemRef, itemToData(item))
  }

  await batch.commit()
  return ordenRef.id
}

/** Actualiza campos de una orden (no toca `id` ni `created_at`). */
export async function updateOrden(
  ordenId: string,
  data: Partial<OrdenCura>,
): Promise<void> {
  const { id: _id, created_at: _createdAt, ...rest } = data
  void _id
  void _createdAt
  await updateDoc(doc(db, ORDENES_COLLECTION, ordenId), {
    ...rest,
    updated_at: Timestamp.now(),
  })
}

/** Elimina una orden y todos los items de su subcolección de forma atómica. */
export async function deleteOrden(ordenId: string): Promise<void> {
  const itemsSnap = await getDocs(itemsRef(ordenId))
  const batch = writeBatch(db)
  for (const itemDoc of itemsSnap.docs) {
    batch.delete(itemDoc.ref)
  }
  batch.delete(doc(db, ORDENES_COLLECTION, ordenId))
  await batch.commit()
}

/** Lista los items de una orden. */
export async function getItemsByOrden(ordenId: string): Promise<OrderItem[]> {
  const snap = await getDocs(itemsRef(ordenId))
  return snap.docs.map(d => mapItem(d.id, d.data()))
}

/**
 * Reemplaza por completo los items de una orden (borra los existentes y crea los
 * nuevos) en un único batch atómico. Útil al guardar ediciones del formulario.
 */
export async function replaceOrdenItems(
  ordenId: string,
  items: OrderItem[],
): Promise<void> {
  const existing = await getDocs(itemsRef(ordenId))
  const batch = writeBatch(db)
  for (const itemDoc of existing.docs) {
    batch.delete(itemDoc.ref)
  }
  for (const item of items) {
    batch.set(doc(itemsRef(ordenId)), itemToData(item))
  }
  await batch.commit()
}

/** Agrega un item a una orden y devuelve su id generado. */
export async function addItem(
  ordenId: string,
  item: Omit<OrderItem, 'id'>,
): Promise<string> {
  const ref = await addDoc(itemsRef(ordenId), itemToData(item))
  return ref.id
}

/** Actualiza un item (no toca `id`). */
export async function updateItem(
  ordenId: string,
  itemId: string,
  data: Partial<OrderItem>,
): Promise<void> {
  const { id: _id, ...rest } = data
  void _id
  await updateDoc(doc(db, ORDENES_COLLECTION, ordenId, ITEMS_SUBCOLLECTION, itemId), rest)
}

/** Elimina un item de una orden. */
export async function deleteItem(ordenId: string, itemId: string): Promise<void> {
  await deleteDoc(doc(db, ORDENES_COLLECTION, ordenId, ITEMS_SUBCOLLECTION, itemId))
}
