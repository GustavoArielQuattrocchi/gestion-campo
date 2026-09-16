/**
 * Reescribe nombres y unidades históricas de productos fitosanitarios.
 *
 *   npm run normalizar:productos
 *   npm run normalizar:productos:apply
 */
import { rmSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as esbuild from 'esbuild'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const APPLY = process.argv.includes('--apply')

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
  'Falta la clave de cuenta de servicio (firebase-sa.json) para leer Firestore.'

function initAdmin() {
  if (getApps().length > 0) return getFirestore()
  const saPath = resolveServiceAccountPath()
  if (!saPath) throw new Error(CREDENTIALS_HELP)
  const sa = JSON.parse(readFileSync(saPath, 'utf8'))
  initializeApp({ credential: cert(sa), projectId: sa.project_id })
  return getFirestore()
}

const outfile = join(ROOT, 'scripts', '.normalizar-productos.bundle.mjs')

try {
  await esbuild.build({
    absWorkingDir: ROOT,
    entryPoints: ['scripts/normalizar-productos-fitosanitarios.ts'],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    packages: 'external',
  })
  const mod = await import(`${pathToFileURL(outfile).href}?t=${Date.now()}`)
  const db = initAdmin()
  const cambios = await mod.normalizarProductos(db)
  if (cambios.length === 0) {
    console.log('Nada para unificar: nombres y unidades ya coinciden con el catálogo.')
  } else {
    console.log(`${APPLY ? 'Aplicado' : 'Dry-run'}: ${cambios.length} cambio(s).`)
    for (const c of cambios) {
      console.log(`- ${c.where}: ${c.from} → ${c.to}`)
    }
    if (!APPLY) {
      console.log('\nSin escribir. Para aplicar: npm run normalizar:productos:apply')
    }
  }
} finally {
  try {
    rmSync(outfile, { force: true })
  } catch {
    /* ignore */
  }
}
