import type { Timestamp } from 'firebase/firestore'
import type { StockMovimientoEstado, StockMovimientoTipo, PuntoStock } from './constants'

export interface StockProductoRef {
  producto: string
  productoKey: string
  ia: string
  presentacion: string
}

export interface StockSaldo extends StockProductoRef {
  id: string
  punto: PuntoStock
  cantidad: number
  actualizadoEn: Timestamp
}

export interface StockMovimiento extends StockProductoRef {
  id: string
  tipo: StockMovimientoTipo
  estado: StockMovimientoEstado
  cantidad: number
  delta: number
  punto?: PuntoStock
  puntoOrigen?: PuntoStock
  puntoDestino?: PuntoStock
  operador: string
  owner_id: string
  nota?: string
  turnoId?: string
  ordenId?: string
  oc?: string
  created_at: Timestamp
  confirmadoPor?: string
  confirmadoEn?: Timestamp
}

export interface StockProductoPropuesta {
  id: string
  categoria: string
  nombre: string
  ia: string
  presentacion: string
  dosis_ha: string
  description: string
  management: string
  estado: 'pendiente' | 'confirmada' | 'rechazada'
  operador: string
  owner_id: string
  created_at: Timestamp
  confirmadoPor?: string
  confirmadoEn?: Timestamp
}

export interface StockFaltante {
  producto: string
  presentacion: string
  solicitado: number
  disponible: number
}

export interface StockCargaInput extends StockProductoRef {
  punto: PuntoStock
  cantidad: number
  nota?: string
}
