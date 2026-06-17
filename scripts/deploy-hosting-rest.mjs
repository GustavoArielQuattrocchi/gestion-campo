/**
 * Deploy a dist/ folder to Firebase Hosting sin firebase-tools (REST API).
 * Requiere una clave de cuenta de servicio de Firebase/Google Cloud.
 *
 * Uso:
 *   npm run build
 *   node scripts/deploy-hosting-rest.mjs ruta\a\firebase-sa.json
 *
 * O con variable de entorno:
 *   $env:GOOGLE_APPLICATION_CREDENTIALS=".\firebase-sa.json"
 *   node scripts/deploy-hosting-rest.mjs
 */
import { createHash, createSign } from 'node:crypto'
import { createGzip } from 'node:zlib'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = resolve(__dirname, '..')
const SCOPES = [
  'https://www.googleapis.com/auth/firebase',
  'https://www.googleapis.com/auth/firebase.hosting',
].join(' ')

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function resolveServiceAccountPath() {
  const arg = process.argv[2]
  if (arg) return resolve(arg)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  }
  const defaults = ['firebase-sa.json', 'service-account.json'].map((f) => resolve(ROOT, f))
  for (const path of defaults) {
    try {
      readFileSync(path)
      return path
    } catch {
      // try next
    }
  }
  throw new Error(
    'Falta la clave de cuenta de servicio.\n' +
      '  Firebase Console → Configuración → Cuentas de servicio → Generar nueva clave privada\n' +
      '  Guardá el JSON como firebase-sa.json y ejecutá:\n' +
      '  node scripts/deploy-hosting-rest.mjs .\\firebase-sa.json',
  )
}

function resolveSiteId() {
  if (process.env.FIREBASE_SITE_ID) return process.env.FIREBASE_SITE_ID
  try {
    const rc = readJson(resolve(ROOT, '.firebaserc'))
    return rc.projects?.default
  } catch {
    throw new Error('No se encontró .firebaserc ni FIREBASE_SITE_ID')
  }
}

async function gzipBuffer(buffer) {
  return new Promise((resolvePromise, reject) => {
    const chunks = []
    const gzip = createGzip()
    gzip.on('data', (chunk) => chunks.push(chunk))
    gzip.on('error', reject)
    gzip.on('end', () => resolvePromise(Buffer.concat(chunks)))
    gzip.end(buffer)
  })
}

function base64url(value) {
  return Buffer.from(value).toString('base64url')
}

