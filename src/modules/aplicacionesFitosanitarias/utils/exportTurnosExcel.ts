import { formatOwnerLabel } from '../../ordenesCura/utils/ownerLabel'
import type { AplicacionFitosanitaria } from '../types'
import { catalogoDesdeArchivo } from '../../../data/agroQuimicos'
import { canonicalizarProducto } from '../../../data/productoCatalogoAlias'
import {
  acumularGastoProductos,
  CALC_DECIMALS,
  desvioGasto,
  desvioGastoPct,
  gastoIdealProducto,
  roundTo,
} from '../../../utils/aplicacionFitosanitaria'

export type ExcelCell = string | number | null

export interface TurnoExcelRow {
  oc: string
  finca: string
  fecha: string
  cargo: string
  litros: number | null
  haAplicadas: number | null
  cuadros: string
  productos: string
}

export interface GastoExcelRow {
  oc: string
  finca: string
  fecha: string
  cargo: string
  producto: string
  ia: string
  unidad: string
  gasto: number | null
  ideal: number | null
  desvio: number | null
  desvioPct: number | null
  dosisRecetaHa: number | null
  dosisRealHa: number | null
  litros: number | null
  haAplicadas: number | null
}

const TURNOS_HEADERS = ['OC', 'Finca', 'Fecha', 'Cargó', 'Litros caldo', 'ha aplicadas', 'Cuadros', 'Productos']
const GASTOS_HEADERS = [
  'OC',
  'Finca',
  'Fecha',
  'Cargó',
  'Producto',
  'I.A.',
  'Unidad',
  'Gasto',
  'Ideal',
  'Desvío',
  'Desvío %',
  'Dosis receta/ha',
  'Dosis real/ha',
  'Litros caldo',
  'ha aplicadas',
]
const RESUMEN_HEADERS = ['Producto', 'Unidad', 'Gastado', 'Ideal', 'Desvío', 'Desvío %']

function safeName(oc: string): string {
  const base = oc.trim() || 'orden-cura'
  return base.replace(/[^\w-]+/g, '_')
}

function formatFecha(turno: AplicacionFitosanitaria): string {
  return turno.fecha.toDate().toLocaleDateString('es-AR')
}

function formatCuadros(turno: AplicacionFitosanitaria): string {
  return (
    turno.cuadros
      .filter(c => c.cuadroId)
      .map(c => `${c.nombre} (${c.hileras} hil.)`)
      .join(', ') || '—'
  )
}

function formatProductosResumen(turno: AplicacionFitosanitaria): string {
  const catalogo = catalogoDesdeArchivo()
  return (
    turno.productos
      .filter(p => p.producto)
      .map(p => {
        const canon = canonicalizarProducto(
          { nombre: p.producto, presentacion: p.presentacion, ia: p.ia, gasto: p.gasto },
          catalogo,
        )
        const gasto = canon.gasto === null || !Number.isFinite(canon.gasto) ? '—' : String(canon.gasto)
        const unidad = canon.presentacion.trim()
        return unidad ? `${canon.nombre}: ${gasto} ${unidad}` : `${canon.nombre}: ${gasto}`
      })
      .join(' · ') || '—'
  )
}

function sortTurnos(turnos: AplicacionFitosanitaria[]): AplicacionFitosanitaria[] {
  return [...turnos].sort((a, b) => {
    const byFecha = a.fecha.toDate().getTime() - b.fecha.toDate().getTime()
    if (byFecha !== 0) return byFecha
    return a.id.localeCompare(b.id)
  })
}

export function buildTurnosExcelRows(turnos: AplicacionFitosanitaria[]): TurnoExcelRow[] {
  return sortTurnos(turnos).map(turno => ({
    oc: turno.oc,
    finca: turno.finca,
    fecha: formatFecha(turno),
    cargo: formatOwnerLabel(turno.registrado_por),
    litros: Number.isFinite(turno.volumenLitros) ? turno.volumenLitros : null,
    haAplicadas: Number.isFinite(turno.haTotal) ? turno.haTotal : null,
    cuadros: formatCuadros(turno),
    productos: formatProductosResumen(turno),
  }))
}

