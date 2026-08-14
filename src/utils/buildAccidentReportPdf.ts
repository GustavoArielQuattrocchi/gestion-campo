import { jsPDF } from 'jspdf'
import {
  NATURALEZAS_LESION,
  PARTES_CUERPO,
  formatChecklistLabels,
} from '../data/accidenteChecklist'
import type { AccidenteTipoTarea } from '../validation/accidentReport'

export interface AccidentReportPdfInput {
  operador: string
  fincaNombre: string
  tipo: AccidenteTipoTarea
  tarea: string
  afectadoNombre: string
  afectadoDni: string
  partesCuerpo: string[]
  parteCuerpoOtro: string
  naturalezasLesion: string[]
  naturalezaLesionOtro: string
  descripcion: string
  fecha: Date
  foto?: string | null
}

export function accidentReportFileName(finca: string, fecha: Date, dni?: string): string {
  const fechaStr = fecha.toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).replace(/\//g, '-')
  const dniPart = dni ? `_${dni}` : ''
  return `Informe_Accidente_${finca}${dniPart}_${fechaStr}.pdf`
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function buildAccidentReportPdf(input: AccidentReportPdfInput): Blob {
  const doc = new jsPDF()
  const fechaStr = input.fecha.toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  const partesLabels = formatChecklistLabels(input.partesCuerpo, PARTES_CUERPO, input.parteCuerpoOtro)
  const naturalezaLabels = formatChecklistLabels(
    input.naturalezasLesion,
    NATURALEZAS_LESION,
    input.naturalezaLesionOtro,
  )
  const tipoLabel = input.tipo === 'mecanica' ? 'Mecánica' : 'Manual'

  doc.setFillColor(22, 101, 52)
  doc.rect(0, 0, 210, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('INFORME DE ACCIDENTE', 15, 22)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Fecha: ${fechaStr}`, 15, 33)

  doc.setTextColor(0, 0, 0)
  let y = 52

  const ensureSpace = (needed: number) => {
    if (y + needed > 275) {
      doc.addPage()
      y = 20
    }
  }

  const writeBlock = (title: string, lines: string[]) => {
    const wrapped = lines.flatMap(line => doc.splitTextToSize(line, 180) as string[])
    ensureSpace(14 + wrapped.length * 5)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(title, 15, y)
    y += 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(wrapped, 15, y)
    y += wrapped.length * 5 + 8
  }

  doc.setFillColor(240, 253, 244)
  doc.roundedRect(10, y - 5, 190, 50, 3, 3, 'F')
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Datos del reporte', 15, y + 3)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Reportado por: ${input.operador}`, 15, y + 12)
  doc.text(`Finca: ${input.fincaNombre}`, 15, y + 20)
  doc.text(`Tarea: ${input.tarea} (${tipoLabel})`, 15, y + 28)
  doc.text(`Afectado: ${input.afectadoNombre}`, 15, y + 36)
  doc.text(`DNI: ${input.afectadoDni}`, 110, y + 36)
  y += 58

  writeBlock('Parte del cuerpo lesionada:', partesLabels.map(l => `• ${l}`))
  writeBlock('Naturaleza de la lesión:', naturalezaLabels.map(l => `• ${l}`))
  writeBlock('Descripción del accidente:', [input.descripcion])

  if (input.foto) {
    ensureSpace(98)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Evidencia fotográfica:', 15, y)
    y += 8
    doc.addImage(input.foto, 'JPEG', 15, y, 120, 80)
  }

  doc.setDrawColor(200, 200, 200)
  doc.line(10, 280, 200, 280)
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('Generado automáticamente por Sistema de Gestión de Campo', 105, 286, { align: 'center' })

  return doc.output('blob')
}
