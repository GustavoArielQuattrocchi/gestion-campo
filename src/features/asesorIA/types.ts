export interface AsesorTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface AsesorFilters {
  fecha: string | null
  finca: string | null
  cuartel: string | null
  estado: 'abierto' | 'cerrado' | null
  responsable: string | null
  tipo_tarea: 'manual' | 'mecanica' | null
}

export interface AsesorRow {
  finca: string
  cuartel: string
  tarea: string
  estado: string
  responsable: string
  fecha: string
}

export interface AsesorResponse {
  answer: string
  intent: string
  filters: AsesorFilters
  data: AsesorRow[]
}

export class AsesorIaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AsesorIaError'
  }
}
