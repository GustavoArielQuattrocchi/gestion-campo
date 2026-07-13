/**
 * Consolida tareas en_progreso duplicadas (misma finca + labor + tipo).
 *
 * Uso:
 *   node scripts/consolidar-tareas-por-labor.mjs
 *   node scripts/consolidar-tareas-por-labor.mjs --dry-run
 *   node scripts/consolidar-tareas-por-labor.mjs ruta\a\firebase-sa.json
 *
 * Requiere cuenta de servicio (misma que deploy):
 *   $env:GOOGLE_APPLICATION_CREDENTIALS=".\firebase-sa.json"
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const dryRun = process.argv.includes('--dry-run')

function resolveServiceAccountPath() {
  const args = process.argv.filter(a => !a.startsWith('--'))
  const fileArg = args[2]
  if (fileArg) return resolve(fileArg)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  }
  for (const name of ['firebase-sa.json', 'service-account.json']) {
    const path = resolve(ROOT, name)
    try {
      readFileSync(path)
      return path
    } catch {
      /* try next */
    }
  }
  return null
}

const CREDENTIALS_HELP =
  'Falta la clave de cuenta de servicio para acceder a Firestore.\n\n' +
  'Opción A — archivo JSON (recomendado):\n' +
  '  1. Firebase Console → Configuración del proyecto → Cuentas de servicio\n' +
  '  2. «Generar nueva clave privada» y guardá el JSON\n' +
  '  3. Copialo como firebase-sa.json en la raíz del repo (no se sube a git)\n' +
  '  4. npm run consolidar:tareas:dry\n\n' +
  'Opción B — variable de entorno (PowerShell):\n' +
  '  $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\ruta\\a\\tu-clave.json"\n' +
  '  npm run consolidar:tareas:dry\n\n' +
  'Opción C — sin script: Escritorio → Trabajos en progreso → «Consolidar ahora»\n' +
  '  (usa tu sesión de Firebase en el navegador; mismo efecto para pocos duplicados).'

function initAdmin() {
  if (getApps().length > 0) return getFirestore()

  const saPath = resolveServiceAccountPath()
  if (!saPath) {
    throw new Error(CREDENTIALS_HELP)
  }

  const sa = JSON.parse(readFileSync(saPath, 'utf8'))
  initializeApp({
    credential: cert(sa),
    projectId: sa.project_id,
  })
  return getFirestore()
}

function laborTaskGroupKey(data) {
  const fincaId = String(data.fincaId ?? data.fincaNombre ?? '').trim()
  const tarea = String(data.tarea ?? '').trim()
  const tipo = String(data.tipo ?? '').trim()
  return `${fincaId}|${tarea}|${tipo}`.toLowerCase()
}

function getEjecutorLabel(data) {
  if (data.tipo === 'manual') return String(data.cuadrilla ?? '').trim()
  const persona = String(data.persona ?? '').trim()
  const maq = String(data.maquinaria ?? '').trim()
  const modelo = data.maquinariaModelo ? String(data.maquinariaModelo).trim() : ''
  if (modelo) return `${persona} · ${maq} (${modelo})`
  return `${persona} · ${maq}`
}

function inferEjecutorPorCuadro(data) {
  const label = getEjecutorLabel(data)
  const map = { ...(data.ejecutorPorCuadro ?? {}) }
  for (const id of data.cuadroIds ?? []) {
    if (id && !map[id]) map[id] = label
  }
  return map
}

function mergeEjecutorMaps(principal, duplicadas) {
  let merged = inferEjecutorPorCuadro(principal)
  for (const dup of duplicadas) {
    const dupMap = inferEjecutorPorCuadro(dup)
    merged = { ...merged, ...dupMap }
  }
  return merged
}

