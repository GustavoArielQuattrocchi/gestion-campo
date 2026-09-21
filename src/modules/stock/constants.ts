export const PUNTOS_STOCK = ['FOA', 'FLP', 'FSC', 'FSP'] as const

export type PuntoStock = (typeof PUNTOS_STOCK)[number]

export const PUNTO_STOCK_LABEL: Record<PuntoStock, string> = {
  FOA: 'FOA · Finca Oasis',
  FLP: 'FLP · Finca La Pampa',
  FSC: 'FSC · Depósito San Carlos',
  FSP: 'FSP · San Pablo',
}

export function isPuntoStock(value: string | null | undefined): value is PuntoStock {
  return !!value && (PUNTOS_STOCK as readonly string[]).includes(value)
}

export const STOCK_MOVIMIENTO_TIPOS = [
  'ingreso',
  'conteo',
  'ajuste',
  'egreso_turno',
  'transferencia',
] as const

export type StockMovimientoTipo = (typeof STOCK_MOVIMIENTO_TIPOS)[number]

export const STOCK_MOVIMIENTO_ESTADOS = ['confirmado', 'pendiente', 'rechazado', 'anulado'] as const

export type StockMovimientoEstado = (typeof STOCK_MOVIMIENTO_ESTADOS)[number]
