import {
  collection,
  doc,
  getDoc,
  getDocs,
  Timestamp,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../../../firebase'
import type {
  OrdenFertilizacion,
  OrdenFertilizacionCreate,
  OrdenFertilizacionItem,
  OrdenFertilizacionWithItems,
} from '../types'

const ORDENES_COLLECTION = 'ordenesFertilizacion'
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

function toTs(value: unknown): Timestamp {
  return value instanceof Timestamp ? value : Timestamp.now()
}

function mapOrden(id: string, data: DocumentData): OrdenFertilizacion {
  return {
    id,
    owner_id: toStr(data.owner_id),
    owner_email: toStr(data.owner_email),
    of: toStr(data.of),
    fecha: toTs(data.fecha),
    finca: toStr(data.finca),
    cultivo: toStr(data.cultivo),
    manejo: toStr(data.manejo),
    tecnico: toStr(data.tecnico),
    responsable: toStr(data.responsable),
    cuartel: toStr(data.cuartel),
    indicaciones: toStr(data.indicaciones),
    created_at: toTs(data.created_at),
    updated_at: toTs(data.updated_at),
  }
}

function mapItem(id: string, data: DocumentData): OrdenFertilizacionItem {
  return {
    id,
    producto: toStr(data.producto),
    grupo: toStr(data.grupo),
    ia: toStr(data.ia),
    presentacion: toStr(data.presentacion),
    dosis_ha: toStr(data.dosis_ha),
    superficie: toStr(data.superficie),
    dosis_aplicacion: toStr(data.dosis_aplicacion),
    obs: toStr(data.obs),
  }
}

function itemToData(item: Omit<OrdenFertilizacionItem, 'id'>): DocumentData {
  return {
    producto: item.producto,
    grupo: item.grupo,
    ia: item.ia,
    presentacion: item.presentacion,
    dosis_ha: item.dosis_ha,
    superficie: item.superficie,
    dosis_aplicacion: item.dosis_aplicacion,
    obs: item.obs,
  }
}

/** Lista todas las órdenes de fertilización, más recientes primero. */
export async function getOrdenes(): Promise<OrdenFertilizacion[]> {
  const snap = await getDocs(ordenesRef())
  const ordenes = snap.docs.map(d => mapOrden(d.id, d.data()))
  ordenes.sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis())
  return ordenes
}

export async function getOrdenById(ordenId: string): Promise<OrdenFertilizacionWithItems> {
  const ordenSnap = await getDoc(doc(db, ORDENES_COLLECTION, ordenId))
  if (!ordenSnap.exists()) {
    throw new Error(`La orden ${ordenId} no existe`)
  }
  const itemsSnap = await getDocs(itemsRef(ordenId))
  const items = itemsSnap.docs.map(d => mapItem(d.id, d.data()))
  return { ...mapOrden(ordenSnap.id, ordenSnap.data()), items }
}

/** Crea la cabecera y sus items en un único batch. */
export async function createOrden(
  data: OrdenFertilizacionCreate,
  items: OrdenFertilizacionItem[],
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
    batch.set(doc(itemsRef(ordenRef.id)), itemToData(item))
  }

  await batch.commit()
  return ordenRef.id
}

/**
 * Actualiza la cabecera y reemplaza los items en un único batch.
 * No modifica `owner_id`, `owner_email` ni `created_at`.
 */
export async function updateOrdenConItems(
  ordenId: string,
  data: Partial<OrdenFertilizacion>,
  items: OrdenFertilizacionItem[],
): Promise<void> {
  const existing = await getDocs(itemsRef(ordenId))
  const {
    id: _id,
    created_at: _createdAt,
    owner_id: _ownerId,
    owner_email: _ownerEmail,
    ...rest
  } = data
  void _id
  void _createdAt
  void _ownerId
  void _ownerEmail

  const batch = writeBatch(db)
  batch.update(doc(db, ORDENES_COLLECTION, ordenId), {
    ...rest,
    updated_at: Timestamp.now(),
  })
  for (const itemDoc of existing.docs) {
    batch.delete(itemDoc.ref)
  }
  for (const item of items) {
    batch.set(doc(itemsRef(ordenId)), itemToData(item))
  }
  await batch.commit()
}

/** Elimina la orden y los items de su subcolección. */
export async function deleteOrden(ordenId: string): Promise<void> {
  const itemsSnap = await getDocs(itemsRef(ordenId))
  const batch = writeBatch(db)
  for (const itemDoc of itemsSnap.docs) {
    batch.delete(itemDoc.ref)
  }
  batch.delete(doc(db, ORDENES_COLLECTION, ordenId))
  await batch.commit()
}
