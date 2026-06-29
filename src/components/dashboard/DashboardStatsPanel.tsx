import {
  BarChart3,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  CalendarDays,
  ClipboardList,
} from 'lucide-react'
import type { DashboardStats } from '../../utils/dashboardMetrics'
import type { MetricKey } from '../../utils/getMetricDetail'
import DashboardPanel from './DashboardPanel'

interface Props {
  open: boolean
  onToggle: () => void
  stats: DashboardStats
  partesCount: number
  metricsNote: string | null
  onSelectMetric: (key: MetricKey) => void
  onOpenEnProgreso: () => void
  onOpenPartesLabores: () => void
}

export default function DashboardStatsPanel({
  open,
  onToggle,
  stats,
  partesCount,
  metricsNote,
  onSelectMetric,
  onOpenEnProgreso,
  onOpenPartesLabores,
}: Props) {
  return (
    <DashboardPanel
      title="Resumen"
      icon={<BarChart3 size={16} />}
      open={open}
      onToggle={onToggle}
    >
      <div className="stats-grid stats-grid--sidebar">
        <button
          type="button"
          className="stat-card stat-card--interactive"
          onClick={() => onSelectMetric('total')}
          aria-label="Ver detalle: Total de tareas"
        >
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
            <BarChart3 size={18} />
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total de tareas</div>
        </button>

        <button
          type="button"
          className="stat-card stat-card--interactive"
          onClick={() => onSelectMetric('finalizadas')}
          aria-label="Ver detalle: Finalizadas"
        >
          <div className="stat-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <CheckCircle size={18} />
          </div>
          <div className="stat-value">{stats.finalizadas}</div>
          <div className="stat-label">Finalizadas</div>
        </button>

        <button
          type="button"
          className="stat-card stat-card--interactive"
          onClick={onOpenEnProgreso}
          aria-label="Ver trabajos en progreso"
        >
          <div className="stat-icon" style={{ background: '#fff7ed', color: '#f97316' }}>
            <Clock size={18} />
          </div>
          <div className="stat-value">{stats.enProgreso}</div>
          <div className="stat-label">En progreso</div>
        </button>

        <button
          type="button"
          className="stat-card stat-card--interactive"
          onClick={onOpenPartesLabores}
          aria-label="Ver partes de labores"
        >
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <ClipboardList size={18} />
          </div>
          <div className="stat-value">{partesCount}</div>
          <div className="stat-label">Partes de labores</div>
        </button>

        <button
          type="button"
          className="stat-card stat-card--interactive"
          onClick={() => onSelectMetric('personas_dia')}
          aria-label="Ver detalle: Personas por día"
        >
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Users size={18} />
          </div>
          <div className="stat-value">{stats.personasPorDia}</div>
          <div className="stat-label">Personas / día</div>
        </button>

        <button
          type="button"
          className="stat-card stat-card--interactive"
          onClick={() => onSelectMetric('rendimiento')}
          aria-label="Ver detalle: Rendimiento por tarea"
        >
          <div className="stat-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>
            <TrendingUp size={18} />
          </div>
          <div className="stat-value">{stats.rendimientoPorTarea}</div>
          <div className="stat-label">Rend. / tarea</div>
        </button>

        <button
          type="button"
          className="stat-card stat-card--interactive"
          onClick={() => onSelectMetric('total_personas')}
          aria-label="Ver detalle: Total personas"
        >
          <div className="stat-icon" style={{ background: '#fce7f3', color: '#db2777' }}>
            <CalendarDays size={18} />
          </div>
          <div className="stat-value">{stats.totalPersonas}</div>
          <div className="stat-label">Total personas</div>
        </button>
      </div>

      {metricsNote && (
        <p className="dashboard-metrics-note" role="status">
          {metricsNote}
        </p>
      )}
    </DashboardPanel>
  )
}
