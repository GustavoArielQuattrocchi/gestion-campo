import type { jsPDF } from 'jspdf'
import { computeDosisAplicacion } from './dosis'
import type { OrdenFertilizacionWithItems } from '../types'

export interface OrdenExport {
  of: string
  fecha: string
  finca: string
  cultivo: string
  manejo: string
  tecnico: string
  responsable: string
  cuartel: string
  indicaciones: string
}

export interface ItemExport {
  producto: string
  grupo: string
  ia: string
  presentacion: string
  dosis_ha: string
  superficie: string
  dosis_aplicacion: string
  obs: string
}

const BRAND = {
  green: [22, 163, 74] as const,
  greenDark: [21, 128, 61] as const,
  greenLight: [240, 253, 244] as const,
  grayBg: [249, 250, 251] as const,
  grayBorder: [229, 231, 235] as const,
  grayMuted: [107, 114, 128] as const,
  grayText: [55, 65, 81] as const,
  grayDark: [17, 24, 39] as const,
  white: [255, 255, 255] as const,
}

const PAGE_W = 210
const MARGIN = 14
const CONTENT_W = PAGE_W - MARGIN * 2
const FOOTER_Y = 287

async function loadJsPdf() {
  const { jsPDF: JsPdf } = await import('jspdf')
  return JsPdf
}

const TABLE_COLS = [
  { key: 'producto', label: 'Producto', w: 30 },
  { key: 'grupo', label: 'Grupo', w: 16 },
  { key: 'ia', label: 'Ing. activo', w: 24 },
  { key: 'presentacion', label: 'Pres.', w: 14 },
  { key: 'dosis_ha', label: 'Dosis/ha', w: 18 },
  { key: 'superficie', label: 'Superficie', w: 22 },
  { key: 'dosis_aplicacion', label: 'Dosis/aplic.', w: 24 },
  { key: 'obs', label: 'Observaciones', w: 34 },
] as const

function safeName(of: string): string {
  const base = of.trim() || 'orden-fertilizacion'
  return base.replace(/[^\w-]+/g, '_')
}

function display(value: string, fallback = '—'): string {
  const trimmed = value.trim()
  return trimmed || fallback
}

function formatFechaLabel(fecha: string): string {
  if (!fecha) return '—'
  const [y, m, d] = fecha.split('-')
  if (!y || !m || !d) return fecha
  return `${d}/${m}/${y}`
}

function setRgb(pdf: jsPDF, [r, g, b]: readonly [number, number, number]) {
  pdf.setTextColor(r, g, b)
}

function setFillRgb(pdf: jsPDF, [r, g, b]: readonly [number, number, number]) {
  pdf.setFillColor(r, g, b)
}

function setDrawRgb(pdf: jsPDF, [r, g, b]: readonly [number, number, number]) {
  pdf.setDrawColor(r, g, b)
}

function drawPageHeader(pdf: jsPDF, orden: OrdenExport) {
  setFillRgb(pdf, BRAND.greenDark)
  pdf.rect(0, 0, PAGE_W, 36, 'F')

  setRgb(pdf, BRAND.white)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.text('Orden de Fertilización', MARGIN, 16)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.text('BODEGA SALENTEIN · Fertilización', MARGIN, 23)

  const ofText = display(orden.of, 'Sin N°')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  const badgeW = Math.min(78, Math.max(48, pdf.getTextWidth(ofText) + 12))
  const badgeX = PAGE_W - MARGIN - badgeW
  setFillRgb(pdf, BRAND.white)
  pdf.roundedRect(badgeX, 10, badgeW, 15, 2, 2, 'F')
  setRgb(pdf, BRAND.greenDark)
  pdf.text(ofText, badgeX + badgeW / 2, 20, { align: 'center' })
}

function measureMetaField(pdf: jsPDF, maxW: number, value: string): number {
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  const lines = pdf.splitTextToSize(value, maxW)
  return 5 + lines.length * 4.2
}

function drawMetaField(
  pdf: jsPDF,
  x: number,
  y: number,
  maxW: number,
  label: string,
  value: string,
): void {
  setRgb(pdf, BRAND.grayMuted)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(7)
  pdf.text(label.toUpperCase(), x, y)

  setRgb(pdf, BRAND.grayDark)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  const lines = pdf.splitTextToSize(value, maxW)
  pdf.text(lines, x, y + 4.5)
}

