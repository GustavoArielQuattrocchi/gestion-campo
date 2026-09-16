import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../../../firebase'
import {
  catalogoDesdeArchivo,
  mergeCatalogo,
  nextAgroCodigo,
  type ProductoCatalogoVista,
} from '../../../data/agroQuimicos'

export type ProductoCatalogo = ProductoCatalogoVista

const CATALOGO_COLLECTION = 'catalogoProductos'

function catalogoRef() {
  return collection(db, CATALOGO_COLLECTION)
}

function toStr(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function toNum(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

function mapExtra(id: string, data: DocumentData): ProductoCatalogo | null {
  const categoria = toStr(data.categoria).trim()
  if (!categoria) return null
  const nombre = toStr(data.nombre).trim()
  if (!nombre) return null
  return {
    id,
    codigo: toNum(data.codigo),
    categoria,
    nombre,
    ia: toStr(data.ia),
    presentacion: toStr(data.presentacion),
    dosis_ha: toStr(data.dosis_ha),
    description: toStr(data.description),
    management: toStr(data.management),
    origen: 'extra',
  }
}

async function getCatalogoExtras(): Promise<ProductoCatalogo[]> {
  const snap = await getDocs(catalogoRef())
  return snap.docs
    .map(d => mapExtra(d.id, d.data()))
    .filter((p): p is ProductoCatalogo => p !== null)
}

/** Catálogo para la OC: archivo + extras de Firestore con grupo. */
export async function getCatalogo(): Promise<ProductoCatalogo[]> {
  const base = catalogoDesdeArchivo()
  try {
    const extras = await getCatalogoExtras()
    return mergeCatalogo(base, extras)
  } catch {
    return base
  }
}

export interface ProductoCatalogoAlta {
  categoria: string
  nombre: string
  ia: string
  presentacion: string
  dosis_ha: string
  description: string
  management: string
}

export async function createProductoExtra(
  input: ProductoCatalogoAlta,
  catalogoActual: ProductoCatalogo[],
): Promise<void> {
  const nombre = input.nombre.trim()
  const categoria = input.categoria.trim()
  if (!nombre || !categoria) return
  const key = nombre.toLowerCase()
  if (catalogoActual.some(p => p.nombre.trim().toLowerCase() === key)) {
    throw new Error('duplicado')
  }
  const payload = {
    categoria,
    codigo: nextAgroCodigo(catalogoActual.map(p => p.codigo)),
    nombre,
    ia: input.ia.trim(),
    presentacion: input.presentacion.trim(),
    dosis_ha: input.dosis_ha.trim(),
    description: input.description.trim(),
    management: input.management.trim(),
  }
  await addDoc(catalogoRef(), payload)
}

/** Elimina un extra de Firestore. No borra productos del archivo. */
export async function deleteProducto(productoId: string): Promise<void> {
  if (!productoId || productoId.startsWith('static-')) return
  await deleteDoc(doc(db, CATALOGO_COLLECTION, productoId))
}

/**
 * Da de alta en Firestore los productos nuevos de una OC que ya tienen grupo
 * y no están en el catálogo unificado.
 */
export async function ensureExtrasEnCatalogo(
  productos: Array<ProductoCatalogoAlta>,
  catalogoActual: ProductoCatalogo[],
): Promise<void> {
  const porNombre = new Set(catalogoActual.map(p => p.nombre.trim().toLowerCase()))
  let siguiente = nextAgroCodigo(catalogoActual.map(p => p.codigo))
  const writes: Promise<unknown>[] = []

  for (const producto of productos) {
    const nombre = producto.nombre.trim()
    const categoria = producto.categoria.trim()
    if (!nombre || !categoria) continue
    const key = nombre.toLowerCase()
    if (porNombre.has(key)) continue
    porNombre.add(key)
    writes.push(
      addDoc(catalogoRef(), {
        categoria,
        codigo: siguiente,
        nombre,
        ia: producto.ia.trim(),
        presentacion: producto.presentacion.trim(),
        dosis_ha: producto.dosis_ha.trim(),
        description: producto.description.trim(),
        management: producto.management.trim(),
      }),
    )
    siguiente += 1
  }

  await Promise.all(writes)
}
