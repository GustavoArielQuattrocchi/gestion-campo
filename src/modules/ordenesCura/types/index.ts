import type { Timestamp } from 'firebase/firestore'

/** Item de producto dentro de una orden de cura (subcolección `items`). */
export interface OrderItem {
  id: string
  producto: string
  ia: string
  presentacion: string
  dosis_ha: string
  dosis_maquinada: string
  obs: string
}

/** Documento principal de una orden de cura (`/ordenesCura/{ordenId}`). */
export interface OrdenCura {
  id: string
  /** uid del usuario autenticado en Firebase Auth. */
  owner_id: string
  oc: string
  fecha: Timestamp
  finca: string
  cultivo: string
  manejo: string
  tecnico: string
  tractorista: string
  tractor: string
  maquinaria: string
  vol_maquinaria: number
  vol_aplicacion: number
  cuartel: string
  indicaciones: string
  created_at: Timestamp
  updated_at: Timestamp
}

/**
 * Datos para crear una orden desde el formulario de alta.
 * Sin `id` ni timestamps (los asigna el servicio). `owner_id` lo aporta el caller
 * desde el usuario autenticado.
 */
export type OrdenCuraCreate = Omit<OrdenCura, 'id' | 'created_at' | 'updated_at'>

/** Orden de cura junto a sus items, para vistas de detalle. */
export interface OrdenCuraWithItems extends OrdenCura {
  items: OrderItem[]
}
