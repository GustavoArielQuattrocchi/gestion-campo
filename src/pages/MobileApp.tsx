import MobileLayout from '../components/mobile/MobileLayout'
import MobileRoutes from '../components/mobile/MobileRoutes'
import { MobileAppProvider, useMobileAppContext } from '../contexts/MobileAppContext'

function MobileShell() {
  const { firestoreError, parseWarning, toast, clearToast, isOnline, pendingSync } =
    useMobileAppContext()

  return (
    <MobileLayout
      error={firestoreError}
      warning={parseWarning}
      toast={toast}
      onDismissToast={clearToast}
      isOnline={isOnline}
      pendingSync={pendingSync}
    >
      <MobileRoutes />
    </MobileLayout>
  )
}

export default function MobileApp() {
  return (
    <MobileAppProvider>
      <MobileShell />
    </MobileAppProvider>
  )
}
