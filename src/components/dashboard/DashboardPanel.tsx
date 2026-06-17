import type { ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface Props {
  title: string
  icon: ReactNode
  open: boolean
  onToggle: () => void
  children: ReactNode
}

export default function DashboardPanel({ title, icon, open, onToggle, children }: Props) {
  return (
    <section className="dashboard-panel">
      <button
        type="button"
        className="dashboard-panel-trigger"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon}
          {title}
        </span>
        {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>
      {open && <div className="dashboard-panel-content">{children}</div>}
    </section>
  )
}
