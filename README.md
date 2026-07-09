# Gestión de Campo

Aplicación web para la gestión operativa de labores agrícolas en viñedos y fincas. Permite registrar tareas desde el campo, cerrar partes diarios, visualizar avance en un mapa interactivo y analizar productividad desde un escritorio administrativo.

**Producción:** https://gestion-campo-ffe2d.web.app

---

## Módulos principales

| Módulo | Ruta | Usuario | Descripción |
|--------|------|---------|-------------|
| **App Campo** | `/campo` | Operadores en terreno | Registro de tareas, cierre del día, informes de accidente |
| **Escritorio** | `/escritorio` | Administración | Dashboard, mapa, métricas, indicadores, seguridad |
| **Órdenes de Cura** | `/ordenes-de-cura` | Administración | Generación y gestión de órdenes de curación (PDF) |
| **Ficha de cuadro** | `/cuadro/:fincaId/:cuadroId` | Público (QR) | Resumen del cuadro y tareas asociadas |

---

## Funcionalidades

### App Campo (móvil / PWA)

- **Sesión de operador** con autenticación anónima de Firebase vinculada a nombre y finca.
- **Tareas manuales** (cuadrilla, personas, cuadros) y **mecánicas** (maquinaria, persona, cuadros).
- **Continuidad de tarea:** si existe una labor activa en la misma finca + cuadrilla + tipo de labor, se ofrece continuarla en lugar de crear un duplicado.
- **Cierre del día (parte de labores):**
  - Rendimiento numérico con unidad por defecto según tipo de labor.
  - Horario de inicio/fin y observaciones.
  - Checklist de cuadros trabajados con opción de marcar finalizados.
  - Rendimiento opcional por cuadro individual.
  - Captura automática de clima (Open-Meteo) al abrir el formulario.
  - Checkbox «terminar tarea» solo habilitado cuando todos los cuadros están finalizados.
- **Panel de jornada** en el menú: tareas activas con avance, acceso rápido a cierre del día.
- **Informes de accidente** con foto y generación de PDF en el dispositivo.
- **Modo offline:** Firestore con caché persistente + service worker; sincronización al recuperar red.
- **Instalable como PWA** (Safari → Agregar a pantalla de inicio en iPhone).

### Escritorio (dashboard)

- **Mapa de viñedos** (Leaflet) con polígonos por cuadro, filtros por finca/tipo/estado.
  - Vista **Estado:** cuadros en progreso, pendientes o finalizados.
  - Vista **Rendimiento:** mapa de calor por hectárea según rendimiento acumulado por cuadro.
- **Métricas en tiempo real:** tareas totales, en progreso, finalizadas, personas, rendimiento.
- **Modales de detalle:** tareas en progreso, partes de labores, métricas individuales.
- **Gestión de cuadros:** finalizar / deshacer finalización desde el mapa o tabla.
- **Consolidación de tareas duplicadas** (misma finca + labor + cuadrilla).
- **Eliminación de tareas** (solo admin).
- **Códigos QR** por cuadro para acceso a ficha pública.
- **Indicadores (analytics)** — 5 pestañas con gráficos Recharts:
  - *Productividad:* rendimiento diario por unidad, promedio por labor.
  - *Dotación:* personas por día, rendimiento por persona.
  - *Avance:* hectáreas acumuladas, avance por finca.
  - *Indicadores:* operadores activos, partes/día, días para completar, uso de maquinaria.
  - *Timeline:* cronograma Gantt de labores con % de avance.
- **Seguridad:** panel de informes de accidente con filtros por finca y fecha.
- **Filtros en URL** compartibles: `/escritorio?finca=FOA&tipo=manual&estado=en_progreso`.

### Órdenes de Cura

