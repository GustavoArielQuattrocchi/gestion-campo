export const ALCANCE_FINCA = 'finca' as const
export const ALCANCE_CUADROS = 'cuadros' as const

export function esTareaTodaLaFinca(tarea: { alcance?: string } | null | undefined): boolean {
  return tarea?.alcance === ALCANCE_FINCA
}
