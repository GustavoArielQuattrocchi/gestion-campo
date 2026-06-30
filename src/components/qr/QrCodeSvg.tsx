import { useMemo } from 'react'
import qrcodegen from '../../vendor/qrcodegen'

interface Props {
  value: string
  size?: number
  className?: string
  /** Margen blanco alrededor del código (módulos). */
  quietZone?: number
}

function buildQrSvg(value: string, size: number, quietZone: number): string {
  const qr = qrcodegen.QrCode.encodeText(value, qrcodegen.QrCode.Ecc.MEDIUM)
  const modules = qr.size
  const total = modules + quietZone * 2
  const cell = size / total
  const parts: string[] = []

  for (let y = 0; y < modules; y++) {
    for (let x = 0; x < modules; x++) {
      if (!qr.getModule(x, y)) continue
      const px = (x + quietZone) * cell
      const py = (y + quietZone) * cell
      parts.push(`<rect x="${px}" y="${py}" width="${cell}" height="${cell}" />`)
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-hidden="true"><rect width="100%" height="100%" fill="#ffffff"/><g fill="#111827">${parts.join('')}</g></svg>`
}

export default function QrCodeSvg({ value, size = 160, className, quietZone = 2 }: Props) {
  const svg = useMemo(() => buildQrSvg(value, size, quietZone), [value, size, quietZone])

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
