import {
  BarChart3,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  ClipboardList,
  LineChart,
  ShieldAlert,
} from 'lucide-react'
import type { DashboardStats } from '../../utils/dashboardMetrics'
import type { MetricKey } from '../../utils/getMetricDetail'
import DashboardPanel from './DashboardPanel'

interface Props {
  open: boolean
  onToggle: () => void
  stats: DashboardStats
  partesCount: number
  accidentCount: number
  metricsNote: string | null
  onSelectMetric: (key: MetricKey) => void
  onOpenEnProgreso: () => void
  onOpenPartesLabores: () => void
  onOpenDotacion: () => void
  onOpenAnalytics: () => void
  onOpenSeguridad: () => void
}

export default function DashboardStatsPanel({
  open,
  onToggle,
  stats,
  partesCount,
  accidentCount,
  metricsNote,
  onSelectMetric,
  onOpenEnProgreso,
  onOpenPartesLabores,
  onOpenDotacion,
  onOpenAnalytics,
  onOpenSeguridad,
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
          onClick={onOpenDotacion}
          aria-label="Ver dotación de hoy"
        >
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Users size={18} />
          </div>
          <div className="stat-value">{stats.dotacionHoy}</div>
          <div className="stat-label">Dotación</div>
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
          onClick={onOpenSeguridad}
          aria-label="Ver informes de seguridad"
        >
          <div className="stat-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
            <ShieldAlert size={18} />
          </div>
          <div className="stat-value">{accidentCount}</div>
          <div className="stat-label">Accidentes</div>
        </button>

        <button
          type="button"
          className="stat-card stat-card--interactive stat-card--analytics"
          onClick={onOpenAnalytics}
          aria-label="Ver indicadores de productividad"
        >
          <div className="stat-icon" style={{ background: '#ede9fe', color: '#8b5cf6' }}>
            <LineChart size={18} />
          </div>
          <div className="stat-value">📊</div>
          <div className="stat-label">Indicadores</div>
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
