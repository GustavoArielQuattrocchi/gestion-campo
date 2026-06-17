import { WifiOff } from 'lucide-react'

interface Props {
  pendingSync?: boolean
}

export default function OfflineBanner({ pendingSync = false }: Props) {
  return (
    <div className="offline-banner" role="status">
      <WifiOff size={16} aria-hidden />
      <span>
        Sin conexión — podés seguir trabajando.
        {pendingSync ? ' Hay cambios pendientes de envío.' : ' Los datos se guardan en el dispositivo.'}
      </span>
    </div>
  )
}
