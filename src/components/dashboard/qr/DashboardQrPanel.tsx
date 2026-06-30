import { useMemo, useState } from 'react'
import { ExternalLink, Printer, QrCode, Search } from 'lucide-react'
import { fincas, getCuadrosPorFinca } from '../../../data/fincaData'
import type { CuadroDetalle } from '../../../data/fincaData'
import { buildCuadroQrUrl } from '../../../utils/cuadroQr'
import DashboardPanel from '../DashboardPanel'
import QrCodeSvg from '../../qr/QrCodeSvg'
import CuadroQrPrintSheet from './CuadroQrPrintSheet'

interface Props {
  open: boolean
  onToggle: () => void
}

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase()
}

export default function DashboardQrPanel({ open, onToggle }: Props) {
  const [fincaId, setFincaId] = useState(fincas[0]?.id ?? 'FOA')
  const [busqueda, setBusqueda] = useState('')
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [printTargets, setPrintTargets] = useState<CuadroDetalle[] | null>(null)

  const cuadros = useMemo(() => getCuadrosPorFinca(fincaId), [fincaId])

  const cuadrosFiltrados = useMemo(() => {
    const term = normalizeSearch(busqueda)
    if (!term) return cuadros
    return cuadros.filter(c =>
      [c.nombre, c.variedad, c.vinedo, c.id]
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [cuadros, busqueda])

  const toggleSeleccion = (id: string) => {
    setSeleccionados(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const seleccionarTodosFiltrados = () => {
    setSeleccionados(new Set(cuadrosFiltrados.map(c => c.id)))
  }

  const limpiarSeleccion = () => setSeleccionados(new Set())

  const abrirImpresion = (items: CuadroDetalle[]) => {
    if (items.length === 0) return
    setPrintTargets(items)
  }

  const seleccionadosLista = useMemo(
    () => cuadros.filter(c => seleccionados.has(c.id)),
    [cuadros, seleccionados],
  )

  return (
    <>
      <DashboardPanel
        title={`Códigos QR (${cuadros.length})`}
        icon={<QrCode size={16} />}
        open={open}
        onToggle={onToggle}
      >
        <p className="dashboard-qr-intro">
          Generá e imprimí un QR por cuadro. Al escanearlo en el viñedo se muestran los datos del catálogo.
        </p>

        <label className="dashboard-qr-filter">
          <span>Finca</span>
          <select
            className="form-select"
            value={fincaId}
            onChange={e => {
              setFincaId(e.target.value)
              setSeleccionados(new Set())
              setBusqueda('')
            }}
          >
            {fincas.map(f => (
              <option key={f.id} value={f.id}>{f.nombre}</option>
            ))}
          </select>
        </label>

        <div className="dashboard-qr-search">
          <Search size={16} aria-hidden />
          <input
            type="search"
            className="form-input"
            placeholder="Buscar cuadro, variedad o viñedo..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>

        <div className="dashboard-qr-toolbar">
          <span className="dashboard-qr-count">
            {cuadrosFiltrados.length} de {cuadros.length} cuadros
          </span>
          <div className="dashboard-qr-toolbar-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={seleccionarTodosFiltrados}
              disabled={cuadrosFiltrados.length === 0}
            >
              Seleccionar visibles
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={limpiarSeleccion}
              disabled={seleccionados.size === 0}
            >
              Limpiar
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => abrirImpresion(cuadrosFiltrados)}
              disabled={cuadrosFiltrados.length === 0}
            >
              <Printer size={14} />
              Imprimir finca
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => abrirImpresion(seleccionadosLista)}
              disabled={seleccionadosLista.length === 0}
            >
              <Printer size={14} />
              Imprimir ({seleccionadosLista.length})
            </button>
          </div>
        </div>

        {cuadrosFiltrados.length === 0 ? (
          <p className="dashboard-panel-empty">No hay cuadros que coincidan con la búsqueda.</p>
        ) : (
          <ul className="dashboard-qr-list">
            {cuadrosFiltrados.map(cuadro => {
              const url = buildCuadroQrUrl(cuadro.finca, cuadro.id)
              const checked = seleccionados.has(cuadro.id)
              return (
                <li key={cuadro.id} className={`dashboard-qr-item${checked ? ' is-selected' : ''}`}>
                  <label className="dashboard-qr-item-check">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSeleccion(cuadro.id)}
                    />
                  </label>
                  <div className="dashboard-qr-item-preview">
                    <QrCodeSvg value={url} size={72} />
                  </div>
                  <div className="dashboard-qr-item-info">
                    <strong>{cuadro.nombre}</strong>
                    <span>{cuadro.variedad} · {cuadro.vinedo} · {cuadro.hectareas.toFixed(2)} ha</span>
                    <code className="dashboard-qr-item-id">{cuadro.id}</code>
                  </div>
                  <div className="dashboard-qr-item-actions">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      title="Vista previa al escanear"
                    >
                      <ExternalLink size={14} />
                    </a>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => abrirImpresion([cuadro])}
                      title="Imprimir etiqueta"
                    >
                      <Printer size={14} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </DashboardPanel>

      {printTargets && (
        <CuadroQrPrintSheet
          cuadros={printTargets}
          title={`Etiquetas QR — ${fincaId}`}
          onClose={() => setPrintTargets(null)}
        />
      )}
    </>
  )
}
