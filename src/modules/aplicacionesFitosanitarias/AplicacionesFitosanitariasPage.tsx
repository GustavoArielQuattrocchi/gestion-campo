import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAplicacionesFitosanitarias } from './hooks/useAplicacionesFitosanitarias'
import OrdenPicker from './components/OrdenPicker'
import TurnoPanel from './components/TurnoPanel'
import '../ordenesCura/ordenesCura.css'
import './aplicacionesFitosanitarias.css'

export default function AplicacionesFitosanitariasPage() {
  const editor = useAplicacionesFitosanitarias()

  return (
    <div className="oc-app">
      <header className="oc-header">
        <div className="oc-header-title">
          <Link to="/escritorio" className="oc-back" aria-label="Volver al escritorio">
            <ChevronLeft size={18} />
          </Link>
          <div>
            <h1>Aplicaciones fitosanitarias</h1>
            <p className="oc-subtitle">Turnos sobre órdenes de cura</p>
          </div>
        </div>
        <div className="oc-btns">
          {editor.orden ? (
            <>
              <button type="button" className="oc-btn oc-btn--light" onClick={editor.nuevoTurno}>
                Nuevo turno
              </button>
              <button type="button" className="oc-btn oc-btn--light" onClick={editor.cerrarOrden}>
                Órdenes
              </button>
            </>
          ) : null}
          <Link to="/ordenes-de-cura" className="oc-btn oc-btn--light" style={{ textDecoration: 'none' }}>
            Ir a OC
          </Link>
        </div>
      </header>

      {editor.banner ? (
        <div className={`oc-banner oc-banner--${editor.banner.type}`}>{editor.banner.text}</div>
      ) : null}

      {editor.loadingOrden ? (
        <div className="oc-main">
          <p className="oc-muted">Cargando orden…</p>
        </div>
      ) : editor.orden ? (
        <TurnoPanel
          orden={editor.orden}
          fincaCatalogo={editor.fincaCatalogo}
          registradoPor={editor.registradoPor}
          fecha={editor.fecha}
          volumenLitros={editor.volumenLitros}
          cuadros={editor.cuadros}
          cuadrosCatalogo={editor.cuadrosCatalogo}
          calculo={editor.calculo}
          turnos={editor.turnosDeOrden}
          turnoId={editor.turnoId}
          readOnly={editor.readOnly}
          saving={editor.saving}
          puedeGuardar={editor.puedeGuardar}
          onFecha={editor.setFecha}
          onVolumen={editor.setVolumenLitros}
          onAddCuadro={editor.addCuadro}
          onRemoveCuadro={editor.removeCuadro}
          onUpdateCuadro={editor.updateCuadro}
          onGuardar={() => void editor.guardar()}
          onNuevoTurno={editor.nuevoTurno}
          onEditarAbierto={editor.editarTurnoAbierto}
          onVerTurno={id => editor.abrirTurno(id, 'ver')}
          onEditarTurno={id => editor.abrirTurno(id, 'editar')}
          onEliminarTurno={id => void editor.eliminarTurno(id)}
        />
      ) : (
        <OrdenPicker
          ordenes={editor.ordenes}
          aplicaciones={editor.aplicaciones}
          loading={editor.loadingList}
          onSelect={id => void editor.seleccionarOrden(id)}
        />
      )}
    </div>
  )
}
