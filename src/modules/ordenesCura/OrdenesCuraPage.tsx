import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useOrdenCuraEditor } from './hooks/useOrdenCuraEditor'
import OrdenCuraForm from './components/OrdenCuraForm'
import ListadoModal from './components/ListadoModal'
import CatalogoModal from './components/CatalogoModal'
import PdfPreviewModal from './components/PdfPreviewModal'
import './ordenesCura.css'

export default function OrdenesCuraPage() {
  const editor = useOrdenCuraEditor()

  return (
    <div className="oc-app">
      <header className="oc-header">
        <div className="oc-header-title">
          <Link to="/escritorio" className="oc-back" aria-label="Volver al escritorio">
            <ChevronLeft size={18} />
          </Link>
          <div>
            <h1>Orden de Cura</h1>
            <p className="oc-subtitle">Agroquímicos</p>
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
            disabled={editor.saving}
          >
            {editor.saving ? 'Guardando…' : 'Guardar'}
          </button>
          <button
            type="button"
            className="oc-btn oc-btn--light"
            onClick={() => editor.setListadoOpen(true)}
          >
            Buscar
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

      <OrdenCuraForm
        form={editor.form}
        items={editor.items}
        factor={editor.factor}
        catalogo={editor.catalogo}
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
          onAbrir={editor.abrirOrden}
          onEliminar={editor.eliminarOrden}
          onClose={() => editor.setListadoOpen(false)}
        />
      ) : null}

      {editor.catalogoOpen ? (
        <CatalogoModal
          catalogo={editor.catalogo}
          onEliminar={editor.eliminarProducto}
          onClose={() => editor.setCatalogoOpen(false)}
        />
      ) : null}

      {editor.pdfPreview ? (
        <PdfPreviewModal
          url={editor.pdfPreview.url}
          oc={editor.pdfPreview.oc}
          onClose={editor.cerrarVistaPdf}
          onDownload={editor.descargarPdf}
        />
      ) : null}
    </div>
  )
}
