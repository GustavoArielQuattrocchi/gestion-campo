import { catalogoDesdeArchivo } from '../data/agroQuimicos'
import { canonicalizarProducto } from '../data/productoCatalogoAlias'

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

/** Decimales de ha, gasto, dosis real y diferencias en aplicaciones. */
export const CALC_DECIMALS = 1

export function roundTo(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return value
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}

function roundCalc(value: number): number {
  return roundTo(value, CALC_DECIMALS)
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
      haEstimada: ha === null ? null : roundCalc(ha),
      omitido: ha === null,
    }
  })

  const haTotal = roundCalc(
    cuadrosCalc.reduce((sum, cuadro) => sum + (cuadro.haEstimada ?? 0), 0),
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
    const gastoRedondeado = gasto === null ? null : roundCalc(gasto)
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
      dosisRealHa: dosisReal === null ? null : roundCalc(dosisReal),
    }
  })

  return {
    cuadros: cuadrosCalc,
    haTotal,
    productos: productosCalc,
    avisos: [...new Set(avisos)],
  }
}

export function formatCantidad(value: number | null, decimals = CALC_DECIMALS): string {
  if (value === null || !Number.isFinite(value)) return '—'
  const rounded = roundTo(value, decimals)
  return rounded.toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatCantidadConUnidad(
  value: number | null,
  presentacion: string,
  decimals = CALC_DECIMALS,
): string {
  const n = formatCantidad(value, decimals)
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
  return roundCalc(dosisReal - dosisReceta)
}

/** True si la diferencia se ve en pantalla (1 decimal). */
export function hayDiferenciaDosis(diff: number | null, decimals = CALC_DECIMALS): boolean {
  if (diff === null || !Number.isFinite(diff)) return false
  return roundTo(Math.abs(diff), decimals) > 0
}

export function formatDiferenciaDosis(
  diff: number | null,
  presentacion: string,
  decimals = CALC_DECIMALS,
): string {
  if (diff === null || !Number.isFinite(diff)) return '—'
  if (!hayDiferenciaDosis(diff, decimals)) return '0'
  const n = formatCantidad(Math.abs(diff), decimals)
  const signed = diff > 0 ? `+${n}` : `-${n}`
  const unidad = presentacion.trim()
  return unidad ? `${signed} ${unidad}` : signed
}

/** Ideal = dosis receta/ha × ha aplicadas. Null si falta alguno. */
export function gastoIdealProducto(
  dosisHa: number | null | undefined,
  haTotal: number | null | undefined,
): number | null {
  if (dosisHa == null || haTotal == null) return null
  if (!Number.isFinite(dosisHa) || dosisHa < 0) return null
  if (!Number.isFinite(haTotal) || haTotal <= 0) return null
  return dosisHa * haTotal
}

export function desvioGasto(gastado: number, ideal: number | null): number | null {
  if (ideal === null || !Number.isFinite(ideal) || !Number.isFinite(gastado)) return null
  return roundCalc(gastado - ideal)
}

export function desvioGastoPct(desvio: number | null, ideal: number | null): number | null {
  if (desvio === null || ideal === null || !Number.isFinite(ideal) || ideal === 0) return null
  return (desvio / ideal) * 100
}

export function formatDesvioPorcentaje(pct: number | null, decimals = CALC_DECIMALS): string {
  if (pct === null || !Number.isFinite(pct)) return '—'
  if (roundTo(Math.abs(pct), decimals) === 0) return '0 %'
  const n = formatCantidad(Math.abs(pct), decimals)
  return pct > 0 ? `+${n} %` : `-${n} %`
}

export interface GastoProductoAcumulado {
  producto: string
  presentacion: string
  gasto: number
  ideal: number | null
  desvio: number | null
  desvioPct: number | null
}

export const SIN_FINCA_GASTO = 'Sin finca'
export const FILTRO_FINCA_TODAS = 'todas'
export const FILTRO_FINCA_SIN = '__sin_finca__'
export const FILTRO_CAMPANA_TODAS = 'todas'

/** Clave unificada de finca para gasto: SC2 y FC2 → FC2. Vacío si no hay finca. */
export function fincaGastoKey(finca?: string | null, fincaCatalogo?: string | null): string {
  const raw = (finca ?? '').trim() || (fincaCatalogo ?? '').trim()
  if (!raw) return ''
  return catalogFincaFromOc(raw)
}

export function fincaGastoLabel(key: string): string {
  return key || SIN_FINCA_GASTO
}

/**
 * Campaña vitivinícola julio–junio.
 * 1 jul 2026 → 2026/27; 30 jun 2026 → 2025/26.
 */
export function campanaFromDate(date: Date): string {
  const year = date.getFullYear()
  const startYear = date.getMonth() >= 6 ? year : year - 1
  return `${startYear}/${String(startYear + 1).slice(-2)}`
}

export function listCampanas(dates: Date[], now = new Date()): string[] {
  const set = new Set<string>()
  set.add(campanaFromDate(now))
  for (const date of dates) {
    if (Number.isNaN(date.getTime())) continue
    set.add(campanaFromDate(date))
  }
  return [...set].sort((a, b) => b.localeCompare(a))
}

export function coincideCampana(date: Date, filtro: string): boolean {
  if (filtro === FILTRO_CAMPANA_TODAS) return true
  if (Number.isNaN(date.getTime())) return false
  return campanaFromDate(date) === filtro
}

export function coincideFincaGasto(
  finca: string | null | undefined,
  fincaCatalogo: string | null | undefined,
  filtro: string,
): boolean {
  if (filtro === FILTRO_FINCA_TODAS) return true
  const key = fincaGastoKey(finca, fincaCatalogo)
  if (filtro === FILTRO_FINCA_SIN) return key === ''
  return key === filtro
}

export function listFincasGasto(
  items: Array<{ finca?: string | null; fincaCatalogo?: string | null }>,
): Array<{ key: string; label: string }> {
  const keys = new Set<string>()
  for (const item of items) {
    keys.add(fincaGastoKey(item.finca, item.fincaCatalogo))
  }
  return [...keys]
    .map(key => ({ key, label: fincaGastoLabel(key) }))
    .sort((a, b) => {
      if (!a.key) return 1
      if (!b.key) return -1
      return a.label.localeCompare(b.label, 'es')
    })
}

export interface GastoFincaGrupo {
  fincaKey: string
  finca: string
  turnosCount: number
  litrosCaldo: number
  haAplicadas: number
  productos: GastoProductoAcumulado[]
}

type TurnoGastoFinca = {
  finca?: string | null
  fincaCatalogo?: string | null
  volumenLitros?: number | null
  haTotal?: number | null
  productos: Array<{
    producto: string
    presentacion: string
    gasto: number | null
    dosisHaReceta?: number | null
  }>
}

function resumenTurnos(turnos: TurnoGastoFinca[]): Pick<GastoFincaGrupo, 'turnosCount' | 'litrosCaldo' | 'haAplicadas' | 'productos'> {
  return {
    turnosCount: turnos.length,
    litrosCaldo: roundCalc(turnos.reduce((sum, t) => sum + (t.volumenLitros || 0), 0)),
    haAplicadas: roundCalc(turnos.reduce((sum, t) => sum + (t.haTotal || 0), 0)),
    productos: acumularGastoProductos(turnos),
  }
}

/** Agrupa gasto y ha aplicadas por finca unificada. «Sin finca» al final; el resto alfabético. */
export function acumularGastoPorFinca(turnos: TurnoGastoFinca[]): GastoFincaGrupo[] {
  const buckets = new Map<string, TurnoGastoFinca[]>()
  for (const turno of turnos) {
    const key = fincaGastoKey(turno.finca, turno.fincaCatalogo)
    const list = buckets.get(key) ?? []
    list.push(turno)
    buckets.set(key, list)
  }
  return [...buckets.entries()]
    .map(([fincaKey, list]) => ({
      fincaKey,
      finca: fincaGastoLabel(fincaKey),
      ...resumenTurnos(list),
    }))
    .sort((a, b) => {
      if (!a.fincaKey) return 1
      if (!b.fincaKey) return -1
      return a.finca.localeCompare(b.finca, 'es')
    })
}

/** Suma el gasto de producto de varios turnos, agrupando por nombre y unidad canónicos. */
export function acumularGastoProductos(
  turnos: Array<{
    haTotal?: number | null
    productos: Array<{
      producto: string
      presentacion: string
      gasto: number | null
      dosisHaReceta?: number | null
    }>
  }>,
): GastoProductoAcumulado[] {
  const catalogo = catalogoDesdeArchivo()
  const map = new Map<string, {
    producto: string
    presentacion: string
    gasto: number
    ideal: number
    incompleteIdeal: boolean
  }>()
  for (const turno of turnos) {
    for (const producto of turno.productos) {
      if (producto.gasto === null || !Number.isFinite(producto.gasto) || producto.gasto === 0) continue
      const canon = canonicalizarProducto(
        {
          nombre: producto.producto,
          presentacion: producto.presentacion,
          gasto: producto.gasto,
          dosisHa: producto.dosisHaReceta,
        },
        catalogo,
      )
      if (!canon.nombre) continue
      const key = `${canon.nombre.toLowerCase()}|${canon.presentacion.toLowerCase()}`
      const idealPart = gastoIdealProducto(canon.dosisHa, turno.haTotal)
      const prev = map.get(key)
      if (prev) {
        prev.gasto = roundCalc(prev.gasto + (canon.gasto ?? 0))
        if (idealPart === null) prev.incompleteIdeal = true
        else prev.ideal = roundCalc(prev.ideal + idealPart)
      } else {
        map.set(key, {
          producto: canon.nombre,
          presentacion: canon.presentacion,
          gasto: roundCalc(canon.gasto ?? 0),
          ideal: idealPart === null ? 0 : roundCalc(idealPart),
          incompleteIdeal: idealPart === null,
        })
      }
    }
  }
  return [...map.values()]
    .map(row => {
      const ideal = row.incompleteIdeal ? null : row.ideal
      const desvio = desvioGasto(row.gasto, ideal)
      const desvioPct = desvioGastoPct(desvio, ideal)
      return {
        producto: row.producto,
        presentacion: row.presentacion,
        gasto: row.gasto,
        ideal: ideal === null ? null : roundCalc(ideal),
        desvio: desvio === null ? null : roundCalc(desvio),
        desvioPct: desvioPct === null ? null : roundTo(desvioPct, CALC_DECIMALS),
      }
    })
    .sort((a, b) => a.producto.localeCompare(b.producto, 'es'))
}
