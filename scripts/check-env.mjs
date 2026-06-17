import { existsSync } from 'node:fs'
import { loadEnv } from 'vite'

const REQUIRED = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

const env = loadEnv('production', process.cwd(), '')
const missing = REQUIRED.filter(key => !env[key]?.trim())

if (missing.length > 0) {
  console.error('Build de producción: faltan variables de entorno:')
  for (const key of missing) {
    console.error(`  - ${key}`)
  }
  if (!existsSync('.env')) {
    console.error('\nCopiá .env.example a .env y completá los valores de Firebase.')
  }
  process.exit(1)
}

console.log('[check-env] Variables de Firebase OK para build de producción.')
