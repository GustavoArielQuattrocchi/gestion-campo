import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useFocusTrap } from '../../hooks/useFocusTrap'

interface Props {
  open: boolean
  title: string
  accentColor?: string
  onClose: () => void
  children: ReactNode
}

export default function DashboardContentModal({
  open,
  title,
  accentColor = '#3b82f6',
  onClose,
  children,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(dialogRef, open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="metric-modal-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="metric-modal metric-modal--content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-content-modal-title"
        onClick={e => e.stopPropagation()}
        style={{ borderTopColor: accentColor }}
      >
        <header className="metric-modal-header">
          <h2 id="dashboard-content-modal-title">{title}</h2>
          <button
            type="button"
            className="metric-modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </header>
        <div className="metric-modal-body metric-modal-body--content">
          {children}
        </div>
      </div>
    </div>
  )
}
