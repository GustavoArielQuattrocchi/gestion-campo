import type { CuadroDetalle } from '../../../data/fincaData'
import { buildCuadroQrUrl } from '../../../utils/cuadroQr'
import QrCodeSvg from '../../qr/QrCodeSvg'

interface Props {
  cuadro: CuadroDetalle
  qrSize?: number
}

export default function CuadroQrLabel({ cuadro, qrSize = 148 }: Props) {
  const url = buildCuadroQrUrl(cuadro.finca, cuadro.id)

  return (
    <article className="cuadro-qr-label">
      <div className="cuadro-qr-label-code">
        <QrCodeSvg value={url} size={qrSize} />
      </div>
      <div className="cuadro-qr-label-body">
        <p className="cuadro-qr-label-finca">{cuadro.finca}</p>
        <h3 className="cuadro-qr-label-nombre">{cuadro.nombre}</h3>
      </div>
    </article>
  )
}
