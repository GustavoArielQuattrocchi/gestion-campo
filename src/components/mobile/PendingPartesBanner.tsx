import { AlertTriangle, X } from 'lucide-react'

interface Props {
  count: number
  onGoToVencidos: () => void
  onDismiss: () => void
}

export default function PendingPartesBanner({ count, onGoToVencidos, onDismiss }: Props) {
  if (count <= 0) return null

  return (
    <div className="pending-partes-banner" role="alert">
      <div className="pending-partes-banner-content">
        <AlertTriangle size={18} />
        <div>
          <strong>
            {count} parte{count > 1 ? 's' : ''} sin cerrar de días anteriores
          </strong>
          <p>Registrá el rendimiento para que quede con la fecha del día en que se abrió.</p>
        </div>
      </div>
      <div className="pending-partes-banner-actions">
        <button type="button" className="pending-partes-banner-cta" onClick={onGoToVencidos}>
          Cerrar pendientes
        </button>
        <button type="button" className="pending-partes-banner-dismiss" onClick={onDismiss} aria-label="Cerrar aviso">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