function drawMetaSection(pdf: jsPDF, orden: OrdenExport, startY: number): number {
  const pad = 8
  const gap = 10
  const colW = (CONTENT_W - pad * 2 - gap) / 2

  const fields = [
    { label: 'Fecha', value: formatFechaLabel(orden.fecha) },
    { label: 'Finca', value: display(orden.finca) },
    { label: 'Cultivo', value: display(orden.cultivo) },
    { label: 'Manejo', value: display(orden.manejo) },
    { label: 'Profesional', value: display(orden.tecnico) },
    { label: 'Responsable', value: display(orden.responsable) },
    { label: 'Cuartel / Lote', value: display(orden.cuartel) },
  ]

  const rowHeights: number[] = []
  for (let i = 0; i < fields.length; i += 2) {
    const leftH = measureMetaField(pdf, colW, fields[i].value)
    const rightH = fields[i + 1] ? measureMetaField(pdf, colW, fields[i + 1].value) : 0
    rowHeights.push(Math.max(leftH, rightH, 11) + 5)
  }

  const boxH = rowHeights.reduce((sum, h) => sum + h, 0) + pad * 2
  setFillRgb(pdf, BRAND.grayBg)
  setDrawRgb(pdf, BRAND.grayBorder)
  pdf.setLineWidth(0.3)
  pdf.roundedRect(MARGIN, startY, CONTENT_W, boxH, 3, 3, 'FD')

  let y = startY + pad
  for (let i = 0; i < fields.length; i += 2) {
    const rowIndex = i / 2
    drawMetaField(pdf, MARGIN + pad, y, colW, fields[i].label, fields[i].value)
    if (fields[i + 1]) {
      drawMetaField(
        pdf,
        MARGIN + pad + colW + gap,
        y,
        colW,
        fields[i + 1].label,
        fields[i + 1].value,
      )
    }
    y += rowHeights[rowIndex]
  }

  return startY + boxH + 14
}

function drawPageFooter(pdf: jsPDF, page: number, total: number) {
  setDrawRgb(pdf, BRAND.grayBorder)
  pdf.setLineWidth(0.2)
  pdf.line(MARGIN, FOOTER_Y - 4, PAGE_W - MARGIN, FOOTER_Y - 4)

  setRgb(pdf, BRAND.grayMuted)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text('Gestión de Campo · Orden de fertilización', MARGIN, FOOTER_Y)
  pdf.text(`Página ${page} de ${total}`, PAGE_W - MARGIN, FOOTER_Y, { align: 'right' })
}

function cellLines(pdf: jsPDF, text: string, width: number): string[] {
  return pdf.splitTextToSize(display(text), width - 4)
}

function rowHeight(pdf: jsPDF, item: ItemExport): number {
  let maxLines = 1
  for (const col of TABLE_COLS) {
    const lines = cellLines(pdf, item[col.key], col.w)
    maxLines = Math.max(maxLines, lines.length)
  }
  return Math.max(9, maxLines * 4.2 + 4)
}

function drawTableHeader(pdf: jsPDF, y: number): number {
  const headerH = 9
  setFillRgb(pdf, BRAND.green)
  pdf.roundedRect(MARGIN, y, CONTENT_W, headerH, 1.5, 1.5, 'F')

  setRgb(pdf, BRAND.white)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(7)

  let x = MARGIN + 2
  for (const col of TABLE_COLS) {
    pdf.text(col.label.toUpperCase(), x, y + 6)
    x += col.w
  }

  return y + headerH + 1
}

function drawTableRow(pdf: jsPDF, item: ItemExport, y: number, stripe: boolean): number {
  const h = rowHeight(pdf, item)

  if (stripe) {
    setFillRgb(pdf, BRAND.greenLight)
    pdf.rect(MARGIN, y, CONTENT_W, h, 'F')
  }

  setDrawRgb(pdf, BRAND.grayBorder)
  pdf.setLineWidth(0.15)
  pdf.line(MARGIN, y + h, MARGIN + CONTENT_W, y + h)

  setRgb(pdf, BRAND.grayText)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)

  let x = MARGIN + 2
  for (const col of TABLE_COLS) {
    const lines = cellLines(pdf, item[col.key], col.w)
    pdf.text(lines, x, y + 5.5)
    x += col.w
  }

  return y + h
}

function drawIndicaciones(pdf: jsPDF, orden: OrdenExport, y: number): number {
  setRgb(pdf, BRAND.grayDark)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text('Indicaciones generales', MARGIN, y)

  setFillRgb(pdf, BRAND.grayBg)
  setDrawRgb(pdf, BRAND.grayBorder)
  const text = display(orden.indicaciones)
  const lines = pdf.splitTextToSize(text, CONTENT_W - 12)
  const boxTop = y + 8
  const boxH = Math.max(16, lines.length * 4.5 + 8)
  pdf.roundedRect(MARGIN, boxTop, CONTENT_W, boxH, 2, 2, 'FD')

  setRgb(pdf, BRAND.grayText)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.text(lines, MARGIN + 6, boxTop + 7)

  return boxTop + boxH + 10
}

