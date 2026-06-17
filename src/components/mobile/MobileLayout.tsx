import type { ReactNode } from 'react'
import FirestoreErrorBanner from './FirestoreErrorBanner'
import MobileToast, { type MobileToastState } from './MobileToast'
import OfflineBanner from './OfflineBanner'

interface Props {
  error: string | null
  warning?: string | null
  toast?: MobileToastState | null
  onDismissToast?: () => void
  isOnline?: boolean
  pendingSync?: boolean
  children: ReactNode
}

export default function MobileLayout({
  error,
  warning,
  toast,
  onDismissToast,
  isOnline = true,
  pendingSync = false,
  children,
}: Props) {
  return (
    <>
      {!isOnline && <OfflineBanner pendingSync={pendingSync} />}
      {error && <FirestoreErrorBanner message={error} />}
      {!error && warning && (
        <div className="dashboard-sidebar-warning" role="status" style={{ margin: '12px 16px 0' }}>
          <strong>Datos parcialmente cargados</strong>
          <p style={{ margin: '6px 0 0', fontSize: 13 }}>{warning}</p>
        </div>
      )}
      {children}
      {toast && onDismissToast && <MobileToast toast={toast} onDismiss={onDismissToast} />}
    </>
  )
}
