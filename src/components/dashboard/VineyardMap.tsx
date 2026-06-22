import { useCallback, useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, LayersControl, useMap } from 'react-leaflet'
import type { LatLngBoundsExpression, Layer, PathOptions } from 'leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Feature, FeatureCollection } from 'geojson'
import type { Tarea } from '../../types'
import {
  buildNombreToIdMap,
  getAllVineyardFeatures,
  getFeaturesByFinca,
  getFincaBounds,
  getFincaPrefix,
  getGlobalBounds,
  parseDescripcion,
  type CuadroFeature,
  type CuadroFeatureProps,
} from '../../data/mapaData'
import { formatTareaMapLabel } from '../../utils/vineyardMapLabels'

interface Props {
  tareas: Tarea[]
  filtroFinca: string
  /** Ocupa el 100% del contenedor padre (dashboard fullscreen). */
  fullHeight?: boolean
}

interface CuadroEstado {
  enProgreso: Tarea[]
  finalizadas: Tarea[]
}

const DEFAULT_CENTER: [number, number] = [-33.505, -69.21]
const DEFAULT_ZOOM = 14

const CUADRO_FILL = '#9ca3af'
const CUADRO_STROKE = '#6b7280'

function FitBoundsOnFinca({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap()
  useEffect(() => {
    if (!bounds) return
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 17 })
  }, [bounds, map])
  return null
}