- Editor de órdenes con catálogo de productos, cálculo de factores, numeración automática (`OC-FINCA-AÑO-NNN`).
- Exportación a PDF y listado histórico.
- Vinculación desde tareas mecánicas de curación (`ordenCuraRef`).

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 19, TypeScript, Vite 5 |
| Routing | React Router 7 |
| Backend / DB | Firebase (Auth, Firestore, Hosting) |
| Mapas | Leaflet + react-leaflet |
| Gráficos | Recharts 3 |
| PDF | jsPDF |
| Iconos | lucide-react |
| Fechas | date-fns |
| Tests | Node.js test runner (87 tests) |
| Lint | ESLint 9 |

---

## Requisitos previos

- Node.js 18+
- Proyecto Firebase con **Firestore**, **Authentication** y **Hosting** habilitados
- Para escritorio: usuario admin con email `@salentein.com` verificado

---

## Configuración

### 1. Variables de entorno

```bash
cp .env.example .env
```

Completar en `.env`:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

> En desarrollo sin `.env`, la app usa valores de respaldo del proyecto demo. En `npm run build`, las variables son obligatorias (`scripts/check-env.mjs`).

### 2. Firebase Authentication

| Método | Uso |
|--------|-----|
| **Anónimo** | App Campo — operadores en terreno |
| **Email/contraseña** | Escritorio y Órdenes de Cura — admins `@salentein.com` verificados |

### 3. Firestore — colecciones

| Colección | Descripción |
|-----------|-------------|
| `operadores/{uid}` | Nombre del operador vinculado al uid de auth anónima |
| `tareas/{id}` | Tareas manuales y mecánicas con avance multi-día |
| `partes_labores/{id}` | Partes diarios cerrados desde campo |
| `informes_accidente/{id}` | Metadatos de informes (PDF generado en cliente) |
| `ordenes_cura/{id}` | Órdenes de curación |
| `catalogo_cura/{id}` | Catálogo de productos fitosanitarios |
| `contadores_oc/{fincaId}` | Numeración secuencial de órdenes de cura |

### 4. Reglas e índices

```bash
# Imprimir reglas para copiar en Firebase Console
npm run deploy:firestore

# O con CLI
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

Reglas destacadas:
- Operadores móviles solo crean/modifican sus propias tareas o continúan tareas activas de su cuadrilla.
- Cualquier operador de la cuadrilla puede cerrar el día de una tarea ajena.
- Admins (`esAdmin`) tienen lectura/escritura completa en tareas, partes y consolidación.
- Lectura de `informes_accidente` restringida a admins.

Si el dashboard muestra error de índice, abrir el enlace que Firebase incluye en la consola del navegador.

---

## Instalación y desarrollo

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 87 tests
npm run lint
npm run build      # requiere .env completo
```

Checklist manual pre-deploy: [docs/VERIFICACION.md](docs/VERIFICACION.md)

---

## Deploy

```bash
# Hosting solamente
npm run deploy:cli

# Hosting + reglas Firestore
npm run build
npx firebase-tools deploy --only hosting,firestore:rules

# Script alternativo (REST, requiere firebase-sa.json)
npm run deploy
```

---

## Rutas

### App Campo

| Ruta | Pantalla |
|------|----------|
| `/campo` | Redirige a menú o inicio según sesión |
| `/campo/inicio` | Pantalla de bienvenida |
| `/campo/registro` | Nombre del operador |
| `/campo/finca` | Selector de finca |
| `/campo/menu` | Menú principal + panel de jornada |
| `/campo/tarea/tipo` | Manual o mecánica |
| `/campo/tarea/manual` | Formulario tarea manual |
| `/campo/tarea/mecanica` | Formulario tarea mecánica |
| `/campo/finalizar` | Lista de tareas pendientes de cierre |
| `/campo/finalizar/:tareaId` | Cierre del día |
| `/campo/informe` | Informe de accidente |
| `/campo/exito` | Confirmación con acciones siguientes |

### Escritorio y otros

| Ruta | Pantalla |
|------|----------|
| `/escritorio` | Dashboard (requiere login admin) |
| `/ordenes-de-cura` | Módulo de órdenes de cura |
| `/cuadro/:fincaId/:cuadroId` | Ficha pública del cuadro (QR) |

---

