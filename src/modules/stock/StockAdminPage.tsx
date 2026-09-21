import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { AGRO_CATEGORIAS, AGRO_MANEJO_CATALOGO, AGRO_UM_OPTIONS } from '../../data/agroQuimicos'
import { useAuth } from '../../providers/AuthProvider'
import { PUNTO_STOCK_LABEL, PUNTOS_STOCK, type PuntoStock } from './constants'
import { useStockAdmin } from './hooks/useStockAdmin'
import { faltaNotaSiBaja, parseCantidadStock, productoKeyFromNombre } from './utils/stockMath'
import type { StockSaldo } from './types'
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

type AccionDeposito =
  | { kind: 'agregar' }
  | { kind: 'alta' }
  | { kind: 'editar'; saldo: StockSaldo }
  | { kind: 'quitar'; saldo: StockSaldo }

function SaldosPanel({ editor }: { editor: ReturnType<typeof useStockAdmin> }) {
  const [accion, setAccion] = useState<AccionDeposito | null>(null)
  const punto = editor.puntoFiltro

  useEffect(() => {
    setAccion(null)
  }, [punto])

  return (
    <section className="oc-card">
      <div className="stock-deposito-tabs" role="tablist" aria-label="Depósitos">
        {PUNTOS_STOCK.map(p => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={punto === p}
            className={`oc-btn ${punto === p ? 'oc-btn--primary' : 'oc-btn--light'}`}
            onClick={() => editor.setPuntoFiltro(p)}
          >
            {PUNTO_STOCK_LABEL[p]}
          </button>
        ))}
      </div>

      <div className="oc-tools">
        <h2>Saldos · {PUNTO_STOCK_LABEL[punto]}</h2>
        <div className="oc-tools-right">
          <button type="button" className="oc-btn oc-btn--light" onClick={() => setAccion({ kind: 'agregar' })}>
            Cargar producto
          </button>
          <button type="button" className="oc-btn oc-btn--primary" onClick={() => setAccion({ kind: 'alta' })}>
            Dar de alta
          </button>
        </div>
      </div>

      {accion?.kind === 'agregar' ? (
        <CargarProductoDepositoForm
          editor={editor}
          punto={punto}
          onClose={() => setAccion(null)}
        />
      ) : null}
      {accion?.kind === 'alta' ? (
        <AltaProductoDepositoForm
          editor={editor}
          punto={punto}
          onClose={() => setAccion(null)}
        />
      ) : null}
      {accion?.kind === 'editar' ? (
        <EditarSaldoForm
          editor={editor}
          saldo={accion.saldo}
          onClose={() => setAccion(null)}
        />
      ) : null}
      {accion?.kind === 'quitar' ? (
        <QuitarProductoForm
          editor={editor}
          saldo={accion.saldo}
          onClose={() => setAccion(null)}
        />
      ) : null}

      {editor.loading ? <p className="oc-muted">Cargando…</p> : null}
      <div className="oc-table-responsive">
        <table className="oc-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>I.A.</th>
              <th>Saldo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {editor.saldosVista.length === 0 ? (
              <tr><td colSpan={4} className="oc-empty">Sin productos en este depósito</td></tr>
            ) : editor.saldosVista.map(s => (
              <tr key={s.id} className={s.cantidad < 0 ? 'stock-row-neg' : undefined}>
                <td>{s.producto}</td>
                <td>{s.ia || '—'}</td>
                <td>{s.cantidad} {s.presentacion}</td>
                <td>
                  <div className="oc-btns">
                    <button
                      type="button"
                      className="oc-btn oc-btn--light"
                      disabled={editor.saving}
                      onClick={() => setAccion({ kind: 'editar', saldo: s })}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="oc-btn oc-btn--danger"
                      disabled={editor.saving}
                      onClick={() => setAccion({ kind: 'quitar', saldo: s })}
                    >
                      Quitar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function CargarProductoDepositoForm({
  editor,
  punto,
  onClose,
}: {
  editor: ReturnType<typeof useStockAdmin>
  punto: PuntoStock
  onClose: () => void
}) {
  const [productoId, setProductoId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [nota, setNota] = useState('')
  const keysEnDeposito = useMemo(
    () => new Set(editor.saldosVista.map(s => s.productoKey)),
    [editor.saldosVista],
  )
  const disponibles = useMemo(
    () => editor.catalogo.filter(p => !keysEnDeposito.has(productoKeyFromNombre(p.nombre))),
    [editor.catalogo, keysEnDeposito],
  )
  const producto = editor.catalogo.find(p => p.id === productoId)

  const submit = () => {
    if (!producto) return
    const n = parseCantidadStock(cantidad)
    if (n == null || n <= 0) {
      editor.setBanner({ type: 'error', text: 'Revisá la cantidad.' })
      return
    }
    void editor.cargarAdmin({
      punto,
      producto: producto.nombre,
      productoKey: productoKeyFromNombre(producto.nombre),
      ia: producto.ia,
      presentacion: producto.presentacion,
      cantidad: n,
      nota,
    }, 'ingreso').then(ok => { if (ok) onClose() })
  }

  return (
    <div className="stock-inline-form">
      <h3>Cargar producto existente</h3>
      <label>Producto
        <select className="oc-input" value={productoId} onChange={e => setProductoId(e.target.value)}>
          <option value="">Elegí un producto</option>
          {disponibles.map(p => (
            <option key={p.id} value={p.id}>{p.nombre} · {p.presentacion}</option>
          ))}
        </select>
      </label>
      <label>Cantidad
        <input className="oc-input" value={cantidad} onChange={e => setCantidad(e.target.value)} inputMode="decimal" />
      </label>
      <label>Nota
        <input className="oc-input" value={nota} onChange={e => setNota(e.target.value)} />
      </label>
      <div className="oc-btns">
        <button type="button" className="oc-btn oc-btn--primary" disabled={editor.saving || !producto} onClick={submit}>
          {editor.saving ? 'Guardando…' : 'Cargar'}
        </button>
        <button type="button" className="oc-btn oc-btn--slate" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  )
}

function AltaProductoDepositoForm({
  editor,
  punto,
  onClose,
}: {
  editor: ReturnType<typeof useStockAdmin>
  punto: PuntoStock
  onClose: () => void
}) {
  const [categoria, setCategoria] = useState<(typeof AGRO_CATEGORIAS)[number]>('Fungicida')
  const [nombre, setNombre] = useState('')
  const [ia, setIa] = useState('')
  const [presentacion, setPresentacion] = useState<(typeof AGRO_UM_OPTIONS)[number]>('kg')
  const [management, setManagement] = useState<(typeof AGRO_MANEJO_CATALOGO)[number]>('Convencional')
  const [cantidad, setCantidad] = useState('')

  const submit = () => {
    if (!nombre.trim()) {
      editor.setBanner({ type: 'error', text: 'Completá el nombre del producto.' })
      return
    }
    let inicial: number | undefined
    if (cantidad.trim()) {
      const parsed = parseCantidadStock(cantidad)
      if (parsed == null || parsed <= 0) {
        editor.setBanner({ type: 'error', text: 'Revisá la cantidad inicial.' })
        return
      }
      inicial = parsed
    }
    void editor.altaProductoAdmin({
      categoria,
      nombre: nombre.trim(),
      ia: ia.trim(),
      presentacion,
      dosis_ha: '',
      description: '',
      management,
    }, punto, inicial).then(ok => { if (ok) onClose() })
  }

  return (
    <div className="stock-inline-form">
      <h3>Dar de alta un producto</h3>
      <p className="oc-muted">Queda en el catálogo. Si cargás cantidad, también entra a {PUNTO_STOCK_LABEL[punto]}.</p>
      <div className="oc-row">
        <label>Grupo
          <select className="oc-input" value={categoria} onChange={e => setCategoria(e.target.value as typeof categoria)}>
            {AGRO_CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>Nombre
          <input className="oc-input" value={nombre} onChange={e => setNombre(e.target.value)} />
        </label>
      </div>
      <div className="oc-row">
        <label>I.A.
          <input className="oc-input" value={ia} onChange={e => setIa(e.target.value)} />
        </label>
        <label>UM
          <select className="oc-input" value={presentacion} onChange={e => setPresentacion(e.target.value as typeof presentacion)}>
            {AGRO_UM_OPTIONS.map(um => <option key={um} value={um}>{um}</option>)}
          </select>
        </label>
      </div>
      <div className="oc-row">
        <label>Manejo
          <select className="oc-input" value={management} onChange={e => setManagement(e.target.value as typeof management)}>
            {AGRO_MANEJO_CATALOGO.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label>Cantidad inicial (opcional)
          <input className="oc-input" value={cantidad} onChange={e => setCantidad(e.target.value)} inputMode="decimal" />
        </label>
      </div>
      <div className="oc-btns">
        <button type="button" className="oc-btn oc-btn--primary" disabled={editor.saving} onClick={submit}>
          {editor.saving ? 'Guardando…' : 'Dar de alta'}
        </button>
        <button type="button" className="oc-btn oc-btn--slate" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  )
}

function EditarSaldoForm({
  editor,
  saldo,
  onClose,
}: {
  editor: ReturnType<typeof useStockAdmin>
  saldo: StockSaldo
  onClose: () => void
}) {
  const [modo, setModo] = useState<'conteo' | 'ajuste'>('conteo')
  const [producto, setProducto] = useState(saldo.producto)
  const [ia, setIa] = useState(saldo.ia)
  const [presentacion, setPresentacion] = useState(saldo.presentacion)
  const [cantidad, setCantidad] = useState(String(saldo.cantidad))
  const [delta, setDelta] = useState('')
  const [nota, setNota] = useState('')

  const umOptions = AGRO_UM_OPTIONS.includes(presentacion as (typeof AGRO_UM_OPTIONS)[number])
    ? AGRO_UM_OPTIONS
    : ([presentacion, ...AGRO_UM_OPTIONS] as const)

  const siguiente = useMemo(() => {
    if (modo === 'conteo') {
      const n = parseCantidadStock(cantidad)
      return n
    }
    const d = Number(delta.replace(',', '.'))
    return Number.isFinite(d) ? saldo.cantidad + d : null
  }, [modo, cantidad, delta, saldo.cantidad])

  const bajaSinNota = siguiente != null && faltaNotaSiBaja(saldo.cantidad, siguiente, nota)

  const submit = () => {
    if (!producto.trim()) {
      editor.setBanner({ type: 'error', text: 'Completá el nombre del producto.' })
      return
    }
    if (siguiente == null) {
      editor.setBanner({ type: 'error', text: 'Revisá la cantidad o el ajuste.' })
      return
    }
    if (modo === 'ajuste') {
      const d = Number(delta.replace(',', '.'))
      if (!Number.isFinite(d) || d === 0) {
        editor.setBanner({ type: 'error', text: 'El ajuste no puede ser cero.' })
        return
      }
    }
    if (bajaSinNota) {
      editor.setBanner({ type: 'error', text: 'Indicá una nota: el saldo baja.' })
      return
    }
    void editor.actualizarSaldoAdmin(saldo, {
      producto,
      ia,
      presentacion,
      modo,
      cantidad: modo === 'conteo' ? siguiente : undefined,
      delta: modo === 'ajuste' ? Number(delta.replace(',', '.')) : undefined,
      nota,
    }).then(ok => { if (ok) onClose() })
  }

  return (
    <div className="stock-inline-form">
      <h3>Editar {saldo.producto}</h3>
      <p className="oc-muted">Saldo actual: {saldo.cantidad} {saldo.presentacion}</p>
      <label>Modo
        <select className="oc-input" value={modo} onChange={e => setModo(e.target.value as typeof modo)}>
          <option value="conteo">Conteo (dejar en…)</option>
          <option value="ajuste">Ajuste (+/−)</option>
        </select>
      </label>
      <div className="oc-row">
        <label>Producto
          <input className="oc-input" value={producto} onChange={e => setProducto(e.target.value)} />
        </label>
        <label>I.A.
          <input className="oc-input" value={ia} onChange={e => setIa(e.target.value)} />
        </label>
      </div>
      <div className="oc-row">
        <label>UM
          <select className="oc-input" value={presentacion} onChange={e => setPresentacion(e.target.value)}>
            {umOptions.map(um => <option key={um} value={um}>{um}</option>)}
          </select>
        </label>
        {modo === 'conteo' ? (
          <label>Cantidad
            <input className="oc-input" value={cantidad} onChange={e => setCantidad(e.target.value)} inputMode="decimal" />
          </label>
        ) : (
          <label>Delta (negativo resta)
            <input className="oc-input" value={delta} onChange={e => setDelta(e.target.value)} />
          </label>
        )}
      </div>
      <label>Nota {bajaSinNota ? '(obligatoria: el saldo baja)' : '(obligatoria si baja el saldo)'}
        <input className="oc-input" value={nota} onChange={e => setNota(e.target.value)} />
      </label>
      <div className="oc-btns">
        <button type="button" className="oc-btn oc-btn--primary" disabled={editor.saving} onClick={submit}>
          {editor.saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <button type="button" className="oc-btn oc-btn--slate" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  )
}

function QuitarProductoForm({
  editor,
  saldo,
  onClose,
}: {
  editor: ReturnType<typeof useStockAdmin>
  saldo: StockSaldo
  onClose: () => void
}) {
  const [nota, setNota] = useState('')

  const submit = () => {
    if (!nota.trim()) {
      editor.setBanner({ type: 'error', text: 'Indicá una nota para quitar el producto.' })
      return
    }
    void editor.quitarProductoAdmin(saldo, nota).then(ok => { if (ok) onClose() })
  }

  return (
    <div className="stock-inline-form">
      <h3>Quitar de {PUNTO_STOCK_LABEL[saldo.punto]}</h3>
      <p className="oc-muted">
        Se saca {saldo.producto} ({saldo.cantidad} {saldo.presentacion}) de este depósito. El catálogo no se borra.
      </p>
      <label>Nota (obligatoria)
        <input className="oc-input" value={nota} onChange={e => setNota(e.target.value)} />
      </label>
      <div className="oc-btns">
        <button type="button" className="oc-btn oc-btn--danger" disabled={editor.saving} onClick={submit}>
          {editor.saving ? 'Quitando…' : 'Quitar del depósito'}
        </button>
        <button type="button" className="oc-btn oc-btn--slate" onClick={onClose}>Cancelar</button>
      </div>
    </div>
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
      const actual = editor.saldos.find(s => s.punto === punto && s.productoKey === base.productoKey)?.cantidad ?? 0
      if (faltaNotaSiBaja(actual, actual + d, nota)) {
        editor.setBanner({ type: 'error', text: 'Indicá una nota: el saldo baja.' })
        return
      }
      void editor.cargarAdmin(base, 'ajuste', d)
      return
    }
    if (n == null) return
    if (modo === 'conteo') {
      const actual = editor.saldos.find(s => s.punto === punto && s.productoKey === base.productoKey)?.cantidad ?? 0
      if (faltaNotaSiBaja(actual, n, nota)) {
        editor.setBanner({ type: 'error', text: 'Indicá una nota: el saldo baja.' })
        return
      }
    }
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
      <label>Nota (obligatoria si baja el saldo)
        <input className="oc-input" value={nota} onChange={e => setNota(e.target.value)} />
      </label>
      <button type="button" className="oc-btn oc-btn--primary" disabled={editor.saving || !producto} onClick={submit}>
        {editor.saving ? 'Guardando…' : 'Guardar'}
      </button>
    </section>
  )
}
