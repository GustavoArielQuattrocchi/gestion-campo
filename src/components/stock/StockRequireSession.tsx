import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useStockAppContext } from '../../contexts/StockAppContext'
import { STOCK_ROUTES } from '../../stock/routes'

export default function StockRequireSession() {
  const { hasSession } = useStockAppContext()
  const location = useLocation()
  if (!hasSession) {
    return <Navigate to={STOCK_ROUTES.inicio} replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
