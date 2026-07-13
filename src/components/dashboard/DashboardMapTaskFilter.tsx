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
  const selectTitle = activo
    ? `${filtroFinca !== 'todas' ? `${filtroFinca} · ` : ''}Solo cuadros con «${filtroTarea}»`
    : 'Mostrar todas las labores en el mapa'

  return (
    <div
      className={`dashboard-map-task-filter ${activo ? 'is-active' : ''}`}
      role="group"
      aria-label="Filtrar labor en el mapa"
    >
      <span className="dashboard-map-task-filter-icon" aria-hidden>
        <Sprout size={18} />
      </span>
      <div className="dashboard-map-task-filter-content">
        <strong>Labor en mapa</strong>
        <select
          id="dashboard-map-task-select"
          className="dashboard-map-task-filter-select"
          value={filtroTarea}
          onChange={e => onTareaChange(e.target.value)}
          title={selectTitle}
          aria-label="Labor en mapa"
        >
          <option value={MAP_TAREA_TODAS}>Todas las labores</option>
          {tareasDisponibles.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
