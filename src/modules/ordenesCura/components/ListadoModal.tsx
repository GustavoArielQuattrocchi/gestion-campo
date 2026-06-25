import { useMemo, useState } from 'react'
import type { OrdenCura } from '../types'

interface Props {
  ordenes: OrdenCura[]
  onAbrir: (ordenId: string) => void
  onEliminar: (ordenId: string) => void
  onClose: () => void
}

function formatFecha(orden: OrdenCura): string {
  return orden.fecha.toDate().toLocaleDateString('es-AR')
}

export default function ListadoModal({ ordenes, onAbrir, onEliminar, onClose }: Props) {
  const [q, setQ] = useState('')

  const filtradas = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return ordenes
    return ordenes.filter(o =>
      [o.oc, o.finca, formatFecha(o)].some(v => v.toLowerCase().includes(term)),
    )
  }, [ordenes, q])

  return (
    <div className="oc-modal" role="dialog" aria-modal="true">
      <div className="oc-sheet">
        <h3>Órdenes guardadas</h3>
        <div className="oc-row">
          <input
            className="oc-input"
            type="text"
            placeholder="Buscar..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <button type="button" className="oc-btn oc-btn--danger" style={{ width: 'auto' }} onClick={onClose}>
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
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="oc-empty">
                    Sin órdenes
                  </td>
                </tr>
              ) : (
                filtradas.map(orden => (
                  <tr key={orden.id}>
                    <td>{orden.oc}</td>
                    <td>{formatFecha(orden)}</td>
                    <td>{orden.finca}</td>
                    <td>
                      <div className="oc-listado-actions">
                        <button
                          type="button"
                          className="oc-btn oc-btn--small oc-btn--light"
                          onClick={() => onAbrir(orden.id)}
                        >
                          Abrir
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