export function buildGastosExcelRows(turnos: AplicacionFitosanitaria[]): GastoExcelRow[] {
  const catalogo = catalogoDesdeArchivo()
  const rows: GastoExcelRow[] = []
  for (const turno of sortTurnos(turnos)) {
    for (const producto of turno.productos) {
      if (!producto.producto.trim()) continue
      const canon = canonicalizarProducto(
        {
          nombre: producto.producto,
          presentacion: producto.presentacion,
          ia: producto.ia,
          gasto: producto.gasto,
          dosisHa: producto.dosisHaReceta,
          dosisRealHa: producto.dosisRealHa,
        },
        catalogo,
      )
      const haAplicadas = Number.isFinite(turno.haTotal) ? turno.haTotal : null
      const gasto = canon.gasto !== null && Number.isFinite(canon.gasto) ? canon.gasto : null
      const dosisRecetaHa =
        canon.dosisHa !== null && Number.isFinite(canon.dosisHa) ? canon.dosisHa : null
      const idealRaw = gastoIdealProducto(dosisRecetaHa, haAplicadas)
      const ideal = idealRaw === null ? null : roundTo(idealRaw, CALC_DECIMALS)
      const desvioRaw = gasto === null ? null : desvioGasto(gasto, ideal)
      const desvio = desvioRaw === null ? null : roundTo(desvioRaw, CALC_DECIMALS)
      const desvioPctRaw = desvioGastoPct(desvio, ideal)
      const desvioPct = desvioPctRaw === null ? null : roundTo(desvioPctRaw, CALC_DECIMALS)
      rows.push({
        oc: turno.oc,
        finca: turno.finca,
        fecha: formatFecha(turno),
        cargo: formatOwnerLabel(turno.registrado_por),
        producto: canon.nombre,
        ia: canon.ia.trim() || '—',
        unidad: canon.presentacion.trim() || '—',
        gasto,
        ideal,
        desvio,
        desvioPct,
        dosisRecetaHa,
        dosisRealHa:
          canon.dosisRealHa !== null && Number.isFinite(canon.dosisRealHa) ? canon.dosisRealHa : null,
        litros: Number.isFinite(turno.volumenLitros) ? turno.volumenLitros : null,
        haAplicadas,
      })
    }
  }
  return rows
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function xmlCell(value: ExcelCell): string {
  if (value === null || value === '') {
    return '<Cell><Data ss:Type="String"></Data></Cell>'
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`
  }
  return `<Cell><Data ss:Type="String">${xmlEscape(String(value))}</Data></Cell>`
}

function xmlRow(cells: ExcelCell[], header = false): string {
  const style = header ? ' ss:StyleID="header"' : ''
  return `<Row${style}>${cells.map(xmlCell).join('')}</Row>`
}

function xmlSheet(name: string, headers: string[], rows: ExcelCell[][]): string {
  const body = [xmlRow(headers, true), ...rows.map(row => xmlRow(row))].join('')
  return `<Worksheet ss:Name="${xmlEscape(name)}"><Table>${body}</Table></Worksheet>`
}

export function buildTurnosExcelXml(turnos: AplicacionFitosanitaria[]): string {
  const turnosRows = buildTurnosExcelRows(turnos).map(row => [
    row.oc,
    row.finca,
    row.fecha,
    row.cargo,
    row.litros,
    row.haAplicadas,
    row.cuadros,
    row.productos,
  ])
  const gastosRows = buildGastosExcelRows(turnos).map(row => [
    row.oc,
    row.finca,
    row.fecha,
    row.cargo,
    row.producto,
    row.ia,
    row.unidad,
    row.gasto,
    row.ideal,
    row.desvio,
    row.desvioPct,
    row.dosisRecetaHa,
    row.dosisRealHa,
    row.litros,
    row.haAplicadas,
  ])
  const resumenRows = acumularGastoProductos(turnos).map(row => [
    row.producto,
    row.presentacion,
    row.gasto,
    row.ideal,
    row.desvio,
    row.desvioPct,
  ])

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?mso-application progid="Excel.Sheet"?>',
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">',
    '<Styles><Style ss:ID="header"><Font ss:Bold="1"/></Style></Styles>',
    xmlSheet('Turnos', TURNOS_HEADERS, turnosRows),
    xmlSheet('Gastos', GASTOS_HEADERS, gastosRows),
    xmlSheet('Resumen', RESUMEN_HEADERS, resumenRows),
    '</Workbook>',
  ].join('')
}

function downloadBlob(xml: string, filename: string): void {
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Excel con hoja Turnos y hoja Gastos por producto (SpreadsheetML, se abre en Excel). */
export function downloadTurnosOrdenExcel(oc: string, turnos: AplicacionFitosanitaria[]): void {
  downloadBlob(buildTurnosExcelXml(turnos), `${safeName(oc)}-turnos.xls`)
}
