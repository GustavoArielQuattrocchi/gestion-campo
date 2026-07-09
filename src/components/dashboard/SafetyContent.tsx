import { useMemo, useState } from 'react'
import { Camera } from 'lucide-react'
import type { InformeAccidente } from '../../hooks/useInformesAccidente'
import { formatTimestamp } from '../../utils/formatTimestamp'

interface Props {
  informes: InformeAccidente[]
  loading: boolean
  error: string | null
  fincasDisponibles: string[]
}

function topFinca(informes: InformeAccidente[]): string {
  if (informes.length === 0) return '—'
  const counts = new Map<string, number>()
  for (const i of informes) {
    counts.set(i.fincaNombre, (counts.get(i.fincaNombre) ?? 0) + 1)
  }
  let max = 0
  let name = '—'
  for (const [finca, n] of counts) {
    if (n > max) {
      max = n
      name = finca
    }
  }
  return name
}

function esteMes(informes: InformeAccidente[]): number {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  return informes.filter(i => {
    const d = i.creadoEn.toDate()
    return d.getFullYear() === y && d.getMonth() === m
  }).length
}

export default function SafetyContent({
  informes,
  loading,
  error,
  fincasDisponibles,
}: Props) {
  const [filtroFinca, setFiltroFinca] = useState('todas')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const sorted = useMemo(() => {
    const filtered =
      filtroFinca === 'todas'
        ? informes
        : informes.filter(i => i.fincaNombre === filtroFinca)
    return [...filtered].sort(
      (a, b) => b.creadoEn.seconds - a.creadoEn.seconds,
    )
  }, [informes, filtroFinca])

  if (loading) {
    return <p className="dashboard-panel-empty">Cargando informes de accidentes...</p>
  }

  if (error) {
    return <p className="dashboard-panel-empty dashboard-panel-empty--error">{error}</p>
  }

  return (
    <>
      <div className="safety-kpis">
        <div className="safety-kpi">
          <div className="safety-kpi-value">{informes.length}</div>
          <div className="safety-kpi-label">Total accidentes</div>
        </div>
        <div className="safety-kpi">
          <div className="safety-kpi-value">{esteMes(informes)}</div>
          <div className="safety-kpi-label">Este mes</div>
        </div>
        <div className="safety-kpi">
          <div className="safety-kpi-value" style={{ fontSize: 16 }}>
            {topFinca(informes)}
          </div>
          <div className="safety-kpi-label">Finca con más incidentes</div>
        </div>
      </div>

      {fincasDisponibles.length > 0 && (
        <div className="partes-labores-filters">
          <label className="partes-labores-filter">
            <span>Finca</span>
            <select value={filtroFinca} onChange={e => setFiltroFinca(e.target.value)}>
              <option value="todas">Todas</option>
              {fincasDisponibles.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="dashboard-panel-empty">
          {informes.length === 0
            ? 'No hay informes de accidentes registrados.'
            : 'Ningún informe coincide con el filtro seleccionado.'}
        </p>
      ) : (
        <ul className="safety-timeline">
          {sorted.map(informe => {
            const expanded = expandedId === informe.id
            return (
              <li key={informe.id} className="safety-item">
                <div className="safety-item-date">
                  {formatTimestamp(informe.creadoEn, 'dd/MM/yy')}
                </div>
                <div className="safety-item-body">
                  <div className="safety-item-header">
                    <strong>{informe.operador}</strong>
                    <span className="safety-item-finca">{informe.fincaNombre}</span>
                    {informe.tieneFoto && (
                      <span className="safety-photo-badge">
                        <Camera size={12} /> Foto
                      </span>
                    )}
                  </div>
                  <p
                    className="safety-item-desc"
                    style={
                      expanded
                        ? undefined
                        : {
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }
                    }
                  >
                    {informe.descripcion}
                  </p>
                  {informe.descripcion.length > 100 && (
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ fontSize: 12, padding: '4px 0' }}
                      onClick={() =>
                        setExpandedId(expanded ? null : informe.id)
                      }
                    >
                      {expanded ? 'Ver menos' : 'Ver más'}
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
