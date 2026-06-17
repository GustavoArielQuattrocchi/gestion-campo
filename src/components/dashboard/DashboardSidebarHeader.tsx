import { Sprout, Smartphone } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function DashboardSidebarHeader() {
  return (
    <div className="dashboard-sidebar-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Sprout size={22} color="#16a34a" />
        <div>
          <h1>Gestión de Campo</h1>
          <p className="subtitle">Panel de control</p>
        </div>
      </div>
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
      </div>
    </div>
  )
}
