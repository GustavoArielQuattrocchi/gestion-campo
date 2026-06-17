import { lazy, Suspense } from 'react'
import { Clock } from 'lucide-react'
import type { Tarea } from '../../types'

const VineyardMap = lazy(() => import('./VineyardMap'))

interface Props {
  tareas: Tarea[]
  filtroFinca: string
}

export default function DashboardMapLayer({ tareas, filtroFinca }: Props) {
  return (
    <div className="dashboard-map-layer">
      <Suspense
        fallback={
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              fontSize: 14,
            }}
          >
            <Clock size={20} style={{ marginRight: 8 }} /> Cargando mapa...
          </div>
        }
      >
        <VineyardMap tareas={tareas} filtroFinca={filtroFinca} fullHeight />
      </Suspense>
    </div>
  )
}
