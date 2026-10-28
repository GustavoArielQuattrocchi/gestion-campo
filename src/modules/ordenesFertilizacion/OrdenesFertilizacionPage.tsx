import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useOrdenFertilizacionEditor } from './hooks/useOrdenFertilizacionEditor'
import OrdenFertilizacionForm from './components/OrdenFertilizacionForm'
import ListadoModal from './components/ListadoModal'
import CatalogoModal from '../ordenesCura/components/CatalogoModal'
import PdfPreviewModal from '../ordenesCura/components/PdfPreviewModal'
import '../ordenesCura/ordenesCura.css'

export default function OrdenesFertilizacionPage() {
  const editor = useOrdenFertilizacionEditor()

  return (
    <div className="oc-app">
      <header className="oc-header">
        <div className="oc-header-title">
          <Link to="/escritorio" className="oc-back" aria-label="Volver al escritorio">
            <ChevronLeft size={18} />
          </Link>
          <div>
            <h1>Orden de Fertilización</h1>
            <p className="oc-subtitle">Fertilización</p>
          </div>
        </div>
        <div className="oc-btns">
          <button type="button" className="oc-btn oc-btn--primary" onClick={editor.nueva}>
            Nueva
          </button>
          <button
            type="button"
            className="oc-btn oc-btn--light"
            onClick={editor.guardar}
            disabled={editor.saving || editor.readOnly}
          >
            {editor.saving ? 'Guardando…' : 'Guardar'}
          </button>
          <button
            type="button"
            className="oc-btn oc-btn--light"
            onClick={() => editor.setListadoOpen(true)}
          >
            Órdenes
          </button>
          <button type="button" className="oc-btn oc-btn--warning" onClick={editor.exportarPdf}>
            Vista PDF
          </button>
          <button type="button" className="oc-btn oc-btn--excel" onClick={editor.exportarExcel}>
            Excel 💾
          </button>
        </div>
      </header>

      {editor.banner ? (
        <div className={`oc-banner oc-banner--${editor.banner.type}`}>{editor.banner.text}</div>
      ) : null}

      <OrdenFertilizacionForm
        form={editor.form}
        items={editor.items}
        catalogo={editor.catalogo}
        readOnly={editor.readOnly}
        onField={editor.setField}
        onItemChange={editor.updateItem}
        onAddItem={editor.addItem}
        onRemoveItem={editor.removeItem}
        onClearItems={editor.clearItems}
        onOpenCatalogo={() => editor.setCatalogoOpen(true)}
      />

      {editor.listadoOpen ? (
        <ListadoModal
          ordenes={editor.ordenes}
          busyPdfId={editor.busyPdfId}
          onVer={editor.abrirOrden}
          onPdf={ordenId => void editor.vistaPdfOrden(ordenId)}
          onEliminar={ordenId => void editor.eliminarOrden(ordenId)}
          onClose={() => editor.setListadoOpen(false)}
        />
      ) : null}

      {editor.catalogoOpen ? (
        <CatalogoModal
          catalogo={editor.catalogo}
          onAlta={editor.agregarProducto}
          onEliminar={id => void editor.eliminarProducto(id)}
          onClose={() => editor.setCatalogoOpen(false)}
          closeLabel="Volver a la OF"
        />
      ) : null}

      {editor.pdfPreview ? (
        <PdfPreviewModal
          url={editor.pdfPreview.url}
          oc={editor.pdfPreview.of || 'Orden de fertilización'}
          onClose={editor.cerrarVistaPdf}
          onDownload={editor.descargarPdf}
        />
      ) : null}
    </div>
  )
}
