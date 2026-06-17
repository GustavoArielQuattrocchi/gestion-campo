import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const rulesPath = resolve('firestore.rules')

console.log(`
=== Desplegar Firestore (sin Firebase CLI) ===

1. Abrí https://console.firebase.google.com
2. Proyecto: gestion-campo-ffe2d (o el tuyo en .firebaserc)
3. Firestore Database → Reglas
4. Pegá el contenido de: ${rulesPath}
5. Clic en "Publicar"

Índices compuestos:
- Firestore → Índices → "Agregar índice", o
- Usá el enlace que Firebase muestra en la consola del navegador si falla un filtro en /escritorio

Con CLI (cuando npm tenga red):
  npx firebase-tools login
  npx firebase-tools deploy --only firestore:rules,firestore:indexes

--- firestore.rules (copiar desde aquí) ---
`)
console.log(readFileSync(rulesPath, 'utf8'))
