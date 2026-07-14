import { useCallback, useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, LayersControl, useMap } from 'react-leaflet'
import type { LatLngBoundsExpression, Layer, PathOptions } from 'leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Feature, FeatureCollection } from 'geojson'
import type { Tarea } from '../../types'
import {
  getAllVineyardFeatures,
  getFeaturesByFinca,
  getFincaBounds,
  getFincaPrefix,
  getGlobalBounds,
  type CuadroFeature,
  type CuadroFeatureProps,
} from '../../data/mapaData'
import { getCuadroDetalleById } from '../../data/fincaData'
import { formatHectareas } from '../../utils/cuadroQr'
import CuadroCatalogoResumen from '../cuadro/CuadroCatalogoResumen'
import { formatTareaMapLabel } from '../../utils/vineyardMapLabels'
import { filterTareasForMap } from '../../utils/mapTaskFilter'
import { buildEstadoPorCuadro, buildEstadoPorCuadroParaMapa } from '../../utils/vineyardMapState'
import { computeTareaProgress, formatProgressLabel } from '../../utils/tareaProgress'
import TaskProgressBar from './TaskProgressBar'
// map-relevamiento: imports de la feature (ver src/features/mapRelevamiento/config.ts)
import { isMapRelevamientoEnabled } from '../../features/mapRelevamiento'
import type { MapRelevamientoActions } from '../../features/mapRelevamiento'
import MapRelevamientoPanel from '../../features/mapRelevamiento/components/MapRelevamientoPanel'

interface Props {
  tareas: Tarea[]
  filtroFinca: string
  /** Labor visible en el mapa; no afecta datos globales del escritorio. */
  filtroTarea?: string
  /** Ocupa el 100% del contenedor padre (dashboard fullscreen). */
  fullHeight?: boolean
  /** map-relevamiento: tareas sin filtrar para asignación / conflictos. */
  allTareas?: Tarea[]
  mapRelevamiento?: MapRelevamientoActions | null
  /** Tras asignar labor desde el mapa, alinear filtro de labor para ver el cambio. */
  onLaborAsignada?: (labor: string) => void
}

const DEFAULT_CENTER: [number, number] = [-33.505, -69.21]
const DEFAULT_ZOOM = 14

const CUADRO_FILL = '#9ca3af'
const CUADRO_STROKE = '#6b7280'
const CUADRO_MULTI_FILL = '#ddd6fe'
const CUADRO_MULTI_STROKE = '#7c3aed'

/** Interpolates red→yellow→green based on ratio 0..1. */
function heatColor(ratio: number): string {
  const clamped = Math.max(0, Math.min(1, ratio))
  if (clamped < 0.5) {
    const t = clamped * 2
    const r = 239
    const g = Math.round(68 + t * (163 - 68))
    const b = Math.round(68 - t * 68)
    return `rgb(${r},${g},${b})`
  }
  const t = (clamped - 0.5) * 2
  const r = Math.round(239 - t * (239 - 22))
  const g = Math.round(163 + t * (197 - 163))
  const b = Math.round(0 + t * 94)
  return `rgb(${r},${g},${b})`
}

function FitBoundsOnFinca({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap()
  useEffect(() => {
    if (!bounds) return
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 17 })
  }, [bounds, map])
  return null
}

type MapViewMode = 'estado' | 'rendimiento'

