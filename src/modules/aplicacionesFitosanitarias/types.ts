import type { Timestamp } from 'firebase/firestore'

export interface AplicacionCuadro {
  cuadroId: string
  nombre: string
  hileras: number
  canopia_hil: number
  canopia_ha: number
  haEstimada: number | null
}

export interface AplicacionProducto {
  producto: string
  ia: string
  presentacion: string
  dosisHaReceta: number | null
  dosisMaquinada: string
  gasto: number | null
  dosisRealHa: number | null
}

/** Documento de un turno de aplicación (`/aplicacionesFitosanitarias/{id}`). */
export interface AplicacionFitosanitaria {
  id: string
  owner_id: string
  ordenId: string
  oc: string
  finca: string
  fincaCatalogo: string
  cultivo: string
  fecha: Timestamp
  volumenLitros: number
  vol_aplicacion: number
  vol_maquinaria: number
  cuadros: AplicacionCuadro[]
  haTotal: number
  productos: AplicacionProducto[]
  registrado_por: string
  created_at: Timestamp
  updated_at: Timestamp
}

export type AplicacionFitosanitariaCreate = Omit<
  AplicacionFitosanitaria,
  'id' | 'created_at' | 'updated_at'
>