async function getAccessToken(serviceAccountPath) {
  const key = readJson(serviceAccountPath)
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = base64url(
    JSON.stringify({
      iss: key.client_email,
      scope: SCOPES,
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }),
  )
  const unsigned = `${header}.${claim}`
  const signature = createSign('RSA-SHA256').update(unsigned).sign(key.private_key, 'base64url')
  const jwt = `${unsigned}.${signature}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(`OAuth token: ${data.error_description ?? data.error ?? res.status}`)
  }
  return data.access_token
}

function walkFiles(dir, base = dir) {
  const entries = readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkFiles(full, base))
    } else if (entry.isFile()) {
      const rel = relative(base, full).replace(/\\/g, '/')
      files.push({ diskPath: full, hostingPath: `/${rel}` })
    }
  }
  return files
}

function toApiHostingConfig(hosting) {
  const config = {}
  if (hosting.rewrites?.length) {
    config.rewrites = hosting.rewrites.map((r) => ({
      glob: r.source ?? r.glob,
      path: r.destination ?? r.path,
    }))
  }
  if (hosting.headers?.length) {
    config.headers = hosting.headers.map((h) => ({
      glob: h.source ?? h.glob,
      headers: h.headers,
    }))
  }
  return config
}

async function api(token, method, url, body) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data = {}
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }
  }
  if (!res.ok) {
    const msg = data.error?.message ?? data.raw ?? res.statusText
    throw new Error(`${method} ${url}\n→ ${msg}`)
  }
  return data
}

function chunkEntries(obj, size) {
  const entries = Object.entries(obj)
  const chunks = []
  for (let i = 0; i < entries.length; i += size) {
    chunks.push(Object.fromEntries(entries.slice(i, i + size)))
  }
  return chunks
}

async function main() {
  const serviceAccountPath = resolveServiceAccountPath()
  const siteId = resolveSiteId()
  const firebase = readJson(resolve(ROOT, 'firebase.json'))
  const publicDir = resolve(ROOT, firebase.hosting?.public ?? 'dist')

  console.log(`[deploy] Sitio: ${siteId}`)
  console.log(`[deploy] Carpeta: ${publicDir}`)

  const diskFiles = walkFiles(publicDir)
  if (diskFiles.length === 0) {
    throw new Error(`No hay archivos en ${publicDir}. Ejecutá npm run build primero.`)
  }

  console.log(`[deploy] Archivos: ${diskFiles.length}`)
  console.log('[deploy] Obteniendo token OAuth...')

  const token = await getAccessToken(serviceAccountPath)
  const hostingConfig = toApiHostingConfig(firebase.hosting ?? {})

  console.log('[deploy] Creando versión...')
  const version = await api(
    token,
    'POST',
    `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/versions`,
    Object.keys(hostingConfig).length ? { config: hostingConfig } : {},
  )
  const versionName = version.name
  const versionId = versionName.split('/').pop()
  console.log(`[deploy] Versión: ${versionId}`)

  const fileMap = {}
  const hashToGzip = new Map()

  for (const file of diskFiles) {
    const raw = readFileSync(file.diskPath)
    const gz = await gzipBuffer(raw)
    const hashHex = createHash('sha256').update(gz).digest('hex')
    fileMap[file.hostingPath] = hashHex
    hashToGzip.set(hashHex, gz)
  }

  const uploadHashes = new Set()
  let uploadUrl = ''

  for (const batch of chunkEntries(fileMap, 1000)) {
    console.log(`[deploy] Registrando ${Object.keys(batch).length} archivos...`)
    const populated = await api(
      token,
      'POST',
      `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/versions/${versionId}:populateFiles`,
      { files: batch },
    )
    uploadUrl = populated.uploadUrl ?? uploadUrl
    for (const h of populated.uploadRequiredHashes ?? []) {
      uploadHashes.add(h)
    }
  }

  if (uploadHashes.size > 0) {
    console.log(`[deploy] Subiendo ${uploadHashes.size} archivos nuevos...`)
    let i = 0
    for (const hash of uploadHashes) {
      const gz = hashToGzip.get(hash)
      if (!gz) {
        throw new Error(`Hash sin archivo local: ${hash}`)
      }
      const res = await fetch(`${uploadUrl}/${hash}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
        },
        body: gz,
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(`Upload ${hash}: ${res.status} ${err}`)
      }
      i += 1
      process.stdout.write(`\r[deploy] Subidos ${i}/${uploadHashes.size}`)
    }
    console.log('')
  } else {
    console.log('[deploy] Sin archivos nuevos que subir (reutiliza caché).')
  }

  console.log('[deploy] Finalizando versión...')
  await api(
    token,
    'PATCH',
    `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/versions/${versionId}?update_mask=status`,
    { status: 'FINALIZED' },
  )

  console.log('[deploy] Publicando release...')
  await api(
    token,
    'POST',
    `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/releases?versionName=${encodeURIComponent(versionName)}`,
  )

  console.log('')
  console.log('=== Deploy OK ===')
  console.log(`https://${siteId}.web.app`)
  console.log(`https://${siteId}.firebaseapp.com`)
  console.log(`Campo:      https://${siteId}.web.app/campo`)
  console.log(`Escritorio: https://${siteId}.web.app/escritorio`)
}

main().catch((err) => {
  console.error('\n[deploy] Error:', err.message)
  process.exit(1)
})
