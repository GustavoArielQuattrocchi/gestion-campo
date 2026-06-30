/**
 * Compara ids de mapa_vinedos.json con BASE_DATOS_FINCAS en fincas.ts.
 * Uso: node scripts/audit-cuadros-map-vs-catalog.mjs
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const mapJson = JSON.parse(readFileSync(resolve(root, 'src/data/mapa_vinedos.json'), 'utf8'))
const fincasSrc = readFileSync(resolve(root, 'src/data/fincas.ts'), 'utf8')

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
  return Number.isFinite(n) ? n : 0
}

function nombreFromDatos(id, datos) {
  const cuadro = datos.Cuadro ?? datos.cuadro
  if (cuadro) return `Cuartel ${cuadro}`
  return id
}

function variedadFromDatos(datos) {
  return datos.Variedad ?? datos.Cultivo ?? datos.variedad ?? '—'
}

function vinedoFromDatos(datos) {
  return datos['N° viñedo'] ?? datos['Nº viñedo'] ?? datos.Viñedo ?? '—'
}

// Extraer ids del catálogo actual (regex simple sobre fincas.ts)
const catalogIds = new Set()
const idRe = /\{\s*id:\s*"([^"]+)"/g
let m
while ((m = idRe.exec(fincasSrc)) !== null) {
  catalogIds.add(m[1])
}

const mapFeatures = mapJson.features
  .map(f => f.properties?.name)
  .filter(Boolean)

const mapIds = new Set(mapFeatures)
const mapOnly = [...mapIds].filter(id => !catalogIds.has(id)).sort()
const catalogOnly = [...catalogIds].filter(id => !mapIds.has(id)).sort()
const both = [...mapIds].filter(id => catalogIds.has(id)).sort()

console.log('=== Auditoría cuadros: mapa vs fincas.ts ===\n')
console.log(`Polígonos en mapa (ids únicos): ${mapIds.size}`)
console.log(`Cuadros en fincas.ts:            ${catalogIds.size}`)
console.log(`En ambos:                         ${both.length}`)
console.log(`Solo en mapa:                     ${mapOnly.length}`)
console.log(`Solo en catálogo:                 ${catalogOnly.length}`)

if (mapOnly.length > 0) {
  console.log('\n--- Solo en mapa (primeros 30) ---')
  mapOnly.slice(0, 30).forEach(id => console.log(`  ${id}`))
  if (mapOnly.length > 30) console.log(`  ... y ${mapOnly.length - 30} más`)
}

if (catalogOnly.length > 0) {
  console.log('\n--- Solo en catálogo ---')
  catalogOnly.forEach(id => console.log(`  ${id}`))
}

// Generar entradas sugeridas para map-only (stdout resumido)
const suggestions = mapOnly.map(id => {
  const feature = mapJson.features.find(f => f.properties?.name === id)
  const datos = parseDescripcion(feature?.properties?.description)
  const finca = getFincaPrefix(id) ?? '???'
  return {
    finca,
    entry: {
      id,
      nombre: nombreFromDatos(id, datos),
      variedad: variedadFromDatos(datos),
      vinedo: vinedoFromDatos(datos),
      hectareas: parseHectareas(datos.Hectareas),
      extras: Object.fromEntries(
        Object.entries(datos).filter(([k]) =>
          !['Cuadro', 'cuadro', 'Hectareas', 'Variedad', 'Cultivo', 'N° viñedo', 'Nº viñedo'].includes(k),
        ),
      ),
    },
  }
})

const outPath = resolve(root, 'scripts/.audit-cuadros-suggestions.json')
import { writeFileSync } from 'node:fs'
writeFileSync(outPath, JSON.stringify({ mapOnly, catalogOnly, suggestions }, null, 2), 'utf8')
console.log(`\nSugerencias completas: ${outPath}`)
