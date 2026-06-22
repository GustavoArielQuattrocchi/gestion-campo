export interface MaquinariaCatalogo {
  id: string
  nombre: string
  modelo: string
}

export const BASE_DATOS_MAQUINARIAS: Record<string, MaquinariaCatalogo[]> = {
  FOA: [
    { id: 'FOA-1', nombre: 'MT04', modelo: 'DEUTZ KHD' },
    { id: 'FOA-2', nombre: 'MT27', modelo: 'NEW HOLLAND TT-65-D' },
    { id: 'FOA-3', nombre: 'MT29', modelo: 'MASSEY FERGUSON 265/2' },
    { id: 'FOA-4', nombre: 'MT30', modelo: 'DEUTZ AX-5.80' },
    { id: 'FOA-5', nombre: 'MT31', modelo: 'DEUTZ AX-4.60' },
    { id: 'FOA-6', nombre: 'MT32', modelo: 'MASSEY FERGUZON 265/2' },
    { id: 'FOA-7', nombre: 'MT39', modelo: 'NEW HOLLAND TT-65-D' },
    { id: 'FOA-8', nombre: 'MT42', modelo: 'NEW HOLLAND TT3840 HWD' },
    { id: 'FOA-9', nombre: 'MT44', modelo: 'NEW HOLLAND TT3840-F' },
    { id: 'FOA-10', nombre: 'MT45', modelo: 'JOHN DEERE 5076EFD' },
    { id: 'FOA-11', nombre: 'MT51', modelo: 'NEW HOLLAND T4.65V' },
    { id: 'FOA-12', nombre: 'MT53', modelo: 'NEW HOLLAND T4.65V' },
  ],
  FLP: [
    { id: 'FLP-1', nombre: 'MT19', modelo: 'NEW HOLLAND TN-75-V' },
    { id: 'FLP-2', nombre: 'MT23', modelo: 'MASSEY FERGUSON 275/2' },
    { id: 'FLP-3', nombre: 'MT24', modelo: 'NEW HOLLAND 4010' },
    { id: 'FLP-4', nombre: 'MT36', modelo: 'NEW HOLLAND TT-65-D' },
    { id: 'FLP-5', nombre: 'MT37', modelo: 'JOHN DEERE 5415N' },
    { id: 'FLP-6', nombre: 'MT38', modelo: 'JOHN DEERE 5415N' },
    { id: 'FLP-7', nombre: 'MT43', modelo: 'NEW HOLLAND TT3840-F' },
    { id: 'FLP-8', nombre: 'MT47', modelo: 'JOHN DEERE 5076EFD' },
    { id: 'FLP-9', nombre: 'MT50', modelo: 'NEW HOLLAND T4.65V' },
    { id: 'FLP-10', nombre: 'MT54', modelo: 'NEW HOLLAND T4.65V' },
  ],
  FSP: [
    { id: 'FSP-1', nombre: 'MT21', modelo: 'MASSEY FERGUSON 275/2' },
    { id: 'FSP-2', nombre: 'MT22', modelo: 'MASSEY FERGUSON 275/2' },
    { id: 'FSP-3', nombre: 'MT25', modelo: 'MASSEY FERGUSON 275/2' },
    { id: 'FSP-4', nombre: 'MT28', modelo: 'NEW HOLLAND TT-65-D' },
  ],
  FET: [
    { id: 'FET-1', nombre: 'MT03', modelo: 'NEW HOLLAND 8286' },
    { id: 'FET-2', nombre: 'MT46', modelo: 'JOHN DEERE 5076EFD' },
    { id: 'FET-3', nombre: 'MT49', modelo: 'NEW HOLLAND TT3840-F' },
  ],
  FC2: [
    { id: 'FC2-1', nombre: 'MT03', modelo: 'NEW HOLLAND 8286' },
    { id: 'FC2-2', nombre: 'MT46', modelo: 'JOHN DEERE 5076EFD' },
    { id: 'FC2-3', nombre: 'MT49', modelo: 'NEW HOLLAND TT3840-F' },
  ],
  FC3: [
    { id: 'FC3-1', nombre: 'MT03', modelo: 'NEW HOLLAND 8286' },
    { id: 'FC3-2', nombre: 'MT46', modelo: 'JOHN DEERE 5076EFD' },
    { id: 'FC3-3', nombre: 'MT49', modelo: 'NEW HOLLAND TT3840-F' },
  ],
}

export function getMaquinariasPorFinca(fincaId: string): MaquinariaCatalogo[] {
  return BASE_DATOS_MAQUINARIAS[fincaId] ?? []
}
