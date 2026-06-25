import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../../../firebase'

/** Producto del catálogo compartido (`/catalogoProductos/{id}`). */
export interface ProductoCatalogo {
  id: string
  nombre: string
  ia: string
  presentacion: string
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
}

/**
 * Agrega al catálogo los productos cuyo nombre todavía no existe (comparación
 * insensible a mayúsculas y espacios). No duplica los ya presentes.
 */
export async function ensureProductosEnCatalogo(
  productos: ProductoInput[],
): Promise<void> {
  const existentes = await getCatalogo()
  const conocidos = new Set(existentes.map(p => p.nombre.trim().toLowerCase()))

  const nuevos: ProductoInput[] = []
  for (const producto of productos) {
    const nombre = producto.nombre.trim()
    if (!nombre) continue
    const clave = nombre.toLowerCase()
    if (conocidos.has(clave)) continue
    conocidos.add(clave)
    nuevos.push({ nombre, ia: producto.ia.trim(), presentacion: producto.presentacion.trim() })
  }

  await Promise.all(
    nuevos.map(p =>
      addDoc(catalogoRef(), { nombre: p.nombre, ia: p.ia, presentacion: p.presentacion }),
    ),
  )
}
