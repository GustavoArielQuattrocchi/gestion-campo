import type { Timestamp } from 'firebase/firestore'

/** Item de producto dentro de una orden de fertilización (subcolección `items`). */
export interface OrdenFertilizacionItem {
  id: string
  producto: string
  grupo: string
  ia: string
  presentacion: string
  dosis_ha: string
  superficie: string
  dosis_aplicacion: string
  obs: string
}

/** Documento principal (`/ordenesFertilizacion/{ordenId}`). */
export interface OrdenFertilizacion {
  id: string
  owner_id: string
  owner_email: string
  of: string
  fecha: Timestamp
  finca: string
  cultivo: string
  manejo: string
  tecnico: string
  responsable: string
  cuartel: string
  indicaciones: string
  created_at: Timestamp
  updated_at: Timestamp
}

export type OrdenFertilizacionCreate = Omit<OrdenFertilizacion, 'id' | 'created_at' | 'updated_at'>

export interface OrdenFertilizacionWithItems extends OrdenFertilizacion {
  items: OrdenFertilizacionItem[]
}
