/**
 * Genera src/data/cuadrosCatalogoMapa.ts desde mapa_vinedos.json.
 * Ejecutar tras actualizar el GeoJSON: node scripts/sync-cuadros-catalog-from-mapa.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const FINCA_PREFIXES = ['FOA', 'FLP', 'FSP', 'FET', 'FC2', 'FC3']

function getFincaPrefix(name) {
  for (const p of FINCA_PREFIXES) {
    if (name.startsWith(`${p}-`)) return p
  }
  return null
}

function parseDescripcion(description) {
  if (!description) return {}
  const result = {}
  for (const line of description.split('\n').map(l => l.trim()).filter(Boolean)) {
    const idx = line.indexOf(':')
    if (idx <= 0) continue
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    if (key && value) result[key] = value
  }
  return result
}

function parseHectareas(raw) {
  if (!raw) return 0
  const n = Number(String(raw).replace(',', '.'))
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
}

function nombreFromDatos(id, datos) {
  const cuadro = datos.Cuadro ?? datos.cuadro
  if (cuadro) return `Cuartel ${cuadro}`
  const suffix = id.includes('-') ? id.slice(id.indexOf('-') + 1) : id
  return `Cuartel ${suffix}`
}

function variedadFromDatos(datos) {
  return datos.Variedad ?? datos.Cultivo ?? datos.variedad ?? '—'
}

function vinedoFromDatos(datos) {
  const v = datos['N° viñedo'] ?? datos['Nº viñedo'] ?? datos.Viñedo ?? ''
  return v.replace(/^B-/i, 'B').replace(/^C-/i, 'C') || '—'
}

const CORE_KEYS = new Set([
  'Cuadro', 'cuadro', 'Hectareas', 'Variedad', 'Cultivo', 'variedad',
  'N° viñedo', 'Nº viñedo', 'Viñedo',
])

function extrasFromDatos(datos) {
  const extras = {}
  for (const [k, v] of Object.entries(datos)) {
    if (!CORE_KEYS.has(k) && v) extras[k] = v
  }
  return extras
}

function buildEntry(id, description) {
  const datos = parseDescripcion(description)
  const extras = extrasFromDatos(datos)
  const entry = {
    id,
    nombre: nombreFromDatos(id, datos),
    variedad: variedadFromDatos(datos),
    vinedo: vinedoFromDatos(datos),
    hectareas: parseHectareas(datos.Hectareas),
  }
  if (Object.keys(extras).length > 0) {
    return { ...entry, extras }
  }
  return entry
}

const mapJson = JSON.parse(readFileSync(resolve(root, 'src/data/mapa_vinedos.json'), 'utf8'))
const byFinca = {}

for (const feature of mapJson.features) {
  const id = feature.properties?.name
  if (!id) continue
  const finca = getFincaPrefix(id)
  if (!finca) continue
  if (!byFinca[finca]) byFinca[finca] = []
  const desc = feature.properties?.description
  const existing = byFinca[finca].find(c => c.id === id)
  if (!existing) {
    byFinca[finca].push(buildEntry(id, desc))
  }
}

for (const finca of Object.keys(byFinca)) {
  byFinca[finca].sort((a, b) => a.id.localeCompare(b.id, 'es'))
}

const total = Object.values(byFinca).reduce((n, arr) => n + arr.length, 0)

const header = `/**
 * Catálogo de cuadros generado desde mapa_vinedos.json.
 * NO editar a mano — ejecutar: node scripts/sync-cuadros-catalog-from-mapa.mjs
 */
import type { CuadroCatalogo } from './fincas'

export const CUADROS_CATALOGO_MAPA: Record<string, CuadroCatalogo[]> = `

const body = JSON.stringify(byFinca, null, 2)
  .replace(/"([^"]+)":/g, '$1:')
  .replace(/"/g, "'")

// JSON.stringify uses double quotes - need proper TS format
const tsBody = JSON.stringify(byFinca, null, 2)

const out = `${header}${tsBody} as Record<string, CuadroCatalogo[]>\n`

writeFileSync(resolve(root, 'src/data/cuadrosCatalogoMapa.ts'), out, 'utf8')
console.log(`Generado cuadrosCatalogoMapa.ts — ${total} cuadros en ${Object.keys(byFinca).length} fincas`)
