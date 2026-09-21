import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useStockAppContext } from '../../contexts/StockAppContext'
import { STOCK_ROUTES } from '../../stock/routes'
import OperatorNameScreen from '../mobile/OperatorNameScreen'
import WelcomeScreen from '../mobile/WelcomeScreen'
import StockCargaForm from './StockCargaForm'
import StockDepositoSelector from './StockDepositoSelector'
import StockMenu from './StockMenu'
import StockProductoForm from './StockProductoForm'
import StockRequireSession from './StockRequireSession'
import StockStartScreen from './StockStartScreen'
import StockTransferForm from './StockTransferForm'

function StockIndexRedirect() {
  const { hasSession } = useStockAppContext()
  return <Navigate to={hasSession ? STOCK_ROUTES.menu : STOCK_ROUTES.inicio} replace />
}

function StockScreens() {
  const navigate = useNavigate()
  const ctx = useStockAppContext()

  return (
    <Routes>
      <Route index element={<StockIndexRedirect />} />
      <Route path="inicio" element={<StockStartScreen onStart={() => navigate(STOCK_ROUTES.registro)} />} />
      <Route path="registro" element={<OperatorNameScreen onSubmit={ctx.submitOperador} />} />
      <Route
        path="bienvenida"
        element={
          ctx.operadorNombre
            ? <WelcomeScreen nombre={ctx.operadorNombre} onDone={ctx.finishWelcome} subtitle="Bienvenido a App de Stock" />
            : <Navigate to={STOCK_ROUTES.registro} replace />
        }
      />
      <Route
        path="deposito"
        element={
          ctx.operadorNombre
            ? <StockDepositoSelector onSelect={ctx.selectPunto} onBack={ctx.goToInicio} />
            : <Navigate to={STOCK_ROUTES.registro} replace />
        }
      />
      <Route element={<StockRequireSession />}>
        <Route
          path="menu"
          element={
            ctx.punto ? (
              <StockMenu
                punto={ctx.punto}
                saldos={ctx.saldos}
                loading={ctx.loading}
                onCarga={() => navigate(STOCK_ROUTES.carga)}
                onProducto={() => navigate(STOCK_ROUTES.producto)}
                onTransferencia={() => navigate(STOCK_ROUTES.transferencia)}
                onBack={() => navigate(STOCK_ROUTES.deposito)}
              />
            ) : <Navigate to={STOCK_ROUTES.deposito} replace />
          }
        />
        <Route
          path="carga"
          element={
            <StockCargaForm
              catalogo={ctx.catalogo}
              saldos={ctx.saldos}
              onSubmit={ctx.cargar}
              onBack={() => navigate(STOCK_ROUTES.menu)}
            />
          }
        />
        <Route
          path="producto"
          element={
            <StockProductoForm
              onSubmit={ctx.proponer}
              onBack={() => navigate(STOCK_ROUTES.menu)}
            />
          }
        />
        <Route
          path="transferencia"
          element={
            ctx.punto ? (
              <StockTransferForm
                punto={ctx.punto}
                catalogo={ctx.catalogo}
                saldos={ctx.saldos}
                onSubmit={ctx.transferir}
                onBack={() => navigate(STOCK_ROUTES.menu)}
              />
            ) : <Navigate to={STOCK_ROUTES.deposito} replace />
          }
        />
      </Route>
      <Route path="*" element={<Navigate to={STOCK_ROUTES.root} replace />} />
    </Routes>
  )
}

export default function StockRoutes() {
  return <StockScreens />
}
