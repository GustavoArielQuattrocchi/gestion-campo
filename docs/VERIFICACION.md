# Checklist de verificación (producción / pre-deploy)



## Firebase Console



- [ ] **Authentication** → Inicio de sesión **anónimo** habilitado

- [ ] **Firestore → Reglas** → contenido de `firestore.rules` publicado (incluye `operadores`, `tareas`, `informes_accidente`)

- [ ] Colección `operadores` se crea al registrar nombre en `/campo/registro`

- [ ] Colección `tareas` recibe documentos nuevos

- [ ] Colección `informes_accidente` recibe documentos al enviar/descargar informe



## App Campo (`/campo`)



1. [ ] `/campo/inicio` → registrar nombre (aparece en Firestore `operadores/{uid}`)

2. [ ] Elegir finca → menú

3. [ ] Crear **tarea manual** con cuadros → documento en `tareas` con `cuadroIds`

4. [ ] Crear **tarea mecánica** (opcional)

5. [ ] **Finalizar** tarea con rendimiento → `estado: finalizada`, `fechaFin`

6. [ ] Recargar pestaña → vuelve al menú con sesión guardada

7. [ ] Informe de accidente → toast de confirmación + doc en `informes_accidente`

8. [ ] Errores de validación muestran **toast** (no solo banner)



## Escritorio (`/escritorio`)



1. [ ] Carga sin error de índice ni permisos

2. [ ] Filtros finca / tipo / estado actualizan URL y datos

3. [ ] Tarjetas de métricas abren modal con detalle

4. [ ] Mapa colorea cuadros de tareas activas

5. [ ] Panel Tareas + «Cargar más» si hay muchas filas



## Build y deploy



```bash

cp .env.example .env   # completar VITE_FIREBASE_*

npm run build

npm run deploy:cli     # o publicar dist/ manualmente

```



- [ ] `npm test` → todos los tests OK

- [ ] `npm run lint` → sin errores

- [ ] Hosting en `https://gestion-campo-ffe2d.web.app` responde `/campo` y `/escritorio`

- [ ] PWA: manifest accesible en `/manifest.webmanifest`


