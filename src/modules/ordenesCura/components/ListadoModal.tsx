import { useMemo, useState } from 'react'
import type { OrdenCura } from '../types'

interface Props {
  ordenes: OrdenCura[]
  busyPdfId: string | null
  onVer: (ordenId: string) => void
  onPdf: (ordenId: string) => void
  onEliminar: (ordenId: string) => void
  onClose: () => void
}

function formatFecha(orden: OrdenCura): string {
  return orden.fecha.toDate().toLocaleDateString('es-AR')
}

export default function ListadoModal({
  ordenes,
  busyPdfId,
  onVer,
  onPdf,
  onEliminar,
  onClose,
}: Props) {
  const [q, setQ] = useState('')
  const [filtroFinca, setFiltroFinca] = useState('todas')

  const fincas = useMemo(() => {
    return [...new Set(ordenes.map(o => o.finca).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'))
  }, [ordenes])

  const filtradas = useMemo(() => {
    const term = q.trim().toLowerCase()
    return ordenes.filter(o => {
      if (filtroFinca !== 'todas' && o.finca !== filtroFinca) return false
      if (!term) return true
      return [o.oc, o.finca, o.cultivo, formatFecha(o)].some(v => v.toLowerCase().includes(term))
    })
  }, [ordenes, filtroFinca, q])

  return (
    <div className="oc-modal" role="dialog" aria-modal="true" aria-label="Órdenes guardadas">
      <div className="oc-sheet">
        <h3>Órdenes anteriores</h3>
        <p className="oc-muted">Filtrá por finca, abrí para ver o descargá el PDF. Eliminar no se puede deshacer.</p>
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
              placeholder="N° OC, fecha o cultivo..."
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </label>
          <button type="button" className="oc-btn oc-btn--slate" onClick={onClose}>
            Cerrar
          </button>
        </div>
        <div className="oc-table-responsive">
          <table className="oc-table">
            <thead>
              <tr>
                <th>OC</th>
                <th>Fecha</th>
                <th>Finca</th>
                <th>Cultivo</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="oc-empty">
                    Sin órdenes
                  </td>
                </tr>
              ) : (
                filtradas.map(orden => (
                  <tr key={orden.id}>
                    <td>{orden.oc}</td>
                    <td>{formatFecha(orden)}</td>
                    <td>{orden.finca}</td>
                    <td>{orden.cultivo || '—'}</td>
                    <td>
                      <div className="oc-listado-actions">
                        <button
                          type="button"
                          className="oc-btn oc-btn--small oc-btn--slate"
                          onClick={() => onVer(orden.id)}
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          className="oc-btn oc-btn--small oc-btn--slate"
                          onClick={() => onPdf(orden.id)}
                          disabled={busyPdfId === orden.id}
                        >
                          {busyPdfId === orden.id ? 'PDF…' : 'PDF'}
                        </button>
                        <button
                          type="button"
                          className="oc-btn oc-btn--small oc-btn--danger"
                          onClick={() => onEliminar(orden.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
