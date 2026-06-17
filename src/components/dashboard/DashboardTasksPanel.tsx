import { BarChart3, Users, Cog } from 'lucide-react'
import type { Tarea } from '../../types'
import { formatTimestamp } from '../../utils/formatTimestamp'
import DashboardPanel from './DashboardPanel'

interface Props {
  open: boolean
  onToggle: () => void
  tareas: Tarea[]
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
}

export default function DashboardTasksPanel({
  open,
  onToggle,
  tareas,
  hasMore,
  loadingMore,
  onLoadMore,
}: Props) {
  return (
    <DashboardPanel
      title={`Tareas (${tareas.length})`}
      icon={<BarChart3 size={16} />}
      open={open}
      onToggle={onToggle}
    >
      {tareas.length === 0 ? (
        <div className="empty-state" style={{ padding: '24px 0' }}>
          <BarChart3 size={36} />
          <p style={{ fontSize: 13 }}>
            No hay tareas con estos filtros.
            <br />
            Usá la app de campo para cargar tareas.
          </p>
        </div>
      ) : (
        <div className="dashboard-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Finca</th>
                <th>Tarea</th>
                <th>Tipo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {tareas.map(tarea => (
                <tr key={tarea.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatTimestamp(tarea.fechaInicio)}</td>
                  <td style={{ fontWeight: 500 }}>{tarea.fincaNombre}</td>
                  <td style={{ fontWeight: 600 }}>{tarea.tarea}</td>
                  <td>
                    <span
                      className={`badge ${tarea.tipo === 'manual' ? 'badge-green' : 'badge-blue'}`}
                    >
                      {tarea.tipo === 'manual' ? (
                        <>
                          <Users size={10} /> Manual
                        </>
                      ) : (
                        <>
                          <Cog size={10} /> Mec.
                        </>
                      )}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${tarea.estado === 'finalizada' ? 'badge-green' : 'badge-orange'}`}
                    >
                      {tarea.estado === 'finalizada' ? 'OK' : 'Prog.'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onLoadMore}
          disabled={loadingMore}
          style={{ width: '100%', marginTop: 12 }}
        >
          {loadingMore ? 'Cargando...' : 'Cargar más tareas'}
        </button>
      )}
    </DashboardPanel>
  )
}
