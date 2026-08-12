export interface AccidenteChecklistItem {
  id: string
  label: string
}

export const ACCIDENTE_OTROS_ID = 'otros'

export const PARTES_CUERPO: AccidenteChecklistItem[] = [
  { id: 'brazos', label: 'Brazos' },
  { id: 'cara_cuello', label: 'Cara y cuello' },
  { id: 'craneo', label: 'Cráneo' },
  { id: 'dedos_manos', label: 'Dedos manos' },
  { id: 'manos', label: 'Manos' },
  { id: 'ojos', label: 'Ojos' },
  { id: 'oidos', label: 'Oídos' },
  { id: 'piernas', label: 'Piernas' },
  { id: 'tronco', label: 'Tronco' },
  { id: 'tobillos', label: 'Tobillos' },
  { id: 'pies', label: 'Pies' },
  { id: 'dedos_pie', label: 'Dedos del pie' },
  { id: 'contusiones_multiples', label: 'Contusiones múltiples' },
  { id: 'quemaduras_multiples', label: 'Quemaduras múltiples' },
  { id: ACCIDENTE_OTROS_ID, label: 'Otros' },
]

export const NATURALEZAS_LESION: AccidenteChecklistItem[] = [
  { id: 'amputacion', label: 'Amputación' },
  { id: 'aplastamiento', label: 'Aplastamiento' },
  { id: 'contusion', label: 'Contusión' },
  { id: 'distension', label: 'Distensión' },
  { id: 'esguince', label: 'Esguince' },
  { id: 'fractura', label: 'Fractura' },
  { id: 'herida', label: 'Herida' },
  { id: 'luxacion', label: 'Luxación' },
  { id: 'asfixia', label: 'Asfixia' },
  { id: 'cuerpo_extrano', label: 'Cuerpo extraño' },
  { id: 'lumbalgia', label: 'Lumbalgia' },
  { id: 'quemadura_actinica', label: 'Quemadura actínica' },
  { id: 'quemadura_electrica', label: 'Quemadura eléctrica' },
  { id: 'quemadura_quimica', label: 'Quemadura química' },
  { id: 'quemadura_termica', label: 'Quemadura térmica' },
  { id: 'corte', label: 'Corte' },
  { id: ACCIDENTE_OTROS_ID, label: 'Otros' },
]

export function toggleChecklistId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
}

export function formatChecklistLabels(
  ids: string[],
  catalog: AccidenteChecklistItem[],
  otroTexto: string,
): string[] {
  const byId = new Map(catalog.map(i => [i.id, i.label]))
  return ids.map(id => {
    if (id === ACCIDENTE_OTROS_ID) {
      const extra = otroTexto.trim()
      return extra ? `Otros: ${extra}` : 'Otros'
    }
    return byId.get(id) ?? id
  })
}
