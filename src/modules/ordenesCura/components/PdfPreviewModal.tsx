import { useEffect } from 'react'
import { Download, X } from 'lucide-react'

interface Props {
  url: string
  oc: string
  onClose: () => void
  onDownload: () => void
}

export default function PdfPreviewModal({ url, oc, onClose, onDownload }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const iframeSrc = `${url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`

  return (
    <div
      className="oc-pdf-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Vista previa del PDF"
      onClick={onClose}
    >
      <button
        type="button"
        className="oc-pdf-close-fab"
        onClick={e => {
          e.stopPropagation()
          onClose()
        }}
        aria-label="Cerrar vista previa"
      >
        <X size={20} />
        Cerrar
      </button>

      <div className="oc-pdf-sheet" onClick={e => e.stopPropagation()}>
        <header className="oc-pdf-toolbar">
          <div className="oc-pdf-toolbar-info">
            <h3>Vista previa del PDF</h3>
            <p>{oc || 'Orden de cura'}</p>
          </div>
          <div className="oc-pdf-toolbar-actions">
            <button type="button" className="oc-btn oc-btn--green" onClick={onDownload}>
              <Download size={16} />
              Descargar
            </button>
            <button type="button" className="oc-btn oc-btn--secondary" onClick={onClose}>
              <X size={16} />
              Cerrar
            </button>
          </div>
        </header>
        <div className="oc-pdf-frame-wrap">
          <iframe className="oc-pdf-frame" src={iframeSrc} title={`Vista previa ${oc}`} />
        </div>
      </div>
    </div>
  )
}
