import { Sprout, Smartphone, FileText, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'

export default function DashboardSidebarHeader() {
  const { user, logout } = useAuth()

  return (
    <div className="dashboard-sidebar-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Sprout size={22} color="#16a34a" />
        <div>
          <h1>Gestión de Campo</h1>
          <p className="subtitle">Panel de control</p>
        </div>
      </div>
      {user?.email && (
        <div className="dashboard-sidebar-account">
          <span title={user.email}>{user.email}</span>
          <button
            type="button"
            className="btn-icon"
            onClick={() => logout()}
            title="Cerrar sesión"
          >
            <LogOut size={14} /> Salir
          </button>
        </div>
      )}
      <div className="dashboard-sidebar-actions">
        <Link to="/campo" style={{ textDecoration: 'none', flex: 1 }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
          >
            <Smartphone size={14} />
            App Campo
          </button>
        </Link>
        <Link to="/ordenes-de-cura" style={{ textDecoration: 'none', flex: 1 }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
          >
            <FileText size={14} />
            Órdenes de Cura
          </button>
        </Link>
      </div>
    </div>
  )
}
