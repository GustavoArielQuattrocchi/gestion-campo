import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

interface Props {
  sidebarOpen: boolean
  onToggle: () => void
}

export default function DashboardSidebarToggle({ sidebarOpen, onToggle }: Props) {
  return (
    <button
      type="button"
      className="dashboard-sidebar-toggle"
      onClick={onToggle}
      aria-label={sidebarOpen ? 'Ocultar panel' : 'Mostrar panel'}
      title={sidebarOpen ? 'Ocultar panel' : 'Mostrar panel'}
    >
      {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
    </button>
  )
}