async function main() {
  let db
  try {
    db = initAdmin()
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }

  let snap
  try {
    snap = await db.collection('tareas').where('estado', '==', 'en_progreso').get()
  } catch (err) {
    const msg = String(err.message ?? err)
    if (
      err.code === 7 ||
      err.code === 'permission-denied' ||
      /credential|project id|authentication/i.test(msg)
    ) {
      console.error(CREDENTIALS_HELP)
      process.exit(1)
    }
    throw err
  }

  const tareas = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  const grupos = new Map()

  for (const t of tareas) {
    const key = laborTaskGroupKey(t)
    const arr = grupos.get(key) ?? []
    arr.push(t)
    grupos.set(key, arr)
  }

  let mergedCount = 0
  let gruposCount = 0

  for (const [key, group] of grupos) {
    if (group.length < 2) continue
    gruposCount += 1

    const sorted = [...group].sort((a, b) => {
      const ta = a.fechaInicio?.toDate?.()?.getTime?.() ?? a.fechaInicio?.seconds ?? 0
      const tb = b.fechaInicio?.toDate?.()?.getTime?.() ?? b.fechaInicio?.seconds ?? 0
      return ta - tb
    })

    const principal = sorted[0]
    const duplicadas = sorted.slice(1)

    const allCuadros = new Set(principal.cuadros ?? [])
    const allCuadroIds = new Set(principal.cuadroIds ?? [])
    const allFinalizados = new Set(principal.cuadroIdsFinalizados ?? [])
    const allRendimientos = [...(principal.rendimientosDiarios ?? [])]
    let maxPersonas = principal.tipo === 'manual' ? principal.cantidadPersonas ?? 0 : 0

    for (const dup of duplicadas) {
      for (const c of dup.cuadros ?? []) allCuadros.add(c)
      for (const id of dup.cuadroIds ?? []) allCuadroIds.add(id)
      for (const id of dup.cuadroIdsFinalizados ?? []) allFinalizados.add(id)
      for (const r of dup.rendimientosDiarios ?? []) allRendimientos.push(r)
      if (dup.tipo === 'manual') {
        maxPersonas = Math.max(maxPersonas, dup.cantidadPersonas ?? 0)
      }
    }

    const updateData = {
      cuadros: [...allCuadros],
      cuadroIds: [...allCuadroIds],
      ejecutorPorCuadro: mergeEjecutorMaps(principal, duplicadas),
    }
    if (allFinalizados.size > 0) {
      updateData.cuadroIdsFinalizados = [...allFinalizados]
    }
    if (allRendimientos.length > (principal.rendimientosDiarios?.length ?? 0)) {
      updateData.rendimientosDiarios = allRendimientos
      const last = allRendimientos[allRendimientos.length - 1]
      if (last?.texto) updateData.rendimiento = last.texto
    }
    if (principal.tipo === 'manual' && maxPersonas > (principal.cantidadPersonas ?? 0)) {
      updateData.cantidadPersonas = maxPersonas
    }

    console.log(`\n[${key}] principal=${principal.id} + ${duplicadas.length} duplicada(s)`)
    if (dryRun) {
      console.log('  (dry-run) update', principal.id, updateData)
      for (const dup of duplicadas) console.log('  (dry-run) delete', dup.id)
      mergedCount += duplicadas.length
      continue
    }

    await db.collection('tareas').doc(principal.id).update(updateData)

    for (const dup of duplicadas) {
      const partesSnap = await db.collection('partes_labores').where('tareaId', '==', dup.id).get()
      const batch = db.batch()
      partesSnap.forEach(parteDoc => {
        batch.update(parteDoc.ref, { tareaId: principal.id })
      })
      batch.delete(db.collection('tareas').doc(dup.id))
      await batch.commit()
      mergedCount += 1
      console.log(`  fusionada ${dup.id} → ${principal.id} (${partesSnap.size} parte(s))`)
    }
  }

  console.log(
    `\nListo. ${gruposCount} grupo(s), ${mergedCount} tarea(s) duplicada(s) ${dryRun ? 'simuladas' : 'consolidadas'}.`,
  )
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
