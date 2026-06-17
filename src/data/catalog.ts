/**
 * Punto único de importación para datos estáticos de la app (fincas, tareas, cuadrillas, maquinaria).
 */
import type { CatalogItem, Cuadrilla, Maquinaria } from '../types'
import { fincas, getCuadrosPorFinca } from './fincaData'

export type { CuadroDetalle } from './fincaData'
export { fincas, getCuadrosPorFinca }

export const tareasManuales: CatalogItem[] = [
  { id: '1', nombre: 'Aplicar hormiguicida', descripcion: 'Aplicar hormiguicida a la parcela' },
  { id: '2', nombre: 'Atada', descripcion: 'Atada de la parcela' },
  { id: '3', nombre: 'Plantación', descripcion: 'Plantación de la parcela' },
  { id: '4', nombre: 'Cosecha', descripcion: 'Cosecha de la parcela' },
  { id: '5', nombre: 'Atando tela', descripcion: 'Atando tela de la parcela' },
  { id: '6', nombre: 'Mantenimiento', descripcion: 'Mantenimiento de la parcela' },
  { id: '7', nombre: 'Inspección', descripcion: 'Inspección de la parcela' },
  { id: '8', nombre: 'Fertilización', descripcion: 'Fertilización de la parcela' },
  { id: '9', nombre: 'Movimiento de alambre movil', descripcion: 'Movimiento de alambre movil de la parcela' },
  { id: '10', nombre: 'Movimiento de telas', descripcion: 'Movimiento de telas de la parcela' },
  { id: '11', nombre: 'Desbrotar', descripcion: 'Desbrotar la parcela' },
  { id: '12', nombre: 'Deshojado', descripcion: 'Deshojado de la parcela' },
  { id: '13', nombre: 'Desmalezado', descripcion: 'Desmalezado de la parcela' },
  { id: '14', nombre: 'Desorcillado', descripcion: 'Desorcillados de la parcela' },
  { id: '15', nombre: 'Despampanado', descripcion: 'Despampanado de la parcela' },
  { id: '16', nombre: 'Envolviendo brotes', descripcion: 'Envolviendo brotes de la parcela' },
  { id: '17', nombre: 'Herbicida', descripcion: 'Herbicida de la parcela' },
  { id: '18', nombre: 'Colocando feromonas', descripcion: 'Colocando feromonas de la parcela' },
  { id: '19', nombre: 'Lavando Mangueras', descripcion: 'Lavando mangueras de la parcela' },
  { id: '20', nombre: 'Riego', descripcion: 'Riego de la parcela' },
  { id: '21', nombre: 'Podando', descripcion: 'Podando de la parcela' },
  { id: '22', nombre: 'Raleo', descripcion: 'Raleo de la parcela' },
  { id: '23', nombre: 'Movimiento de materiales', descripcion: 'Movimiento de materiales de la parcela' },
  { id: '24', nombre: 'Otros', descripcion: 'Otros de la parcela' },
]

export const tareasMecanicas: CatalogItem[] = [
  { id: '1', nombre: 'Curacion', descripcion: 'Curacion de plantas de la parcela' },
  { id: '2', nombre: 'Cosechadora', descripcion: 'Cosechadora de la parcela' },
  { id: '3', nombre: 'Rastra', descripcion: 'Rastra de la parcela' },
  { id: '4', nombre: 'Desmalezado', descripcion: 'Desmalezado de la parcela' },
  { id: '5', nombre: 'Despampanado', descripcion: 'Despampanado de la parcela' },
  { id: '6', nombre: 'Herbicida', descripcion: 'Herbicida de la parcela' },
  { id: '7', nombre: 'Prepoda', descripcion: 'Rastra de la parcela' },
  { id: '8', nombre: 'Intercepa', descripcion: 'Intercepa de la parcela' },
  { id: '9', nombre: 'Multiple', descripcion: 'Multiple de la parcela' },
  { id: '10', nombre: 'Nivelacion de terreno', descripcion: 'Nivelacion de terreno de la parcela' },
  { id: '11', nombre: 'Movimiento de materiales', descripcion: 'Movimiento de materiales de la parcela' },
  { id: '12', nombre: 'Subsolado', descripcion: 'Subsolado de la parcela' },
  { id: '13', nombre: 'Otros', descripcion: 'Otros de la parcela' },
]

export const cuadrillas: Cuadrilla[] = [
  { id: 'c1', nombre: 'Cuadrilla A' },
  { id: 'c2', nombre: 'Cuadrilla B' },
  { id: 'c3', nombre: 'Cuadrilla C' },
  { id: 'c4', nombre: 'Cuadrilla D' },
]

export const maquinarias: Maquinaria[] = [
  { id: 'm1', nombre: 'Tractor John Deere' },
  { id: 'm2', nombre: 'Pulverizadora' },
  { id: 'm3', nombre: 'Cosechadora' },
  { id: 'm4', nombre: 'Rastra' },
  { id: 'm5', nombre: 'Desmalezadora mecánica' },
]

/** Nombres de fincas para selects y filtros. */
export function getFincaNombres(): string[] {
  return fincas.map(f => f.nombre)
}
