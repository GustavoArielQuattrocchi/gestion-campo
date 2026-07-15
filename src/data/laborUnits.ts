import type { RendimientoUnidad } from '../types'

/** Unidad de rendimiento sugerida por defecto para cada tipo de labor. */
export const UNIDAD_POR_LABOR: Record<string, RendimientoUnidad> = {
  'Podando': 'hileras',
  'Atada': 'hileras',
  'Desbrotar': 'hileras',
  'Deshojado': 'hileras',
  'Despampanado': 'hileras',
  'Envolviendo brotes': 'hileras',
  'Raleo': 'hileras',
  'Cosecha': 'jornal',
  'Aplicar hormiguicida': 'plantas',
  'Colocando feromonas': 'plantas',
  'Plantación': 'plantas',
  'Desmalezado': 'jornal',
  'Desorcillado': 'jornal',
  'Herbicida': 'jornal',
  'Fertilización': 'jornal',
  'Mantenimiento': 'jornal',
  'Inspección': 'jornal',
  'Riego': 'jornal',
  'Movimiento de alambre movil': 'jornal',
  'Movimiento de telas': 'jornal',
  'Atando tela': 'jornal',
  'Lavando Mangueras': 'jornal',
  'Movimiento de materiales': 'jornal',
  'Supervision': 'jornal',
  'Colocando polainas': 'jornal',
  'Otros': 'jornal',
  // Mecánicas
  'Curacion': 'hileras',
  'Cosechadora': 'hileras',
  'Rastra': 'hileras',
  'Prepoda': 'hileras',
  'Intercepa': 'hileras',
  'Multiple': 'hileras',
  'Nivelacion de terreno': 'jornal',
  'Subsolado': 'jornal',
}

export function getDefaultUnit(tarea: string): RendimientoUnidad {
  return UNIDAD_POR_LABOR[tarea] ?? 'jornal'
}