## Modelo de datos — Tarea

Cada documento en `tareas` incluye:

```typescript
{
  fincaId, fincaNombre, tarea, tipo: 'manual' | 'mecanica',
  cuadros: string[],           // nombres legibles
  cuadroIds?: string[],         // IDs del catálogo (ej. "FOA-5")
  cuadroIdsFinalizados?: string[],
  cuadroFinalizaciones?: [{ cuadroId, fecha, operador }],
  estado: 'en_progreso' | 'finalizada',
  operador, fechaInicio, fechaFin?,
  rendimiento?: string,          // último rendimiento (texto)
  rendimientosDiarios?: [{       // historial de cierres diarios
    fecha, texto, operador,
    cantidad?, unidad?,          // hileras | jornal | claros | plantas
    parteId?, horaInicio?, horaFin?, observaciones?,
    rendimientoPorCuadro?: Record<cuadroId, number>,
    clima?: { temperatureMax, temperatureMin, precipitation, windSpeedMax, weatherCode }
  }],
  // manual: cuadrilla, cantidadPersonas
  // mecánica: persona, maquinaria, maquinariaModelo?, ordenCuraRef?
}
```

El avance porcentual se calcula sobre **hectáreas totales de la finca** (solo cuadros productivos: viñedos y nogal).

---

## Estructura del proyecto

```
src/
├── components/
│   ├── mobile/              # App Campo (formularios, menú, informes)
│   ├── dashboard/           # Escritorio (mapa, métricas, analytics, seguridad)
│   │   └── charts/          # Gráficos Recharts (Bar, Line, Gantt)
│   ├── auth/                # AdminGate (login escritorio)
│   ├── cuadro/              # Ficha pública de cuadro
│   └── qr/                  # Generación de códigos QR
├── pages/
│   ├── MobileApp.tsx
│   ├── Dashboard.tsx
│   └── CuadroPublicPage.tsx
├── modules/
│   └── ordenesCura/         # Módulo de órdenes de curación
├── contexts/
│   └── MobileAppContext.tsx # Estado global app campo
├── hooks/
│   ├── useDashboardTareas.ts
│   ├── usePartesLabores.ts
│   ├── useInformesAccidente.ts
│   └── useCuadroTareas.ts
├── utils/
│   ├── parseTarea.ts
│   ├── analyticsAggregations.ts
│   ├── tareaProgress.ts
│   ├── findTareaContinuable.ts
│   ├── consolidarTareas.ts
│   ├── weatherService.ts
│   ├── buildParteDeLaboresPayload.ts
│   └── dashboardFilters.ts
├── data/
│   ├── catalog.ts           # Fincas, cuadrillas, labores, cuadros
│   ├── fincaData.ts         # Catálogo unificado + mapa KML
│   ├── laborUnits.ts        # Unidad por defecto por labor
│   └── mapaData.ts          # GeoJSON de polígonos
├── validation/              # Validación de payloads móvil
├── providers/
│   └── AuthProvider.tsx
├── firebase.ts
└── types.ts
```

---

## Scripts útiles

```bash
npm run audit:cuadros    # Auditar diferencias catálogo vs mapa
npm run sync:cuadros     # Sincronizar catálogo desde mapa KML
npm run preview          # Preview del build de producción
```

---

## Changelog reciente

| Commit | Descripción |
|--------|-------------|
| `d8b4721` | Analytics (5 pestañas + Recharts), panel seguridad, clima Open-Meteo, rendimiento por cuadro, mapa de calor, mejoras UX móvil |
| `86bfd88` | Consolidación de tareas duplicadas en dashboard |
| `3223779` | Fix avance acumulado multi-día (continuidad de tarea, cuadroIdsFinalizados) |
| `0c5c585` | Eliminación de tareas desde escritorio |
| `8304c47` | Auth admin, rendimiento estructurado, gestión de partes de labores |
| `efae359` | QR por cuadro, catálogo unificado con datos KML |

---

## Licencia

Proyecto privado — Salentein.