export async function buildOrdenPdf(orden: OrdenExport, items: ItemExport[]): Promise<jsPDF> {
  const JsPdf = await loadJsPdf()
  const pdf = new JsPdf({ unit: 'mm', format: 'a4' })
  const productItems = items.filter(
    item => item.producto.trim() || item.ia.trim() || item.dosis_ha.trim(),
  )

  drawPageHeader(pdf, orden)
  let y = drawMetaSection(pdf, orden, 44)

  setRgb(pdf, BRAND.grayDark)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text('Productos', MARGIN, y)
  y += 8

  y = drawTableHeader(pdf, y)

  if (productItems.length === 0) {
    setRgb(pdf, BRAND.grayMuted)
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(9)
    pdf.text('Sin productos cargados', MARGIN + 2, y + 6)
    y += 14
  } else {
    productItems.forEach((item, index) => {
      const needed = rowHeight(pdf, item) + 2
      if (y + needed > FOOTER_Y - 30) {
        pdf.addPage()
        drawPageHeader(pdf, orden)
        y = 42
        y = drawTableHeader(pdf, y)
      }
      y = drawTableRow(pdf, item, y, index % 2 === 0)
    })
  }

  y += 6
  if (y + 40 > FOOTER_Y - 10) {
    pdf.addPage()
    drawPageHeader(pdf, orden)
    y = 42
  }
  drawIndicaciones(pdf, orden, y)

  const totalPages = pdf.getNumberOfPages()
  for (let page = 1; page <= totalPages; page += 1) {
    pdf.setPage(page)
    drawPageFooter(pdf, page, totalPages)
  }

  return pdf
}

export async function createOrdenPdfBlob(orden: OrdenExport, items: ItemExport[]): Promise<Blob> {
  const pdf = await buildOrdenPdf(orden, items)
  return pdf.output('blob')
}

export function downloadPdfBlob(blob: Blob, of: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${safeName(of)}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function fechaToInput(fecha: OrdenFertilizacionWithItems['fecha']): string {
  const d = fecha.toDate()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export function ordenGuardadaToExport(orden: OrdenFertilizacionWithItems): {
  orden: OrdenExport
  items: ItemExport[]
} {
  return {
    orden: {
      of: orden.of,
      fecha: fechaToInput(orden.fecha),
      finca: orden.finca,
      cultivo: orden.cultivo,
      manejo: orden.manejo,
      tecnico: orden.tecnico,
      responsable: orden.responsable,
      cuartel: orden.cuartel,
      indicaciones: orden.indicaciones,
    },
    items: orden.items.map(item => ({
      producto: item.producto,
      grupo: item.grupo,
      ia: item.ia,
      presentacion: item.presentacion,
      dosis_ha: item.dosis_ha,
      superficie: item.superficie,
      dosis_aplicacion: computeDosisAplicacion(item.dosis_ha, item.superficie),
      obs: item.obs,
    })),
  }
}

function csvCell(value: string): string {
  const needsQuotes = /[",\r\n]/.test(value)
  const escaped = value.replace(/"/g, '""')
  return needsQuotes ? `"${escaped}"` : escaped
}

export function exportOrdenCsv(orden: OrdenExport, items: ItemExport[]): void {
  const rows: string[][] = [
    ['N° OF', orden.of],
    ['Fecha', orden.fecha],
    ['Finca', orden.finca],
    ['Cultivo', orden.cultivo],
    ['Manejo', orden.manejo],
    ['Profesional', orden.tecnico],
    ['Responsable', orden.responsable],
    ['Cuartel/Lote', orden.cuartel],
    [],
    ['Producto', 'Grupo', 'Ing. Activo', 'Pres.', 'Dosis/ha', 'Superficie (ha)', 'Dosis/aplicación', 'Observaciones'],
    ...items.map(item => [
      item.producto,
      item.grupo,
      item.ia,
      item.presentacion,
      item.dosis_ha,
      item.superficie,
      item.dosis_aplicacion,
      item.obs,
    ]),
    [],
    ['Indicaciones', orden.indicaciones],
  ]

  const csv = rows.map(row => row.map(csvCell).join(',')).join('\r\n')
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${safeName(orden.of)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
