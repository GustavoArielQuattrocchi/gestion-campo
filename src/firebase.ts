import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore'

const DEV_FALLBACKS = {
  apiKey: 'AIzaSyBtnzRh7cexw8Z-TTi08vxfU7yEbB5r660',
  authDomain: 'gestion-campo-ffe2d.firebaseapp.com',
  projectId: 'gestion-campo-ffe2d',
  storageBucket: 'gestion-campo-ffe2d.firebasestorage.app',
  messagingSenderId: '977318874877',
  appId: '1:977318874877:web:9383ece9ba2d81fe6f7894',
} as const

function firebaseEnv(key: keyof ImportMetaEnv, devFallback?: string): string {
  const value = (import.meta.env[key] as string | undefined)?.trim()
  if (value) return value
  if (import.meta.env.DEV && devFallback) return devFallback
  throw new Error(
    `Falta ${key}. Copiá .env.example a .env y completá la configuración de Firebase.`,
  )
}

const firebaseConfig = {
  apiKey: firebaseEnv('VITE_FIREBASE_API_KEY', DEV_FALLBACKS.apiKey),
  authDomain: firebaseEnv('VITE_FIREBASE_AUTH_DOMAIN', DEV_FALLBACKS.authDomain),
  projectId: firebaseEnv('VITE_FIREBASE_PROJECT_ID', DEV_FALLBACKS.projectId),
  storageBucket: firebaseEnv('VITE_FIREBASE_STORAGE_BUCKET', DEV_FALLBACKS.storageBucket),
  messagingSenderId: firebaseEnv(
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    DEV_FALLBACKS.messagingSenderId,
  ),
  appId: firebaseEnv('VITE_FIREBASE_APP_ID', DEV_FALLBACKS.appId),
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

/** Caché local persistente: lecturas y escrituras funcionan sin red y se sincronizan al volver. */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
})
