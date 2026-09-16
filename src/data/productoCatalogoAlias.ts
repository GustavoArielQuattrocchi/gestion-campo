/** Alias de nombres viejos de OC → nombre del archivo, y conversión de unidades líquidas. */

export interface CatalogoNombreVista {
  nombre: string
  presentacion: string
  ia: string
}

export interface ProductoACanonicalizar {
  nombre: string
  presentacion: string
  ia?: string
  gasto?: number | null
  dosisHa?: number | null
  dosisRealHa?: number | null
  dosisMaquinada?: string
}

export interface ProductoCanonicalizado {
  nombre: string
  presentacion: string
  ia: string
  gasto: number | null
  dosisHa: number | null
  dosisRealHa: number | null
  dosisMaquinada: string
  factor: number
  changed: boolean
}

type UnidadKind = 'volume' | 'mass'

interface UnidadCanon {
  kind: UnidadKind
  toBase: number
  label: string
}

const ALIAS_PARES: Array<[string, string]> = [
  ['Activador bio', 'Activador bio'],
  ['Alltec Ultra (Activador Bio)', 'Activador bio'],
  ['Alltec Ultra (Activador bio)', 'Activador bio'],
  ['Alltec Ultra', 'Activador bio'],
  ['Flumoxazin', 'Gemmit Top (SC)'],
  ['Flumioxazin', 'Gemmit Top (SC)'],
  ['Gemmit Top', 'Gemmit Top (SC)'],
  ['Gemmit Top (SC)', 'Gemmit Top (SC)'],
  ['Round Up Control Max', 'Roundup Control Max (SL)'],
  ['Roundup Control Max', 'Roundup Control Max (SL)'],
  ['Roundup Control Max (SG)', 'Roundup Control Max (SL)'],
  ['Round Up Control Max (SG)', 'Roundup Control Max (SL)'],
  ['Roundup Control Max (SL)', 'Roundup Control Max (SL)'],
  ['Round Up Control Max (SL)', 'Roundup Control Max (SL)'],
  ['Virantra', 'Virantra (SC)'],
  ['Virantra (SC)', 'Virantra (SC)'],
]

export const PRODUCTO_ALIASES: Record<string, string> = Object.fromEntries(
  ALIAS_PARES.map(([desde, hacia]) => [claveProducto(desde), hacia]),
)

const UNIDADES: Record<string, UnidadCanon> = {
  ml: { kind: 'volume', toBase: 1, label: 'ml' },
  mililitro: { kind: 'volume', toBase: 1, label: 'ml' },
  mililitros: { kind: 'volume', toBase: 1, label: 'ml' },
  cc: { kind: 'volume', toBase: 1, label: 'cc' },
  l: { kind: 'volume', toBase: 1000, label: 'L' },
  lt: { kind: 'volume', toBase: 1000, label: 'L' },
  lts: { kind: 'volume', toBase: 1000, label: 'L' },
  litro: { kind: 'volume', toBase: 1000, label: 'L' },
  litros: { kind: 'volume', toBase: 1000, label: 'L' },
  kg: { kind: 'mass', toBase: 1, label: 'kg' },
  kilo: { kind: 'mass', toBase: 1, label: 'kg' },
  kilos: { kind: 'mass', toBase: 1, label: 'kg' },
  kilogramo: { kind: 'mass', toBase: 1, label: 'kg' },
  kilogramos: { kind: 'mass', toBase: 1, label: 'kg' },
}

export function claveProducto(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function claveUnidad(um: string): string {
  return um
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.]/g, '')
    .replace(/\s+/g, '')
    .trim()
}

export function parseUnidad(um: string): UnidadCanon | null {
  const clave = claveUnidad(um)
  return clave ? (UNIDADES[clave] ?? null) : null
}