export default function VineyardMap({
  tareas,
  filtroFinca,
  filtroTarea = 'todas',
  fullHeight = false,
  allTareas,
  mapRelevamiento = null,
  onLaborAsignada,
}: Props) {
  const [seleccionado, setSeleccionado] = useState<CuadroFeature | null>(null)
  const [viewMode, setViewMode] = useState<MapViewMode>('estado')

  const tareasParaEstado = useMemo(() => {
    const source = allTareas ?? tareas
    if (!allTareas) return tareas
    if (filtroFinca === 'todas') return source
    return source.filter(
      t => t.fincaNombre === filtroFinca || t.fincaId === filtroFinca,
    )
  }, [allTareas, tareas, filtroFinca])

  const tareasMapa = useMemo(
    () => filterTareasForMap(tareasParaEstado, filtroTarea),
    [tareasParaEstado, filtroTarea],
  )

  /**
   * Color del polígono: según la labor del filtro.
   * - filtro labor → solo esa labor (Poda cerrada = gris aunque haya otra abierta)
   * - filtro todas → estado combinado (verde si alguna labor está pendiente)
   */
  const estadoPorCuadroColor = useMemo(
    () => buildEstadoPorCuadroParaMapa(tareasParaEstado, filtroTarea),
    [tareasParaEstado, filtroTarea],
  )

  /** Panel lateral: todas las labores del cuadro, independientemente del filtro. */
  const estadoPorCuadroCompleto = useMemo(
    () => buildEstadoPorCuadro(tareasParaEstado),
    [tareasParaEstado],
  )

  // Agregación de rendimiento por cuadro para heat map.
  const rendimientoHeatData = useMemo(() => {
    const totals = new Map<string, number>()
    for (const tarea of tareasMapa) {
      for (const rd of tarea.rendimientosDiarios ?? []) {
        const rpc = rd.rendimientoPorCuadro
        if (!rpc) continue
        for (const [cuadroId, val] of Object.entries(rpc)) {
          if (typeof val === 'number' && val > 0) {
            totals.set(cuadroId, (totals.get(cuadroId) ?? 0) + val)
          }
        }
      }
    }
    const perHa = new Map<string, number>()
    let maxVal = 0
    for (const [cuadroId, total] of totals) {
      const cuadro = getCuadroDetalleById(cuadroId)
      const ha = cuadro?.hectareas ?? 1
      const valor = total / ha
      perHa.set(cuadroId, valor)
      if (valor > maxVal) maxVal = valor
    }
    return { perHa, maxVal }
  }, [tareasMapa])

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

      let base: PathOptions

      if (viewMode === 'rendimiento') {
        const val = rendimientoHeatData.perHa.get(props.name)
        if (val != null && rendimientoHeatData.maxVal > 0) {
          const ratio = val / rendimientoHeatData.maxVal
          base = {
            fill: true,
            fillColor: heatColor(ratio),
            fillOpacity: 0.7,
            color: '#374151',
            weight: 1.5,
            opacity: 0.9,
          }
        } else {
          base = {
            fill: true,
            fillColor: '#e5e7eb',
            fillOpacity: 0.35,
            color: '#9ca3af',
            weight: 1,
            opacity: 0.6,
          }
        }
      } else {
        const estado = estadoPorCuadroColor.get(props.name)

        if (!estado) {
          base = {
            fill: true,
            fillColor: CUADRO_FILL,
            fillOpacity: 0.4,
            color: CUADRO_STROKE,
            weight: 1,
            opacity: 0.75,
          }
        } else if (estado.multiplesLabores) {
          base = {
            fill: true,
            fillColor: CUADRO_MULTI_FILL,
            fillOpacity: 0.55,
            color: CUADRO_MULTI_STROKE,
            weight: 2.5,
            opacity: 1,
          }
        } else if (estado.pendiente) {
          base = {
            fill: true,
            fillColor: CUADRO_FILL,
            fillOpacity: 0.5,
            color: '#16a34a',
            weight: 2.5,
            opacity: 1,
          }
        } else if (estado.cuadroFinalizado) {
          base = {
            fill: true,
            fillColor: '#d1d5db',
            fillOpacity: 0.55,
            color: '#4b5563',
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
      }

      if (!hover) return base

      const weight = typeof base.weight === 'number' ? base.weight : 1
      return {
        ...base,
        fill: true,
        fillColor: base.fillColor ?? CUADRO_FILL,
        weight: weight + 1,
        color: '#111827',
        fillOpacity: Math.min((base.fillOpacity ?? 0.4) + 0.15, 0.85),
      }
    },
    [estadoPorCuadroColor, viewMode, rendimientoHeatData]
  )

  // Tooltip y click en cada feature.
  const onEachFeature = (feature: Feature, layer: Layer) => {
    const props = feature.properties as CuadroFeatureProps
    const cuadro = getCuadroDetalleById(props.name)
    const variedad = cuadro?.variedad ?? '—'
    const has = cuadro ? formatHectareas(cuadro.hectareas) : '—'

    let tooltipHtml: string
    if (viewMode === 'rendimiento') {
      const rendHa = rendimientoHeatData.perHa.get(props.name)
      const rendLabel = rendHa != null ? `${rendHa.toFixed(1)} /ha` : 'Sin datos'
      tooltipHtml = `
        <div style="font-size:12px;line-height:1.35">
          <strong>${cuadro?.nombre ?? props.name}</strong><br/>
          Rendimiento: ${rendLabel}<br/>
          ${variedad} · ${has}
        </div>
      `
    } else {
      tooltipHtml = `
        <div style="font-size:12px;line-height:1.35">
          <strong>${cuadro?.nombre ?? props.name}</strong><br/>
          ${variedad} · ${has}
        </div>
      `
    }
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
    const marcados = Array.from(estadoPorCuadroColor.entries())
      .map(
        ([k, v]) =>
          `${k}:${v.multiplesLabores ? 'm' : ''}${v.pendiente ? 'p' : ''}${v.cuadroFinalizado ? 'f' : ''}`,
      )
      .sort()
      .join(',')
    return `${filtroFinca}|${filtroTarea}|${features.length}|${marcados}|${viewMode}`
  }, [filtroFinca, filtroTarea, features, estadoPorCuadroColor, viewMode])

  const detallesSeleccion = useMemo(() => {
    if (!seleccionado) return null
    const props = seleccionado.properties
    const cuadro = getCuadroDetalleById(props.name)
    return {
      name: props.name,
      cuadro,
      estado: estadoPorCuadroCompleto.get(props.name),
    }
  }, [seleccionado, estadoPorCuadroCompleto])

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

        <div className="map-view-toggle">
          <button
            className={viewMode === 'estado' ? 'active' : ''}
            onClick={() => setViewMode('estado')}
          >
            Estado
          </button>
          <button
            className={viewMode === 'rendimiento' ? 'active' : ''}
            onClick={() => setViewMode('rendimiento')}
          >
            Rendimiento
          </button>
        </div>

        {viewMode === 'estado' ? (
          <div className="map-legend">
            <div className="map-legend-title">Estado de cuadros</div>
            <div className="map-legend-item">
              <span className="legend-swatch" style={{ borderColor: '#16a34a' }} />
              <span>Cuadro en progreso</span>
            </div>
            <div className="map-legend-item">
              <span
                className="legend-swatch"
                style={{ background: CUADRO_MULTI_FILL, borderColor: CUADRO_MULTI_STROKE }}
              />
              <span>Múltiples labores</span>
            </div>
            <div className="map-legend-item">
              <span className="legend-swatch" style={{ borderColor: '#4b5563' }} />
              <span>Cuadro finalizado</span>
            </div>
            <div className="map-legend-item">
              <span className="legend-swatch" style={{ borderColor: '#9ca3af' }} />
              <span>Sin actividad</span>
            </div>
          </div>
        ) : (
          <div className="map-legend">
            <div className="map-legend-title">Rendimiento / ha</div>
            <div className="map-legend-item">
              <span className="legend-swatch" style={{ background: heatColor(1), borderColor: heatColor(1) }} />
              <span>Alto</span>
            </div>
            <div className="map-legend-item">
              <span className="legend-swatch" style={{ background: heatColor(0.5), borderColor: heatColor(0.5) }} />
              <span>Medio</span>
            </div>
            <div className="map-legend-item">
              <span className="legend-swatch" style={{ background: heatColor(0), borderColor: heatColor(0) }} />
              <span>Bajo</span>
            </div>
            <div className="map-legend-item">
              <span className="legend-swatch" style={{ background: '#e5e7eb', borderColor: '#9ca3af' }} />
              <span>Sin datos</span>
            </div>
          </div>
        )}
      </div>

      {detallesSeleccion && (
        <aside className="map-detail">
          <header>
            <div>
              <div className="map-detail-name">
                {detallesSeleccion.cuadro?.nombre ?? detallesSeleccion.name}
              </div>
              <div className="map-detail-finca">
                Finca {detallesSeleccion.cuadro?.finca ?? getFincaPrefix(detallesSeleccion.name) ?? '—'}
              </div>
            </div>
            <button className="map-detail-close" onClick={() => setSeleccionado(null)}>
              ×
            </button>
          </header>

          {detallesSeleccion.cuadro ? (
            <CuadroCatalogoResumen cuadro={detallesSeleccion.cuadro} compact />
          ) : (
            <p className="dashboard-panel-empty">Cuadro sin datos en el catálogo.</p>
          )}

          {/* map-relevamiento */}
          {isMapRelevamientoEnabled() &&
            mapRelevamiento &&
            detallesSeleccion.cuadro &&
            allTareas && (
              <MapRelevamientoPanel
                cuadro={detallesSeleccion.cuadro}
                tareasEnProgreso={detallesSeleccion.estado?.tareasEnProgreso ?? []}
                allTareas={allTareas}
                actions={mapRelevamiento}
                onLaborAsignada={onLaborAsignada}
              />
            )}

          {detallesSeleccion.estado && (
            <div className="map-detail-tasks">
              {detallesSeleccion.estado.tareasEnProgreso.length > 0 && (
                <div className="map-detail-section">
                  <h4>En progreso ({detallesSeleccion.estado.tareasEnProgreso.length})</h4>
                  <ul className="map-detail-task-list">
                    {detallesSeleccion.estado.tareasEnProgreso.map((t) => {
                      const progress = computeTareaProgress(t)
                      return (
                        <li key={t.id} className="map-detail-task-item">
                          <span>{formatTareaMapLabel(t)}</span>
                          <TaskProgressBar
                            compact
                            value={progress.porcentaje}
                            label={formatProgressLabel(progress)}
                          />
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
              {detallesSeleccion.estado.tareasCerradas.length > 0 && (
                <div className="map-detail-section">
                  <h4>Finalizadas ({detallesSeleccion.estado.tareasCerradas.length})</h4>
                  <ul>
                    {detallesSeleccion.estado.tareasCerradas.slice(0, 5).map((t) => (
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
