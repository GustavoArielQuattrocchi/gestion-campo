import { useEffect } from 'react'
import { Printer, X } from 'lucide-react'
import type { CuadroDetalle } from '../../../data/fincaData'
import CuadroQrLabel from './CuadroQrLabel'

interface Props {
  cuadros: CuadroDetalle[]
  title: string
  onClose: () => void
}

export default function CuadroQrPrintSheet({ cuadros, title, onClose }: Props) {
  useEffect(() => {
    document.body.classList.add('cuadro-qr-printing')
    return () => document.body.classList.remove('cuadro-qr-printing')
  }, [])

  return (
    <div className="cuadro-qr-print-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="cuadro-qr-print-toolbar no-print">
        <div>
          <strong>{title}</strong>
          <p>{cuadros.length} etiqueta{cuadros.length === 1 ? '' : 's'} lista{cuadros.length === 1 ? '' : 's'} para imprimir</p>
        </div>
        <div className="cuadro-qr-print-actions">
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>
            <Printer size={16} />
            Imprimir
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose} aria-label="Cerrar">
            <X size={16} />
            Cerrar
          </button>
        </div>
      </div>

      <div className="cuadro-qr-print-grid">
        {cuadros.map(cuadro => (
          <CuadroQrLabel key={cuadro.id} cuadro={cuadro} />
        ))}
      </div>
    </div>
  )
}
