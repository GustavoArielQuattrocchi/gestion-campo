import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAuth } from '../../providers/AuthProvider'
import { PUNTO_STOCK_LABEL, PUNTOS_STOCK, type PuntoStock } from './constants'
import { useStockAdmin } from './hooks/useStockAdmin'
import { parseCantidadStock, productoKeyFromNombre } from './utils/stockMath'
import type { AplicacionFitosanitaria } from '../aplicacionesFitosanitarias/types'
import '../ordenesCura/ordenesCura.css'
import './stock.css'

export default function StockAdminPage() {
  const { user } = useAuth()
  const editor = useStockAdmin()
  const [tab, setTab] = useState<'saldos' | 'pendientes' | 'movimientos' | 'cargar'>('saldos')

  return (
    <div className="oc-app">
      <header className="oc-header">
        <div className="oc-header-title">
          <Link to="/escritorio" className="oc-back" aria-label="Volver al escritorio">
            <ChevronLeft size={18} />
          </Link>
          <div>
            <h1>Stock</h1>
            <p className="oc-subtitle">Saldos, relevamientos y retiros de aplicaciones</p>
          </div>
        </div>
        <div className="oc-btns">
          <Link to="/aplicaciones-fitosanitarias" className="oc-btn oc-btn--light" style={{ textDecoration: 'none' }}>
            Aplicaciones
          </Link>
          <Link to="/stock" className="oc-btn oc-btn--light" style={{ textDecoration: 'none' }}>
            App Stock
          </Link>
        </div>
      </header>

      {editor.banner ? (
        <div className={`oc-banner oc-banner--${editor.banner.type}`}>{editor.banner.text}</div>
      ) : null}

      <div className="oc-main">
        <div className="stock-tabs">
          {(['saldos', 'pendientes', 'movimientos', 'cargar'] as const).map(key => (
            <button
              key={key}
              type="button"
              className={`oc-btn ${tab === key ? 'oc-btn--primary' : 'oc-btn--light'}`}
              onClick={() => setTab(key)}
            >
              {key === 'saldos' ? 'Saldos' : key === 'pendientes' ? 'Pendientes' : key === 'movimientos' ? 'Historial' : 'Cargar / ajustar'}
            </button>
          ))}
        </div>

        {tab === 'saldos' ? <SaldosPanel editor={editor} /> : null}
        {tab === 'pendientes' ? <PendientesPanel editor={editor} /> : null}
        {tab === 'movimientos' ? <HistorialPanel editor={editor} /> : null}
        {tab === 'cargar' ? <CargaPanel editor={editor} operador={user?.email ?? 'escritorio'} /> : null}
      </div>
    </div>
  )
}

