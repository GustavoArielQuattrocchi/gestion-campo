/** Cálculo de hectáreas, gasto de producto y dosis real de un turno fitosanitario. */

/** Códigos de OC que no coinciden con las claves del catálogo de cuadros. */
const OC_FINCA_A_CATALOGO: Record<string, string> = {
  SC2: 'FC2',
  SC3: 'FC3',
}

/** Resuelve la finca del catálogo a partir del código guardado en la OC. */
export function catalogFincaFromOc(ocFinca: string): string {
  const key = ocFinca.trim().toUpperCase()
  return OC_FINCA_A_CATALOGO[key] ?? key
}

export function roundTo(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return value
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}

/**
 * ha = (hileras × canopia_hil) / canopia_ha
 * Null si falta canopia o las hileras no son válidas (el cuadro no entra al total).
 */
export function haDesdeHileras(
  hileras: number,
  canopiaHil: number,
  canopiaHa: number,
): number | null {
  if (!Number.isFinite(hileras) || hileras <= 0) return null
  if (!Number.isFinite(canopiaHil) || canopiaHil <= 0) return null
  if (!Number.isFinite(canopiaHa) || canopiaHa <= 0) return null
  return (hileras * canopiaHil) / canopiaHa
}

/** gasto = dosis_ha_receta × (litros de caldo / vol_aplicacion de la OC). */
export function gastoProducto(
  dosisHaReceta: number,
  volumenLitros: number,
  volAplicacion: number,
): number | null {
  if (!Number.isFinite(dosisHaReceta) || dosisHaReceta < 0) return null
  if (!Number.isFinite(volumenLitros) || volumenLitros <= 0) return null
  if (!Number.isFinite(volAplicacion) || volAplicacion <= 0) return null
  return dosisHaReceta * (volumenLitros / volAplicacion)
}

/** dosis_real_ha = gasto / ha_total. */
export function dosisRealHa(gasto: number, haTotal: number): number | null {
  if (!Number.isFinite(gasto) || gasto < 0) return null
  if (!Number.isFinite(haTotal) || haTotal <= 0) return null
  return gasto / haTotal
}

export interface CuadroTurnoCalcInput {
  cuadroId: string
  nombre: string
  hileras: number
  canopia_hil: number
  canopia_ha: number
}

export interface ProductoRecetaCalcInput {
  producto: string
  ia: string
  presentacion: string
  dosisHa: number | null
  dosisMaquinada: string
}

export interface CuadroTurnoCalcResult extends CuadroTurnoCalcInput {
  haEstimada: number | null
  omitido: boolean
}

export interface ProductoTurnoCalcResult {
  producto: string
  ia: string
  presentacion: string
  dosisHaReceta: number | null
  dosisMaquinada: string
  gasto: number | null
  dosisRealHa: number | null
}

export interface CalculoTurnoResult {
  cuadros: CuadroTurnoCalcResult[]
  haTotal: number
  productos: ProductoTurnoCalcResult[]
  avisos: string[]
}

