import { AlertTriangle, X } from 'lucide-react'

interface Props {
  count: number
  onViewPartes: () => void
  onDismiss: () => void
}

export default function DashboardPendingPartesAlert({ count, onViewPartes, onDismiss }: Props) {
  if (count <= 0) return null

  return (
    <div className="dashboard-pending-partes-alert" role="alert">
      <div className="dashboard-pending-partes-alert-body">
        <span className="dashboard-pending-partes-alert-icon">
          <AlertTriangle size={18} />
        </span>
        <div>
          <strong>
            {count} parte{count > 1 ? 's' : ''} pendiente{count > 1 ? 's' : ''} de días anteriores
          </strong>
          <span>Quedaron abiertos sin cierre de jornada.</span>
        </div>
      </div>
      <div className="dashboard-pending-partes-alert-actions">
        <button type="button" className="dashboard-pending-partes-alert-btn" onClick={onViewPartes}>
          Ver partes
        </button>
        <button
          type="button"
          className="dashboard-pending-partes-alert-close"
          onClick={onDismiss}
          aria-label="Cerrar aviso"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