export function resolverNombreCatalogo<T extends CatalogoNombreVista>(
  nombre: string,
  catalogo: readonly T[],
): T | undefined {
  const clave = claveProducto(nombre)
  if (!clave) return undefined
  const aliased = PRODUCTO_ALIASES[clave]
  if (aliased) {
    const targetClave = claveProducto(aliased)
    const aliasedMatch = catalogo.find(p => claveProducto(p.nombre) === targetClave)
    if (aliasedMatch) return aliasedMatch
  }
  return catalogo.find(p => claveProducto(p.nombre) === clave)
}

function roundCantidad(value: number): number {
  const factor = 10 ** 4
  return Math.round((value + Number.EPSILON) * factor) / factor
}

function parseLeadingNumber(value: string): number | null {
  const match = value.replace(',', '.').match(/-?\d+(?:\.\d+)?/)
  if (!match) return null
  const n = Number(match[0])
  return Number.isFinite(n) ? n : null
}

export function convertirCantidad(
  value: number,
  desdeUm: string,
  haciaUm: string,
): { value: number; unidad: string; factor: number } {
  const desde = parseUnidad(desdeUm)
  const hacia = parseUnidad(haciaUm)
  if (!desde || !hacia || desde.kind !== hacia.kind) {
    return { value, unidad: desde?.label ?? desdeUm.trim(), factor: 1 }
  }
  const factor = desde.toBase / hacia.toBase
  return { value: roundCantidad(value * factor), unidad: hacia.label, factor }
}

function aplicarFactorATexto(texto: string, factor: number, unidad: string): string {
  const trimmed = texto.trim()
  if (!trimmed) return texto
  const n = parseLeadingNumber(trimmed)
  if (n === null) return texto
  const converted = factor === 1 ? n : roundCantidad(n * factor)
  const pretty = Number.isInteger(converted) ? String(converted) : String(converted)
  return unidad ? `${pretty} ${unidad}` : pretty
}

function same(a: string, b: string): boolean {
  return claveProducto(a) === claveProducto(b)
}

export function canonicalizarProducto(
  input: ProductoACanonicalizar,
  catalogo: readonly CatalogoNombreVista[],
): ProductoCanonicalizado {
  const match = resolverNombreCatalogo(input.nombre.trim(), catalogo)
  const nombre = match?.nombre ?? input.nombre.trim()
  const ia = match?.ia ?? (input.ia ?? '').trim()
  const umOrigen = input.presentacion.trim()
  const umDestino = match?.presentacion.trim() || umOrigen

  const gastoIn = input.gasto ?? null
  const dosisHaIn = input.dosisHa ?? null
  const dosisRealIn = input.dosisRealHa ?? null

  let factor = 1
  let presentacion = umOrigen
  if (umOrigen && umDestino) {
    const muestra = gastoIn ?? dosisHaIn ?? dosisRealIn ?? 1
    const converted = convertirCantidad(muestra, umOrigen, umDestino)
    factor = converted.factor
    presentacion = converted.unidad
  } else if (umDestino) {
    presentacion = parseUnidad(umDestino)?.label ?? umDestino
  }

  const scale = (n: number | null): number | null => {
    if (n === null || !Number.isFinite(n)) return n
    return factor === 1 ? n : roundCantidad(n * factor)
  }

  const nombreChanged = Boolean(input.nombre.trim()) && !same(input.nombre, nombre)
  const umChanged = Boolean(umOrigen) && claveUnidad(umOrigen) !== claveUnidad(presentacion)
  const iaChanged = Boolean(match) && ia !== (input.ia ?? '').trim()

  return {
    nombre,
    presentacion,
    ia,
    gasto: scale(gastoIn),
    dosisHa: scale(dosisHaIn),
    dosisRealHa: scale(dosisRealIn),
    dosisMaquinada: aplicarFactorATexto(input.dosisMaquinada ?? '', factor, presentacion),
    factor,
    changed: nombreChanged || umChanged || iaChanged || factor !== 1,
  }
}

export function formatDosisHaCanon(original: string, canon: ProductoCanonicalizado): string {
  if (!canon.changed || canon.factor === 1 || canon.dosisHa === null) return original
  return String(canon.dosisHa)
}