export function calcularTurno(
  volumenLitros: number,
  volAplicacion: number,
  cuadros: CuadroTurnoCalcInput[],
  productos: ProductoRecetaCalcInput[],
): CalculoTurnoResult {
  const avisos: string[] = []

  const cuadrosCalc: CuadroTurnoCalcResult[] = cuadros.map(cuadro => {
    const ha = haDesdeHileras(cuadro.hileras, cuadro.canopia_hil, cuadro.canopia_ha)
    const sinHileras = !Number.isFinite(cuadro.hileras) || cuadro.hileras <= 0
    const sinCanopia =
      !sinHileras &&
      (cuadro.canopia_hil <= 0 || cuadro.canopia_ha <= 0 || !Number.isFinite(cuadro.canopia_hil) || !Number.isFinite(cuadro.canopia_ha))
    if (sinCanopia) {
      avisos.push(
        `${cuadro.nombre || cuadro.cuadroId}: sin datos de canopia; no entra al total de ha.`,
      )
    }
    return {
      ...cuadro,
      haEstimada: ha === null ? null : roundTo(ha, 4),
      omitido: ha === null,
    }
  })

  const haTotal = roundTo(
    cuadrosCalc.reduce((sum, cuadro) => sum + (cuadro.haEstimada ?? 0), 0),
    4,
  )

  if (cuadros.some(c => c.hileras > 0) && haTotal <= 0) {
    avisos.push('No se pudieron estimar hectáreas. Revisá hileras y canopia de los cuadros.')
  }

  if (!Number.isFinite(volAplicacion) || volAplicacion <= 0) {
    avisos.push('La orden no tiene volumen de aplicación; no se puede inferir el gasto.')
  }

  if (!Number.isFinite(volumenLitros) || volumenLitros <= 0) {
    avisos.push('Ingresá los litros de caldo del turno.')
  }

  const productosCalc: ProductoTurnoCalcResult[] = productos.map(producto => {
    const gasto =
      producto.dosisHa === null
        ? null
        : gastoProducto(producto.dosisHa, volumenLitros, volAplicacion)
    const gastoRedondeado = gasto === null ? null : roundTo(gasto, 4)
    const dosisReal =
      gastoRedondeado === null ? null : dosisRealHa(gastoRedondeado, haTotal)
    if (producto.producto && producto.dosisHa === null) {
      avisos.push(`${producto.producto}: sin dosis/ha en la receta; no se calcula gasto.`)
    }
    return {
      producto: producto.producto,
      ia: producto.ia,
      presentacion: producto.presentacion,
      dosisHaReceta: producto.dosisHa,
      dosisMaquinada: producto.dosisMaquinada,
      gasto: gastoRedondeado,
      dosisRealHa: dosisReal === null ? null : roundTo(dosisReal, 4),
    }
  })

  return {
    cuadros: cuadrosCalc,
    haTotal,
    productos: productosCalc,
    avisos: [...new Set(avisos)],
  }
}

export function formatCantidad(value: number | null, maxDecimals = 3): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  })
}

export function formatCantidadConUnidad(
  value: number | null,
  presentacion: string,
  maxDecimals = 3,
): string {
  const n = formatCantidad(value, maxDecimals)
  if (n === '—') return n
  const unidad = presentacion.trim()
  return unidad ? `${n} ${unidad}` : n
}

/** dosis real/ha − dosis receta/ha. Null si falta alguno. */
export function diferenciaDosis(
  dosisReal: number | null,
  dosisReceta: number | null,
): number | null {
  if (dosisReal === null || dosisReceta === null) return null
  if (!Number.isFinite(dosisReal) || !Number.isFinite(dosisReceta)) return null
  return roundTo(dosisReal - dosisReceta, 4)
}

/** True si la diferencia se ve en pantalla (3 decimales). */
export function hayDiferenciaDosis(diff: number | null, decimals = 3): boolean {
  if (diff === null || !Number.isFinite(diff)) return false
  return roundTo(Math.abs(diff), decimals) > 0
}

export function formatDiferenciaDosis(
  diff: number | null,
  presentacion: string,
  maxDecimals = 3,
): string {
  if (diff === null || !Number.isFinite(diff)) return '—'
  if (!hayDiferenciaDosis(diff, maxDecimals)) return '0'
  const n = formatCantidad(Math.abs(diff), maxDecimals)
  const signed = diff > 0 ? `+${n}` : `-${n}`
  const unidad = presentacion.trim()
  return unidad ? `${signed} ${unidad}` : signed
}

export interface GastoProductoAcumulado {
  producto: string
  presentacion: string
  gasto: number
}

/** Suma el gasto de producto de varios turnos, agrupando por nombre y unidad. */
export function acumularGastoProductos(
  turnos: Array<{
    productos: Array<{ producto: string; presentacion: string; gasto: number | null }>
  }>,
): GastoProductoAcumulado[] {
  const map = new Map<string, GastoProductoAcumulado>()
  for (const turno of turnos) {
    for (const producto of turno.productos) {
      const nombre = producto.producto.trim()
      if (!nombre) continue
      if (producto.gasto === null || !Number.isFinite(producto.gasto) || producto.gasto === 0) continue
      const unidad = producto.presentacion.trim()
      const key = `${nombre.toLowerCase()}|${unidad.toLowerCase()}`
      const prev = map.get(key)
      if (prev) {
        prev.gasto = roundTo(prev.gasto + producto.gasto, 4)
      } else {
        map.set(key, {
          producto: nombre,
          presentacion: unidad,
          gasto: roundTo(producto.gasto, 4),
        })
      }
    }
  }
  return [...map.values()].sort((a, b) => a.producto.localeCompare(b.producto, 'es'))
}
