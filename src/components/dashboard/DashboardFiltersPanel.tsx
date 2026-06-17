import { Sprout } from 'lucide-react'
import DashboardPanel from './DashboardPanel'

interface Props {
  open: boolean
  onToggle: () => void
  filtroFinca: string
  filtroTipo: string
  filtroEstado: string
  fincasFiltro: string[]
  onFincaChange: (value: string) => void
  onTipoChange: (value: string) => void
  onEstadoChange: (value: string) => void
}

export default function DashboardFiltersPanel({
  open,
  onToggle,
  filtroFinca,
  filtroTipo,
  filtroEstado,
  fincasFiltro,
  onFincaChange,
  onTipoChange,
  onEstadoChange,
}: Props) {
  return (
    <DashboardPanel
      title="Filtros"
      icon={<Sprout size={16} />}
      open={open}
      onToggle={onToggle}
    >
      <div className="filters-bar filters-bar--sidebar">
        <select value={filtroFinca} onChange={e => onFincaChange(e.target.value)}>
          <option value="todas">Todas las fincas</option>
          {fincasFiltro.map(f => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select value={filtroTipo} onChange={e => onTipoChange(e.target.value)}>
          <option value="todos">Todos los tipos</option>
          <option value="manual">Manual</option>
          <option value="mecanica">Mecánica</option>
        </select>
        <select value={filtroEstado} onChange={e => onEstadoChange(e.target.value)}>
          <option value="todos">Todos los estados</option>
          <option value="en_progreso">En progreso</option>
          <option value="finalizada">Finalizada</option>
        </select>
      </div>
      <p style={{ fontSize: 12, color: '#6b7280', margin: '8px 0 0' }}>
        Mapa: {filtroFinca === 'todas' ? 'Todas las fincas' : `Finca ${filtroFinca}`}
      </p>
    </DashboardPanel>
  )
}
