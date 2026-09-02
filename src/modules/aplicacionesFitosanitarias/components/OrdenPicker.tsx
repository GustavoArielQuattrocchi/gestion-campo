import { useMemo, useState } from 'react'
import type { OrdenCura } from '../../ordenesCura/types'
import { formatOwnerLabel } from '../../ordenesCura/utils/ownerLabel'
import type { AplicacionFitosanitaria } from '../types'
import GastoAcumulado from './GastoAcumulado'

interface Props {
  ordenes: OrdenCura[]
  aplicaciones: AplicacionFitosanitaria[]
  loading: boolean
  onSelect: (ordenId: string) => void
}

function formatFecha(orden: OrdenCura): string {
  return orden.fecha.toDate().toLocaleDateString('es-AR')
}

export default function OrdenPicker({ ordenes, aplicaciones, loading, onSelect }: Props) {
  const [q, setQ] = useState('')
  const [filtroFinca, setFiltroFinca] = useState('todas')

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const app of aplicaciones) {
      map.set(app.ordenId, (map.get(app.ordenId) ?? 0) + 1)
    }
    return map
  }, [aplicaciones])

  const fincas = useMemo(() => {
    return [...new Set(ordenes.map(o => o.finca).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'))
  }, [ordenes])

  const filtradas = useMemo(() => {
    const term = q.trim().toLowerCase()
    return ordenes.filter(o => {
      if (filtroFinca !== 'todas' && o.finca !== filtroFinca) return false
      if (!term) return true
      return [o.oc, o.finca, o.cultivo, o.owner_email, formatFecha(o)].some(v =>
        v.toLowerCase().includes(term),
      )
    })
  }, [ordenes, filtroFinca, q])

  const appsFiltradas = useMemo(() => {
    if (filtroFinca === 'todas') return aplicaciones
    return aplicaciones.filter(a => a.finca === filtroFinca)
  }, [aplicaciones, filtroFinca])

  return (
    <div className="oc-main">
      <GastoAcumulado
        titulo={filtroFinca === 'todas' ? 'Gastado en todas las fincas' : `Gastado en ${filtroFinca}`}
        turnos={appsFiltradas}
      />
      <section className="oc-card">
        <h2>Elegí una orden de cura</h2>
        <p className="oc-muted">
          Historial compartido: ves las OC de todos los admins. Cada turno se guarda aparte; el gasto
          se infiere de la receta.
        </p>
        <div className="oc-listado-filters">
          <label className="oc-listado-filter">
            <span>Finca</span>
            <select
              className="oc-input"
              value={filtroFinca}
              onChange={e => setFiltroFinca(e.target.value)}
            >
              <option value="todas">Todas</option>
              {fincas.map(finca => (
                <option key={finca} value={finca}>{finca}</option>
              ))}
            </select>
          </label>
          <label className="oc-listado-filter oc-listado-filter--grow">
            <span>Buscar</span>
            <input
              className="oc-input"
              type="text"
              placeholder="N° OC, fecha, cultivo o quien cargó..."
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </label>
        </div>
        <div className="oc-table-responsive">
          <table className="oc-table">
            <thead>
              <tr>
                <th>OC</th>
                <th>Fecha</th>
                <th>Finca</th>
                <th>Cultivo</th>
                <th>Cargó</th>
                <th>Turnos</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="oc-empty">Cargando órdenes…</td>
                </tr>
              ) : filtradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="oc-empty">No hay órdenes guardadas</td>
                </tr>
              ) : (
                filtradas.map(orden => (
                  <tr key={orden.id}>
                    <td>{orden.oc}</td>
                    <td>{formatFecha(orden)}</td>
                    <td>{orden.finca}</td>
                    <td>{orden.cultivo || '—'}</td>
                    <td>{formatOwnerLabel(orden.owner_email)}</td>
                    <td>{counts.get(orden.id) ?? 0}</td>
                    <td>
                      <button
                        type="button"
                        className="oc-btn oc-btn--small oc-btn--slate"
                        onClick={() => onSelect(orden.id)}
                      >
                        Cargar turno
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
