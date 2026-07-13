import { lazy, Suspense, useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import type { Tarea } from '../../types'
import type { MapRelevamientoActions } from '../../features/mapRelevamiento'

const VineyardMap = lazy(() => import('./VineyardMap'))

interface Props {
  tareas: Tarea[]
  filtroFinca: string
  filtroTarea?: string
  /** map-relevamiento */
  allTareas?: Tarea[]
  mapRelevamiento?: MapRelevamientoActions | null
  onLaborAsignada?: (labor: string) => void
}

function MapPlaceholder() {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6b7280',
        fontSize: 14,
        background: '#f3f4f6',
      }}
    >
      <Clock size={20} style={{ marginRight: 8 }} /> Cargando mapa...
    </div>
  )
}

export default function DashboardMapLayer({
  tareas,
  filtroFinca,
  filtroTarea = 'todas',
  allTareas,
  mapRelevamiento,
  onLaborAsignada,
}: Props) {
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    const enableMap = () => setMapReady(true)
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(enableMap, { timeout: 1200 })
      return () => window.cancelIdleCallback(id)
    }
    const timer = window.setTimeout(enableMap, 150)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="dashboard-map-layer">
      {!mapReady ? (
        <MapPlaceholder />
      ) : (
        <Suspense fallback={<MapPlaceholder />}>
          <VineyardMap
            tareas={tareas}
            filtroFinca={filtroFinca}
            filtroTarea={filtroTarea}
            fullHeight
            allTareas={allTareas}
            mapRelevamiento={mapRelevamiento}
            onLaborAsignada={onLaborAsignada}
          />
        </Suspense>
      )}
    </div>
  )
}
