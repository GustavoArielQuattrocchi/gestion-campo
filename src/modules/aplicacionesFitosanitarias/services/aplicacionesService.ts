import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  Timestamp,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../../../firebase'
import type {
  AplicacionCuadro,
  AplicacionFitosanitaria,
  AplicacionFitosanitariaCreate,
  AplicacionProducto,
} from '../types'

const COLLECTION = 'aplicacionesFitosanitarias'

function colRef() {
  return collection(db, COLLECTION)
}

function toStr(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function toNum(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function toNumOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function toTs(value: unknown): Timestamp {
  return value instanceof Timestamp ? value : Timestamp.now()
}

function mapCuadro(raw: unknown): AplicacionCuadro {
  const data = raw && typeof raw === 'object' ? (raw as DocumentData) : {}
  return {
    cuadroId: toStr(data.cuadroId),
    nombre: toStr(data.nombre),
    hileras: toNum(data.hileras),
    canopia_hil: toNum(data.canopia_hil),
    canopia_ha: toNum(data.canopia_ha),
    haEstimada: toNumOrNull(data.haEstimada),
  }
}

function mapProducto(raw: unknown): AplicacionProducto {
  const data = raw && typeof raw === 'object' ? (raw as DocumentData) : {}
  return {
    producto: toStr(data.producto),
    ia: toStr(data.ia),
    presentacion: toStr(data.presentacion),
    dosisHaReceta: toNumOrNull(data.dosisHaReceta),
    dosisMaquinada: toStr(data.dosisMaquinada),
    gasto: toNumOrNull(data.gasto),
    dosisRealHa: toNumOrNull(data.dosisRealHa),
  }
}

function mapAplicacion(id: string, data: DocumentData): AplicacionFitosanitaria {
  return {
    id,
    owner_id: toStr(data.owner_id),
    ordenId: toStr(data.ordenId),
    oc: toStr(data.oc),
    finca: toStr(data.finca),
    fincaCatalogo: toStr(data.fincaCatalogo),
    cultivo: toStr(data.cultivo),
    fecha: toTs(data.fecha),
    volumenLitros: toNum(data.volumenLitros),
    vol_aplicacion: toNum(data.vol_aplicacion),
    vol_maquinaria: toNum(data.vol_maquinaria),
    cuadros: Array.isArray(data.cuadros) ? data.cuadros.map(mapCuadro) : [],
    haTotal: toNum(data.haTotal),
    productos: Array.isArray(data.productos) ? data.productos.map(mapProducto) : [],
    registrado_por: toStr(data.registrado_por),
    created_at: toTs(data.created_at),
    updated_at: toTs(data.updated_at),
  }
}

function toPersistable(data: AplicacionFitosanitariaCreate): DocumentData {
  return {
    owner_id: data.owner_id,
    ordenId: data.ordenId,
    oc: data.oc,
    finca: data.finca,
    fincaCatalogo: data.fincaCatalogo,
    cultivo: data.cultivo,
    fecha: data.fecha,
    volumenLitros: data.volumenLitros,
    vol_aplicacion: data.vol_aplicacion,
    vol_maquinaria: data.vol_maquinaria,
    cuadros: data.cuadros.map(c => ({
      cuadroId: c.cuadroId,
      nombre: c.nombre,
      hileras: c.hileras,
      canopia_hil: c.canopia_hil,
      canopia_ha: c.canopia_ha,
      haEstimada: c.haEstimada,
    })),
    haTotal: data.haTotal,
    productos: data.productos.map(p => ({
      producto: p.producto,
      ia: p.ia,
      presentacion: p.presentacion,
      dosisHaReceta: p.dosisHaReceta,
      dosisMaquinada: p.dosisMaquinada,
      gasto: p.gasto,
      dosisRealHa: p.dosisRealHa,
    })),
    registrado_por: data.registrado_por,
  }
}

/** Lista todos los turnos de los admins, más recientes primero. */
export async function getAplicaciones(): Promise<AplicacionFitosanitaria[]> {
  const snap = await getDocs(colRef())
  const items = snap.docs.map(d => mapAplicacion(d.id, d.data()))
  items.sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis())
  return items
}

export async function createAplicacion(data: AplicacionFitosanitariaCreate): Promise<string> {
  const now = Timestamp.now()
  const ref = await addDoc(colRef(), {
    ...toPersistable(data),
    created_at: now,
    updated_at: now,
  })
  return ref.id
}

export async function updateAplicacion(
  id: string,
  data: Omit<AplicacionFitosanitariaCreate, 'owner_id' | 'registrado_por'>,
): Promise<void> {
  const persistable = toPersistable({
    ...data,
    owner_id: '',
    registrado_por: '',
  })
  const { owner_id: _ownerId, registrado_por: _registrado, ...rest } = persistable
  void _ownerId
  void _registrado
  await updateDoc(doc(db, COLLECTION, id), {
    ...rest,
    updated_at: Timestamp.now(),
  })
}

export async function deleteAplicacion(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id))
}
