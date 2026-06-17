import { useEffect } from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

export type MobileToastVariant = 'success' | 'error' | 'info'

export interface MobileToastState {
  message: string
  variant: MobileToastVariant
}

interface Props {
  toast: MobileToastState | null
  onDismiss: () => void
  autoHideMs?: number
}

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
} as const

export default function MobileToast({ toast, onDismiss, autoHideMs = 4500 }: Props) {
  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(onDismiss, autoHideMs)
    return () => window.clearTimeout(id)
  }, [toast, onDismiss, autoHideMs])

  if (!toast) return null

  const Icon = ICONS[toast.variant]

  return (
    <div
      className={`mobile-toast mobile-toast--${toast.variant}`}
      role={toast.variant === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <Icon size={18} aria-hidden />
      <span className="mobile-toast__message">{toast.message}</span>
      <button type="button" className="mobile-toast__close" onClick={onDismiss} aria-label="Cerrar">
        <X size={16} />
      </button>
    </div>
  )
}