function SaldosPanel({ editor }: { editor: ReturnType<typeof useStockAdmin> }) {
  return (
    <section className="oc-card">
      <div className="oc-tools">
        <h2>Saldos por depósito</h2>
        <select
          className="oc-input"
          value={editor.puntoFiltro}
          onChange={e => editor.setPuntoFiltro(e.target.value as PuntoStock | 'todos')}
        >
          <option value="todos">Todos</option>
          {PUNTOS_STOCK.map(p => <option key={p} value={p}>{PUNTO_STOCK_LABEL[p]}</option>)}
        </select>
      </div>
      {editor.loading ? <p className="oc-muted">Cargando…</p> : null}
      <div className="oc-table-responsive">
        <table className="oc-table">
          <thead>
            <tr>
              <th>Depósito</th>
              <th>Producto</th>
              <th>I.A.</th>
              <th>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {editor.saldos.length === 0 ? (
              <tr><td colSpan={4} className="oc-empty">Sin stock cargado</td></tr>
            ) : editor.saldos.map(s => (
              <tr key={s.id} className={s.cantidad < 0 ? 'stock-row-neg' : undefined}>
                <td>{s.punto}</td>
                <td>{s.producto}</td>
                <td>{s.ia || '—'}</td>
                <td>{s.cantidad} {s.presentacion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function PendientesPanel({ editor }: { editor: ReturnType<typeof useStockAdmin> }) {
  const [asignaciones, setAsignaciones] = useState<Record<string, PuntoStock>>({})

  return (
    <>
      <section className="oc-card">
        <h2>Transferencias a confirmar</h2>
        {editor.pendientesTransfer.length === 0 ? <p className="oc-muted">No hay transferencias pendientes.</p> : (
          <ul className="stock-pending-list">
            {editor.pendientesTransfer.map(m => (
              <li key={m.id}>
                <div>
                  <strong>{m.producto}</strong> {m.cantidad} {m.presentacion}
                  <p className="oc-muted">{m.puntoOrigen} → {m.puntoDestino} · {m.operador}</p>
                </div>
                <div className="oc-btns">
                  <button type="button" className="oc-btn oc-btn--primary" disabled={editor.saving} onClick={() => void editor.confirmarTransfer(m.id)}>Confirmar</button>
                  <button type="button" className="oc-btn oc-btn--slate" disabled={editor.saving} onClick={() => void editor.rechazarTransfer(m.id)}>Rechazar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="oc-card">
        <h2>Productos propuestos</h2>
        {editor.propuestasPendientes.length === 0 ? <p className="oc-muted">No hay altas pendientes.</p> : (
          <ul className="stock-pending-list">
            {editor.propuestasPendientes.map(p => (
              <li key={p.id}>
                <div>
                  <strong>{p.nombre}</strong> · {p.categoria} · {p.presentacion}
                  <p className="oc-muted">{p.ia} · {p.operador}</p>
                </div>
                <div className="oc-btns">
                  <button type="button" className="oc-btn oc-btn--primary" disabled={editor.saving} onClick={() => void editor.confirmarProducto(p.id)}>Confirmar</button>
                  <button type="button" className="oc-btn oc-btn--slate" disabled={editor.saving} onClick={() => void editor.rechazarProducto(p.id)}>Rechazar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="oc-card">
        <h2>Turnos sin depósito</h2>
        <p className="oc-muted">Los turnos viejos hay que asignarles un punto para descontar el gasto.</p>
        {editor.turnosSinDeposito.length === 0 ? <p className="oc-muted">Todos los turnos tienen depósito.</p> : (
          <ul className="stock-pending-list">
            {editor.turnosSinDeposito.map(turno => (
              <TurnoAsignarRow
                key={turno.id}
                turno={turno}
                punto={asignaciones[turno.id] ?? 'FOA'}
                onPunto={punto => setAsignaciones(prev => ({ ...prev, [turno.id]: punto }))}
                saving={editor.saving}
                onAsignar={async (confirmarNegativo) => {
                  const faltantes = await editor.asignarDepositoTurno(turno, asignaciones[turno.id] ?? 'FOA', confirmarNegativo)
                  if (faltantes.length > 0) {
                    const ok = window.confirm(
                      `El retiro deja saldo negativo:\n${faltantes.map(f => `${f.producto}: hay ${f.disponible}, se retiran ${f.solicitado} ${f.presentacion}`).join('\n')}\n\n¿Confirmar igual?`,
                    )
                    if (ok) await editor.asignarDepositoTurno(turno, asignaciones[turno.id] ?? 'FOA', true)
                  }
                }}
              />
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

function TurnoAsignarRow({
  turno,
  punto,
  onPunto,
  saving,
  onAsignar,
}: {
  turno: AplicacionFitosanitaria
  punto: PuntoStock
  onPunto: (punto: PuntoStock) => void
  saving: boolean
  onAsignar: (confirmarNegativo: boolean) => Promise<void>
}) {
  return (
    <li>
      <div>
        <strong>{turno.oc}</strong> · {turno.fecha.toDate().toLocaleDateString('es-AR')}
        <p className="oc-muted">{turno.productos.map(p => `${p.producto} ${p.gasto ?? '—'} ${p.presentacion}`).join(' · ')}</p>
      </div>
      <div className="oc-btns">
        <select className="oc-input" value={punto} onChange={e => onPunto(e.target.value as PuntoStock)}>
          {PUNTOS_STOCK.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <button type="button" className="oc-btn oc-btn--primary" disabled={saving} onClick={() => void onAsignar(false)}>
          Asignar y descontar
        </button>
      </div>
    </li>
  )
}

function HistorialPanel({ editor }: { editor: ReturnType<typeof useStockAdmin> }) {
  return (
    <section className="oc-card">
      <h2>Movimientos</h2>
      <div className="oc-table-responsive">
        <table className="oc-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Punto</th>
              <th>Quién</th>
            </tr>
          </thead>
          <tbody>
            {editor.movimientos.length === 0 ? (
              <tr><td colSpan={7} className="oc-empty">Sin movimientos</td></tr>
            ) : editor.movimientos.map(m => (
              <tr key={m.id}>
                <td>{m.created_at.toDate().toLocaleString('es-AR')}</td>
                <td>{m.tipo}</td>
                <td>{m.estado}</td>
                <td>{m.producto}</td>
                <td>{m.cantidad} {m.presentacion}</td>
                <td>{m.punto ?? `${m.puntoOrigen ?? ''} → ${m.puntoDestino ?? ''}`}</td>
                <td>{m.operador}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function CargaPanel({
  editor,
  operador,
}: {
  editor: ReturnType<typeof useStockAdmin>
  operador: string
}) {
  void operador
  const [modo, setModo] = useState<'ingreso' | 'conteo' | 'ajuste' | 'transferencia'>('ingreso')
  const [punto, setPunto] = useState<PuntoStock>('FOA')
  const [destino, setDestino] = useState<PuntoStock>('FLP')
  const [productoId, setProductoId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [delta, setDelta] = useState('')
  const [nota, setNota] = useState('')

  const producto = useMemo(
    () => editor.catalogo.find(p => p.id === productoId),
    [editor.catalogo, productoId],
  )

  const submit = () => {
    if (!producto) return
    const n = parseCantidadStock(cantidad)
    const d = Number(delta.replace(',', '.'))
    const base = {
      punto,
      producto: producto.nombre,
      productoKey: productoKeyFromNombre(producto.nombre),
      ia: producto.ia,
      presentacion: producto.presentacion,
      cantidad: n ?? 0,
      nota,
    }
    if (modo === 'transferencia') {
      if (n == null || n <= 0) return
      void editor.transferirAdmin({
        ...base,
        puntoOrigen: punto,
        puntoDestino: destino,
        cantidad: n,
      })
      return
    }
    if (modo === 'ajuste') {
      if (!Number.isFinite(d) || d === 0) return
      void editor.cargarAdmin(base, 'ajuste', d)
      return
    }
    if (n == null) return
    void editor.cargarAdmin(base, modo)
  }

  return (
    <section className="oc-card">
      <h2>Cargar, ajustar o transferir</h2>
      <div className="oc-row">
        <label>Acción
          <select className="oc-input" value={modo} onChange={e => setModo(e.target.value as typeof modo)}>
            <option value="ingreso">Ingreso</option>
            <option value="conteo">Conteo</option>
            <option value="ajuste">Ajuste (+/−)</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </label>
        <label>Depósito {modo === 'transferencia' ? 'origen' : ''}
          <select className="oc-input" value={punto} onChange={e => setPunto(e.target.value as PuntoStock)}>
            {PUNTOS_STOCK.map(p => <option key={p} value={p}>{PUNTO_STOCK_LABEL[p]}</option>)}
          </select>
        </label>
        {modo === 'transferencia' ? (
          <label>Destino
            <select className="oc-input" value={destino} onChange={e => setDestino(e.target.value as PuntoStock)}>
              {PUNTOS_STOCK.filter(p => p !== punto).map(p => <option key={p} value={p}>{PUNTO_STOCK_LABEL[p]}</option>)}
            </select>
          </label>
        ) : null}
      </div>
      <label>Producto
        <select className="oc-input" value={productoId} onChange={e => setProductoId(e.target.value)}>
          <option value="">Elegí un producto</option>
          {editor.catalogo.map(p => <option key={p.id} value={p.id}>{p.nombre} · {p.presentacion}</option>)}
        </select>
      </label>
      {modo === 'ajuste' ? (
        <label>Delta (negativo resta)
          <input className="oc-input" value={delta} onChange={e => setDelta(e.target.value)} />
        </label>
      ) : (
        <label>Cantidad
          <input className="oc-input" value={cantidad} onChange={e => setCantidad(e.target.value)} />
        </label>
      )}
      <label>Nota
        <input className="oc-input" value={nota} onChange={e => setNota(e.target.value)} />
      </label>
      <button type="button" className="oc-btn oc-btn--primary" disabled={editor.saving || !producto} onClick={submit}>
        {editor.saving ? 'Guardando…' : 'Guardar'}
      </button>
    </section>
  )
}
