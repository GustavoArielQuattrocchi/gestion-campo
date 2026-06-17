import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useMobileAppContext } from '../../contexts/MobileAppContext'
import { MOBILE_ROUTES } from '../../mobile/routes'

export default function MobileRequireSession() {
  const { hasSession } = useMobileAppContext()
  const location = useLocation()

  if (!hasSession) {
    return <Navigate to={MOBILE_ROUTES.inicio} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
