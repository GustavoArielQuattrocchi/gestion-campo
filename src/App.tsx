import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AdminGate from './components/auth/AdminGate'

const MobileApp = lazy(() => import('./pages/MobileApp'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const OrdenesCuraPage = lazy(() => import('./modules/ordenesCura/OrdenesCuraPage'))
const CuadroPublicPage = lazy(() => import('./pages/CuadroPublicPage'))

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
