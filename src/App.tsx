import { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AdminGate from './components/auth/AdminGate'
import { lazyWithRetry } from './utils/lazyWithRetry'

const MobileApp = lazyWithRetry(() => import('./pages/MobileApp'), 'mobile')
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'), 'dashboard')
const OrdenesCuraPage = lazyWithRetry(() => import('./modules/ordenesCura/OrdenesCuraPage'), 'ordenes-cura')
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
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/campo" replace />} />
        <Route path="/campo/*" element={<MobileApp />} />
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
        <Route path="/cuadro/:fincaId/:cuadroId" element={<CuadroPublicPage />} />
      </Routes>
    </Suspense>
  )
}
