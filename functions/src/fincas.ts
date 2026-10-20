import { norm } from './text'

/**
 * Ids operativos del campo. Alias tomados del código existente
 * (stock: Oasis / La Pampa / San Pablo; aplicaciones: SC2→FC2, SC3→FC3).
 */
const ALIASES: Record<string, string> = {
  foa: 'FOA',
  oasis: 'FOA',
  'finca oasis': 'FOA',
  flp: 'FLP',
  'la pampa': 'FLP',
  'finca la pampa': 'FLP',
  fsp: 'FSP',
  'san pablo': 'FSP',
  fet: 'FET',
  fc2: 'FC2',
  sc2: 'FC2',
  fc3: 'FC3',
  sc3: 'FC3',
}

export function canonicalFinca(value: string): string | null {
  return ALIASES[norm(value)] ?? null
}