export default function VineyardMap({ tareas, filtroFinca, fullHeight = false }: Props) {
  const [seleccionado, setSeleccionado] = useState<CuadroFeature | null>(null)

  // Set de IDs (ej "FOA-5") con tareas en progreso o finalizadas.
  const estadoPorCuadro = useMemo(() => {
    const map = new Map<string, CuadroEstado>()
    const mappersPorFinca = new Map<string, Map<string, string>>()

    for (const tarea of tareas) {
      const fincaNombre = tarea.fincaNombre
      if (!fincaNombre) continue

      const cuadroIds = new Set<string>()
      for (const id of tarea.cuadroIds ?? []) {
        if (id) cuadroIds.add(id)
      }

      if ((tarea.cuadros ?? []).length > 0) {
        if (!mappersPorFinca.has(fincaNombre)) {
          mappersPorFinca.set(fincaNombre, buildNombreToIdMap(fincaNombre))
        }
        const mapper = mappersPorFinca.get(fincaNombre)!
        for (const cuadroNombre of tarea.cuadros ?? []) {
          const cuadroId = mapper.get(cuadroNombre)
          if (cuadroId) cuadroIds.add(cuadroId)
        }
      }

      for (const cuadroId of cuadroIds) {
        if (!map.has(cuadroId)) {
          map.set(cuadroId, { enProgreso: [], finalizadas: [] })
        }
        const entry = map.get(cuadroId)!
        if (tarea.estado === 'en_progreso') entry.enProgreso.push(tarea)
        else entry.finalizadas.push(tarea)
      }
    }
    return map
  }, [tareas])

  // Filtra features según finca seleccionada.
  const features = useMemo(() => {
    if (filtroFinca && filtroFinca !== 'todas') {
      return getFeaturesByFinca(filtroFinca)
    }
    return getAllVineyardFeatures()
  }, [filtroFinca])

  const geoJsonData = useMemo<FeatureCollection>(
    () => ({ type: 'FeatureCollection', features }),
    [features],
  )

  // Bounds para fitBounds cuando cambia la finca.
  const bounds = useMemo<LatLngBoundsExpression | null>(() => {
    const b =
      filtroFinca && filtroFinca !== 'todas'
        ? getFincaBounds(filtroFinca)
        : getGlobalBounds()
    if (!b || !isFinite(b.minLat)) return null
    return [
      [b.minLat, b.minLng],
      [b.maxLat, b.maxLng],
    ]
  }, [filtroFinca])

  const styleFeature = useCallback(
    (feature?: Feature, hover = false): PathOptions => {
      if (!feature) return {}
      const props = feature.properties as CuadroFeatureProps
      const estado = estadoPorCuadro.get(props.name)
      const enProgreso = (estado?.enProgreso.length ?? 0) > 0
      const finalizada = (estado?.finalizadas.length ?? 0) > 0

      let base: PathOptions
      if (enProgreso) {
        base = {
          fill: true,
          fillColor: CUADRO_FILL,
          fillOpacity: 0.7,
          color: '#ea580c',
          weight: 3,
          opacity: 1,
        }
      } else if (finalizada) {
        base = {
          fill: true,
          fillColor: CUADRO_FILL,
          fillOpacity: 0.6,
          color: '#16a34a',
          weight: 2.5,
          opacity: 1,
        }
      } else {
        base = {
          fill: true,
          fillColor: CUADRO_FILL,
          fillOpacity: 0.4,
          color: CUADRO_STROKE,
          weight: 1,
          opacity: 0.75,
        }
      }

      if (!hover) return base

      const weight = typeof base.weight === 'number' ? base.weight : 1
      return {
        ...base,
        fill: true,
        fillColor: CUADRO_FILL,
        weight: weight + 1,
        color: '#111827',
        fillOpacity: Math.min((base.fillOpacity ?? 0.4) + 0.15, 0.85),
      }
    },
    [estadoPorCuadro]
  )

  // Tooltip y click en cada feature.
  const onEachFeature = (feature: Feature, layer: Layer) => {
    const props = feature.properties as CuadroFeatureProps
    const datos = parseDescripcion(props.description)
    const variedad = datos['Variedad'] ?? datos['Cultivo'] ?? '—'
    const has = datos['Hectareas'] ?? '—'
    const tooltipHtml = `
      <div style="font-size:12px;line-height:1.35">
        <strong>${props.name}</strong><br/>
        ${variedad} · ${has} ha
      </div>
    `
    layer.bindTooltip(tooltipHtml, { sticky: true, direction: 'top' })

    layer.on('click', () => {
      setSeleccionado(feature as CuadroFeature)
    })

    const path = layer as L.Path
    path.setStyle(styleFeature(feature))

    layer.on('mouseover', (e) => {
      const target = e.target as L.Path
      target.setStyle(styleFeature(feature, true))
      target.bringToFront()
    })

    layer.on('mouseout', (e) => {
      const target = e.target as L.Path
      target.setStyle(styleFeature(feature))
    })
  }

  // Forzamos re-render del GeoJSON cuando cambia el set de features o el estado.
  const geoKey = useMemo(() => {
    const enProg = Array.from(estadoPorCuadro.entries())
      .filter(([, v]) => v.enProgreso.length > 0)
      .map(([k]) => k)
      .sort()
      .join(',')
    return `${filtroFinca}|${features.length}|${enProg}`
  }, [filtroFinca, features, estadoPorCuadro])

  const detallesSeleccion = useMemo(() => {
    if (!seleccionado) return null
    const props = seleccionado.properties
    return {
      name: props.name,
      finca: getFincaPrefix(props.name) ?? '—',
      datos: parseDescripcion(props.description),
      estado: estadoPorCuadro.get(props.name),
    }
  }, [seleccionado, estadoPorCuadro])

  return (
    <div
      className={`map-container ${fullHeight ? 'map-container--fill' : ''} ${detallesSeleccion ? 'with-detail' : ''}`}
    >
      <div className="map-wrapper">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: fullHeight ? '100%' : 500, width: '100%' }}
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Satélite">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles &copy; Esri"
                maxZoom={19}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Calles (OSM)">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap"
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          <GeoJSON
            key={geoKey}
            data={geoJsonData}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />

          <FitBoundsOnFinca bounds={bounds} />
        </MapContainer>

        <div className="map-legend">
          <div className="map-legend-title">Estado de cuadros</div>
          <div className="map-legend-item">
            <span className="legend-swatch" style={{ borderColor: '#ea580c', borderWidth: 3 }} />
            <span>Tarea en progreso</span>
          </div>
          <div className="map-legend-item">
            <span className="legend-swatch" style={{ borderColor: '#16a34a' }} />
            <span>Tarea finalizada</span>
          </div>
          <div className="map-legend-item">
            <span className="legend-swatch" style={{ borderColor: '#9ca3af' }} />
            <span>Sin actividad</span>
          </div>
        </div>
      </div>

      {detallesSeleccion && (
        <aside className="map-detail">
          <header>
            <div>
              <div className="map-detail-name">{detallesSeleccion.name}</div>
              <div className="map-detail-finca">Finca {detallesSeleccion.finca}</div>
            </div>
            <button className="map-detail-close" onClick={() => setSeleccionado(null)}>
              ×
            </button>
          </header>

          <dl className="map-detail-grid">
            {Object.entries(detallesSeleccion.datos).map(([k, v]) => (
              <div key={k} className="map-detail-row">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>

          {detallesSeleccion.estado && (
            <div className="map-detail-tasks">
              {detallesSeleccion.estado.enProgreso.length > 0 && (
                <div className="map-detail-section">
                  <h4>En progreso ({detallesSeleccion.estado.enProgreso.length})</h4>
                  <ul>
                    {detallesSeleccion.estado.enProgreso.map((t) => (
                      <li key={t.id}>{formatTareaMapLabel(t)}</li>
                    ))}
                  </ul>
                </div>
              )}
              {detallesSeleccion.estado.finalizadas.length > 0 && (
                <div className="map-detail-section">
                  <h4>Finalizadas ({detallesSeleccion.estado.finalizadas.length})</h4>
                  <ul>
                    {detallesSeleccion.estado.finalizadas.slice(0, 5).map((t) => (
                      <li key={t.id}>{formatTareaMapLabel(t)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </aside>
      )}
    </div>
  )
}
