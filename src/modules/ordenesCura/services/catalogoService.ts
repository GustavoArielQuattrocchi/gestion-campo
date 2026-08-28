import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../../../firebase'

/** Producto del catálogo compartido (`/catalogoProductos/{id}`). */
export interface ProductoCatalogo {
  id: string
  nombre: string
  ia: string
  presentacion: string
  dosis_ha: string
}

const CATALOGO_COLLECTION = 'catalogoProductos'

function catalogoRef() {
  return collection(db, CATALOGO_COLLECTION)
}

function toStr(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function mapProducto(id: string, data: DocumentData): ProductoCatalogo {
  return {
    id,
    nombre: toStr(data.nombre),
    ia: toStr(data.ia),
    presentacion: toStr(data.presentacion),
    dosis_ha: toStr(data.dosis_ha),
  }
}

/** Lista el catálogo ordenado alfabéticamente por nombre. */
export async function getCatalogo(): Promise<ProductoCatalogo[]> {
  const snap = await getDocs(catalogoRef())
  const productos = snap.docs.map(d => mapProducto(d.id, d.data()))
  productos.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  return productos
}

/** Elimina un producto del catálogo. */
export async function deleteProducto(productoId: string): Promise<void> {
  await deleteDoc(doc(db, CATALOGO_COLLECTION, productoId))
}

interface ProductoInput {
  nombre: string
  ia: string
  presentacion: string
  dosis_ha: string
}

/**
 * Crea o actualiza productos en el catálogo por nombre (insensible a
 * mayúsculas y espacios). Recuerda IA, presentación y dosis/ha.
 */
export async function ensureProductosEnCatalogo(
  productos: ProductoInput[],
): Promise<void> {
  const existentes = await getCatalogo()
  const porNombre = new Map(existentes.map(p => [p.nombre.trim().toLowerCase(), p]))

  const writes: Promise<unknown>[] = []
  for (const producto of productos) {
    const nombre = producto.nombre.trim()
    if (!nombre) continue
    const payload = {
      nombre,
      ia: producto.ia.trim(),
      presentacion: producto.presentacion.trim(),
      dosis_ha: producto.dosis_ha.trim(),
    }
    const actual = porNombre.get(nombre.toLowerCase())
    if (actual) {
      const patch: Record<string, string> = { nombre }
      if (payload.ia) patch.ia = payload.ia
      if (payload.presentacion) patch.presentacion = payload.presentacion
      if (payload.dosis_ha) patch.dosis_ha = payload.dosis_ha
      writes.push(updateDoc(doc(db, CATALOGO_COLLECTION, actual.id), patch))
      continue
    }
    porNombre.set(nombre.toLowerCase(), { id: '', ...payload })
    writes.push(addDoc(catalogoRef(), payload))
  }

  await Promise.all(writes)
}
