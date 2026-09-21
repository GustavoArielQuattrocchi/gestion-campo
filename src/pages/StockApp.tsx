import MobileLayout from '../components/mobile/MobileLayout'
import StockRoutes from '../components/stock/StockRoutes'
import { StockAppProvider, useStockAppContext } from '../contexts/StockAppContext'

function StockShell() {
  const { firestoreError, toast, clearToast, isOnline, pendingSync } = useStockAppContext()
  return (
    <MobileLayout
      error={firestoreError}
      toast={toast}
      onDismissToast={clearToast}
      isOnline={isOnline}
      pendingSync={pendingSync}
    >
      <StockRoutes />
    </MobileLayout>
  )
}

export default function StockApp() {
  return (
    <StockAppProvider>
      <StockShell />
    </StockAppProvider>
  )
}
