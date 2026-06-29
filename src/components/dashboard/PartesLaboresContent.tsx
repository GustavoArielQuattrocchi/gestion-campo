import { useMemo } from 'react'
import { Users, Cog } from 'lucide-react'
import type { ParteDeLabores } from '../../types'
import { formatTimestamp } from '../../utils/formatTimestamp'

interface Props {
  partes: ParteDeLabores[]
  loading: boolean
  error: string | null
  parseWarning: string | null
  fincasDisponibles: string[]
  filtroFinca: string
  filtroOperador: string
  onFiltroFincaChange: (value: string) => void
  onFiltroOperadorChange: (value: string) => void
}

function resumenParte(parte: ParteDeLabores): string {
  if (parte.tipo === 'manual') {
    return `${parte.cuadrilla} · ${parte.cantidadPersonas} pers.`
  }
  if (parte.maquinariaModelo) {
    return `${parte.maquinaria} (${parte.maquinariaModelo})`
  }
  return `${parte.persona} · ${parte.maquinaria}`
}

export default function PartesLaboresContent({
  partes,
  loading,
  error,
  parseWarning,
  fincasDisponibles,
  filtroFinca,
  filtroOperador,
  onFiltroFincaChange,
  onFiltroOperadorChange,
}: Props) {
  const operadoresDisponibles = useMemo(() => {
    const set = new Set(partes.map(p => p.operador))
    return [...set].sort()
  }, [partes])

  const partesFiltradas = useMemo(() => {
    return partes.filter(p => {
      if (filtroFinca !== 'todas' && p.fincaNombre !== filtroFinca) return false
      if (filtroOperador !== 'todos' && p.operador !== filtroOperador) return false
      return true
    })
  }, [partes, filtroFinca, filtroOperador])

  if (loading) {
    return <p className="dashboard-panel-empty">Cargando partes de labores...</p>
  }

  if (error) {
    return <p className="dashboard-panel-empty dashboard-panel-empty--error">{error}</p>
  }

  return (
    <>
      {parseWarning && (
        <p className="dashboard-panel-warning">{parseWarning}</p>
      )}

      {partes.length > 0 && (
        <div className="partes-labores-filters">
          <label className="partes-labores-filter">
            <span>Finca</span>
            <select value={filtroFinca} onChange={e => onFiltroFincaChange(e.target.value)}>
              <option value="todas">Todas</option>
              {fincasDisponibles.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>
          <label className="partes-labores-filter">
            <span>Operador</span>
            <select value={filtroOperador} onChange={e => onFiltroOperadorChange(e.target.value)}>
              <option value="todos">Todos</option>
              {operadoresDisponibles.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {partesFiltradas.length === 0 ? (
        <p className="dashboard-panel-empty">
          {partes.length === 0
            ? 'Aún no hay partes de labores cerrados desde campo.'
            : 'Ningún parte coincide con los filtros seleccionados.'}
        </p>
      ) : (
        <ul className="partes-labores-list">
          {partesFiltradas.map(parte => (
            <li key={parte.id} className="parte-labores-item">
              <div className="parte-labores-item-header">
                <div>
                  <strong>{parte.tarea}</strong>
                  <span className="parte-labores-meta">
                    {parte.fincaNombre} · {formatTimestamp(parte.cerradoEn, 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
                <span
                  className={`badge ${parte.tipo === 'manual' ? 'badge-green' : 'badge-blue'}`}
                >
                  {parte.tipo === 'manual' ? (
                    <>
                      <Users size={10} /> Manual
                    </>
                  ) : (
                    <>
                      <Cog size={10} /> Mec.
                    </>
                  )}
                </span>
              </div>
              <p className="parte-labores-operador">
                Operador: <strong>{parte.operador}</strong>
              </p>
              <p className="parte-labores-detalle">{resumenParte(parte)}</p>
              <p className="parte-labores-cuadros">
                Cuadros: {(parte.cuadros ?? []).join(', ') || '—'}
              </p>
              <p className="parte-labores-rendimiento">
                <span>Rendimiento:</span> {parte.rendimiento}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
