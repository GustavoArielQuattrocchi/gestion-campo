/**
 * Reescribe nombres y unidades históricas de OC, turnos y extras del catálogo.
 *
 * Uso:
 *   npm run normalizar:productos        (dry-run)
 *   npm run normalizar:productos:apply
 */
import { catalogoDesdeArchivo } from '../src/data/agroQuimicos'
import {
  canonicalizarProducto,
  formatDosisHaCanon,
  resolverNombreCatalogo,
} from '../src/data/productoCatalogoAlias'
import { parseLeadingNumber } from '../src/modules/ordenesCura/utils/factor'
import { Timestamp, type DocumentReference, type Firestore } from 'firebase-admin/firestore'

const APPLY = process.argv.includes('--apply')
const catalogo = catalogoDesdeArchivo()

interface Cambio {
  where: string
  from: string
  to: string
}

function describeProducto(nombre: string, um: string, extra = ''): string {
  const base = `${nombre.trim() || '—'} [${um.trim() || 'sin UM'}]`
  return extra ? `${base} ${extra}` : base
}

async function commitInChunks(
  db: Firestore,
  refs: Array<{ ref: DocumentReference; data: Record<string, unknown> }>,
): Promise<number> {
  if (!APPLY || refs.length === 0) return 0
  const CHUNK = 400
  let written = 0
  for (let i = 0; i < refs.length; i += CHUNK) {
    const batch = db.batch()
    for (const item of refs.slice(i, i + CHUNK)) {
      batch.update(item.ref, item.data)
    }
    await batch.commit()
    written += Math.min(CHUNK, refs.length - i)
  }
  return written
}

export async function normalizarProductos(db: Firestore): Promise<Cambio[]> {
  const cambios: Cambio[] = []
  const itemUpdates: Array<{ ref: DocumentReference; data: Record<string, unknown> }> = []
  const turnoUpdates: Array<{ ref: DocumentReference; data: Record<string, unknown> }> = []
  const extraDeletes: DocumentReference[] = []

  const ordenesSnap = await db.collection('ordenesCura').get()
  for (const ordenDoc of ordenesSnap.docs) {
    const itemsSnap = await ordenDoc.ref.collection('items').get()
    for (const itemDoc of itemsSnap.docs) {
      const data = itemDoc.data()
      const canon = canonicalizarProducto(
        {
          nombre: String(data.producto ?? ''),
          presentacion: String(data.presentacion ?? ''),
          ia: String(data.ia ?? ''),
          dosisHa: parseLeadingNumber(String(data.dosis_ha ?? '')),
          dosisMaquinada: String(data.dosis_maquinada ?? ''),
        },
        catalogo,
      )
      if (!canon.changed) continue
      const dosisHa = formatDosisHaCanon(String(data.dosis_ha ?? ''), canon)
      cambios.push({
        where: `OC ${ordenDoc.id} item ${itemDoc.id}`,
        from: describeProducto(String(data.producto ?? ''), String(data.presentacion ?? '')),
        to: describeProducto(canon.nombre, canon.presentacion),
      })
      itemUpdates.push({
        ref: itemDoc.ref,
        data: {
          producto: canon.nombre,
          presentacion: canon.presentacion,
          ia: canon.ia,
          dosis_ha: dosisHa,
          dosis_maquinada: canon.dosisMaquinada || String(data.dosis_maquinada ?? ''),
        },
      })
    }
  }

  const turnosSnap = await db.collection('aplicacionesFitosanitarias').get()
  for (const turnoDoc of turnosSnap.docs) {
    const data = turnoDoc.data()
    const productos = Array.isArray(data.productos) ? data.productos : []
    let changed = false
    const next = productos.map((raw: Record<string, unknown>) => {
      const canon = canonicalizarProducto(
        {
          nombre: String(raw.producto ?? ''),
          presentacion: String(raw.presentacion ?? ''),
          ia: String(raw.ia ?? ''),
          gasto: typeof raw.gasto === 'number' ? raw.gasto : null,
          dosisHa: typeof raw.dosisHaReceta === 'number' ? raw.dosisHaReceta : null,
          dosisRealHa: typeof raw.dosisRealHa === 'number' ? raw.dosisRealHa : null,
          dosisMaquinada: String(raw.dosisMaquinada ?? ''),
        },
        catalogo,
      )
      if (canon.changed) changed = true
      return {
        ...raw,
        producto: canon.nombre,
        presentacion: canon.presentacion,
        ia: canon.ia || String(raw.ia ?? ''),
        gasto: canon.gasto,
        dosisHaReceta: canon.dosisHa,
        dosisRealHa: canon.dosisRealHa,
        dosisMaquinada: canon.dosisMaquinada || String(raw.dosisMaquinada ?? ''),
      }
    })
    if (!changed) continue
    const resumen = next.map((p: Record<string, unknown>) => `${p.producto} [${p.presentacion}]`).join(', ')
    cambios.push({
      where: `turno ${turnoDoc.id} (${String(data.oc ?? '')})`,
      from: productos.map((p: Record<string, unknown>) => `${p.producto} [${p.presentacion}]`).join(', '),
      to: resumen,
    })
    turnoUpdates.push({
      ref: turnoDoc.ref,
      data: {
        productos: next,
        updated_at: Timestamp.now(),
      },
    })
  }

  const extrasSnap = await db.collection('catalogoProductos').get()
  for (const extraDoc of extrasSnap.docs) {
    const data = extraDoc.data()
    const nombre = String(data.nombre ?? '')
    const match = resolverNombreCatalogo(nombre, catalogo)
    if (!match || match.nombre.trim().toLowerCase() === nombre.trim().toLowerCase()) continue
    cambios.push({
      where: `extra ${extraDoc.id}`,
      from: nombre,
      to: `(borrar, alias de ${match.nombre})`,
    })
    extraDeletes.push(extraDoc.ref)
  }

  if (APPLY) {
    await commitInChunks(db, itemUpdates)
    await commitInChunks(db, turnoUpdates)
    if (extraDeletes.length > 0) {
      const CHUNK = 400
      for (let i = 0; i < extraDeletes.length; i += CHUNK) {
        const batch = db.batch()
        for (const ref of extraDeletes.slice(i, i + CHUNK)) batch.delete(ref)
        await batch.commit()
      }
    }
  }

  return cambios
}
