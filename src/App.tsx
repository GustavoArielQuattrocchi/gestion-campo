import { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AdminGate from './components/auth/AdminGate'
import PwaUpdateBanner from './components/pwa/PwaUpdateBanner'
import { lazyWithRetry } from './utils/lazyWithRetry'

const MobileApp = lazyWithRetry(() => import('./pages/MobileApp'), 'mobile')
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'), 'dashboard')
const OrdenesCuraPage = lazyWithRetry(() => import('./modules/ordenesCura/OrdenesCuraPage'), 'ordenes-cura')
const AplicacionesFitosanitariasPage = lazyWithRetry(
  () => import('./modules/aplicacionesFitosanitarias/AplicacionesFitosanitariasPage'),
  'aplicaciones-fitosanitarias',
)
const StockApp = lazyWithRetry(() => import('./pages/StockApp'), 'stock')
const StockAdminPage = lazyWithRetry(() => import('./modules/stock/StockAdminPage'), 'stock-admin')
const CuadroPublicPage = lazyWithRetry(() => import('./pages/CuadroPublicPage'), 'cuadro-public')

function RouteFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6b7280',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      Cargando...
    </div>
  )
}

export default function App() {
  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/campo" replace />} />
          <Route path="/campo/*" element={<MobileApp />} />
          <Route path="/stock/*" element={<StockApp />} />
          <Route
            path="/escritorio"
            element={
              <AdminGate>
                <Dashboard />
              </AdminGate>
            }
          />
          <Route
            path="/ordenes-de-cura"
            element={
              <AdminGate>
                <OrdenesCuraPage />
              </AdminGate>
            }
          />
          <Route
            path="/aplicaciones-fitosanitarias"
            element={
              <AdminGate>
                <AplicacionesFitosanitariasPage />
              </AdminGate>
            }
          />
          <Route
            path="/stock-admin"
            element={
              <AdminGate>
                <StockAdminPage />
              </AdminGate>
            }
          />
          <Route path="/cuadro/:fincaId/:cuadroId" element={<CuadroPublicPage />} />
          <Route path="*" element={<Navigate to="/campo" replace />} />
        </Routes>
      </Suspense>
      <PwaUpdateBanner />
    </>
  )
}
