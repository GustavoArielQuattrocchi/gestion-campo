# Gestión de Campo

Aplicación de gestión de tareas agrícolas con dos interfaces:

- **App Campo** (`/campo`) — Interfaz móvil para registrar y finalizar tareas en el campo
- **Escritorio** (`/escritorio`) — Dashboard con resumen detallado, indicadores y filtros

## Requisitos previos

- Node.js 18+
- Cuenta de Firebase con Firestore y Authentication habilitados

## Configuración de Firebase

1. Ir a [Firebase Console](https://console.firebase.google.com)
2. Crear un proyecto nuevo o usar uno existente
3. En **Firestore Database** → Crear base de datos
4. En **Authentication** → **Sign-in method** → Habilitar **Inicio de sesión anónimo**
5. En **Configuración del proyecto** → **SDK**, copiar los valores de configuración
6. Copiar `.env.example` a `.env` y completar las variables `VITE_FIREBASE_*`

> En desarrollo, si no hay `.env`, la app usa valores de respaldo del proyecto demo. En producción (`npm run build`) las variables son obligatorias.

### Reglas e índices de Firestore

- **Auth anónima** obligatoria para leer/escribir.
- Colección **`operadores/{uid}`**: vincula el nombre del operador al dispositivo (uid de Firebase Auth).
- **`tareas`**: solo puede crear tareas quien tenga operador registrado y coincida el campo `operador`; solo puede finalizar tareas que creó esa sesión.
- **`informes_accidente`**: metadatos del informe (operador, finca, descripción, si hay foto). El PDF sigue generándose en el dispositivo.

**Desplegar reglas (sin instalar nada extra):**

```bash
npm run deploy:firestore
```

Eso imprime el contenido de `firestore.rules` para copiarlo en [Firebase Console](https://console.firebase.google.com) → Firestore → **Reglas** → Publicar.

**Índices:** si `/escritorio` muestra error de índice al filtrar, abrí el enlace que Firebase pone en la consola del navegador (crea el índice con un clic).

**Con CLI** (opcional, requiere red estable):

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

> Después de actualizar reglas, recargá la app. Si el dashboard muestra error de índice, ejecutá `npm run deploy:firestore`.

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Tests

```bash
npm test
npm run lint
```

Checklist manual pre-deploy: [docs/VERIFICACION.md](docs/VERIFICACION.md)

## Build

Requiere `.env` con todas las variables `VITE_FIREBASE_*` (el script `check-env` valida antes de compilar).

```bash
npm run build
```

En el hosting/CI, configurá las mismas variables como secrets del entorno.

## Deploy (Firebase Hosting)

```bash
npm run deploy:cli    # build + firebase deploy --only hosting
# o sin CLI global:
npm run deploy        # build + script REST (requiere firebase-sa.json)
```

URL de producción: `https://gestion-campo-ffe2d.web.app`

Después de cambiar `firestore.rules`, publicá de nuevo las reglas en Firebase Console (colección `informes_accidente` incluida).

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/campo` | App móvil — redirige a inicio o menú según sesión |
| `/campo/menu` | Menú principal de tareas |
| `/campo/tarea/manual` | Crear tarea manual |
| `/campo/finalizar` | Finalizar tareas en progreso |
| `/escritorio` | Dashboard de gestión (PC) |
| `/escritorio?finca=...&tipo=manual&estado=en_progreso` | Dashboard con filtros en la URL (compartible) |

La app móvil recuerda operador y finca en `sessionStorage` hasta cerrar la pestaña o volver al inicio.

El dashboard lee la colección `tareas` en tiempo real, **filtra y ordena en el cliente** (evita índices compuestos) y pagina la tabla en memoria (100 + **Cargar más**). Las métricas usan el total filtrado.

La app es instalable como **PWA** (`manifest.webmanifest` + service worker en producción). En iPhone: Safari → Compartir → «Agregar a pantalla de inicio».

### Modo offline (campo)

- **Firestore** usa caché persistente local: crear/finalizar tareas e informes se guardan en el dispositivo sin señal y se sincronizan al volver la red.
- El **service worker** cachea la app (JS/CSS) tras la primera visita con conexión.
- **Requisito:** abrir la app **al menos una vez con internet** (auth anónima + registro de operador).
- Sin conexión aparece un banner naranja; los cambios pendientes muestran toast al sincronizar.

## Estructura del proyecto

```
src/
├── components/
│   ├── mobile/           # Componentes de la app de campo
│   └── dashboard/        # Sidebar, mapa, métricas
├── pages/
│   ├── MobileApp.tsx     # Orquestador de la app de campo
│   └── Dashboard.tsx     # Dashboard de escritorio
├── providers/
│   └── AuthProvider.tsx  # Sesión anónima de Firebase
├── hooks/
│   └── useDashboardTareas.ts
├── utils/
│   ├── parseTarea.ts
│   ├── dashboardMetrics.ts
│   └── getMetricDetail.ts
├── data/
│   └── catalog.ts        # Fincas, cuadrillas, tareas, cuadros
├── firebase.ts
└── types.ts
```

## Modelo de tareas en Firestore

Cada documento en `tareas` incluye:

- `cuadros`: nombres legibles (ej. "Cuartel 5")
- `cuadroIds`: IDs del catálogo (ej. "FOA-5") — usados por el mapa del dashboard

Las tareas creadas antes de esta versión siguen funcionando; el mapa intenta resolver cuadros por nombre como respaldo.
