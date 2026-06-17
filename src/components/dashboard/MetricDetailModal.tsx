import { useEffect, useRef } from 'react'
import { X, Clock } from 'lucide-react'
import type { MetricColumn } from '../../utils/getMetricDetail'
import { useFocusTrap } from '../../hooks/useFocusTrap'

interface Props {
  open: boolean
  title: string
  accentColor?: string
  loading: boolean
  columns: MetricColumn[]
  rows: Record<string, string>[]
  summary?: string
  onClose: () => void
}

function rowKey(row: Record<string, string>, columns: MetricColumn[], index: number): string {
  const parts = columns.map(col => row[col.key] ?? '').join('\0')
  return parts ? `${parts}::${index}` : String(index)
}

export default function MetricDetailModal({
  open,
  title,
  accentColor = '#3b82f6',
  loading,
  columns,
  rows,
  summary,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(dialogRef, open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="metric-modal-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="metric-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="metric-modal-title"
        aria-describedby={summary ? 'metric-modal-summary' : undefined}
        onClick={e => e.stopPropagation()}
        style={{ borderTopColor: accentColor }}
      >
        <header className="metric-modal-header">
          <h2 id="metric-modal-title">{title}</h2>
          <button
            type="button"
            className="metric-modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </header>

        <div className="metric-modal-body">
          {loading ? (
            <div className="metric-modal-loading">
              <Clock size={28} />
              <p>Cargando detalle...</p>
            </div>
          ) : rows.length === 0 ? (
            <p className="metric-modal-empty">No hay registros para mostrar con los filtros actuales.</p>
          ) : (
            <>
              {summary && (
                <p id="metric-modal-summary" className="metric-modal-summary">
                  {summary}
                </p>
              )}
              <div className="metric-modal-table-wrap">
                <table className="data-table metric-modal-table">
                  <thead>
                    <tr>
                      {columns.map(col => (
                        <th key={col.key} scope="col">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={rowKey(row, columns, i)}>
                        {columns.map(col => (
                          <td key={col.key}>{row[col.key] ?? '—'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
