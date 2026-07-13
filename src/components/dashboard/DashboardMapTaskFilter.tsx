import { Sprout } from 'lucide-react'
import { MAP_TAREA_TODAS } from '../../utils/mapTaskFilter'

interface Props {
  filtroTarea: string
  tareasDisponibles: string[]
  filtroFinca: string
  onTareaChange: (value: string) => void
}

export default function DashboardMapTaskFilter({
  filtroTarea,
  tareasDisponibles,
  filtroFinca,
  onTareaChange,
}: Props) {
  const activo = filtroTarea !== MAP_TAREA_TODAS

  return (
    <div
      className={`dashboard-map-task-filter ${activo ? 'is-active' : ''}`}
      role="group"
      aria-label="Filtrar labor en el mapa"
    >
      <label className="dashboard-map-task-filter-label" htmlFor="dashboard-map-task-select">
        <Sprout size={16} aria-hidden />
        <span>Labor en mapa</span>
      </label>
      <select
        id="dashboard-map-task-select"
        className="dashboard-map-task-filter-select"
        value={filtroTarea}
        onChange={e => onTareaChange(e.target.value)}
        title="Mostrar solo cuadros con esta labor"
      >
        <option value={MAP_TAREA_TODAS}>Todas las labores</option>
        {tareasDisponibles.map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      {activo && (
        <span className="dashboard-map-task-filter-hint">
          {filtroFinca !== 'todas' ? `${filtroFinca} · ` : ''}
          Solo cuadros con «{filtroTarea}»
        </span>
      )}
    </div>
  )
}
