import type { ParteDeLabores, Tarea } from '../types'
import { formatTimestamp } from './formatTimestamp'
import {
  getConRendimiento,
  getEnProgreso,
  getFinalizadas,
} from './dashboardMetrics'
import { computeTareaProgress, formatProgressLabel } from './tareaProgress'

export type MetricKey =
  | 'total'
  | 'finalizadas'
  | 'en_progreso'
  | 'rendimiento'

export interface MetricColumn {
  key: string
  label: string
}

export interface MetricDetailResult {
  title: string
  columns: MetricColumn[]
  rows: Record<string, string>[]
  summary?: string
}

function responsable(t: Tarea): string {
  return t.tipo === 'manual' ? t.cuadrilla : t.persona
}

function tipoLabel(t: Tarea): string {
  return t.tipo === 'manual' ? 'Manual' : 'Mecánica'
}

function tareaRowBase(t: Tarea): Record<string, string> {
  return {
    tarea: t.tarea,
    finca: t.fincaNombre,
    responsable: responsable(t),
    tipo: tipoLabel(t),
    fechaInicio: formatTimestamp(t.fechaInicio),
    estado: t.estado === 'finalizada' ? 'Finalizada' : 'En progreso',
  }
}

function filaFinalizada(t: Tarea): Record<string, string> {
  return {
    tarea: t.tarea,
    responsable: responsable(t),
    finca: t.fincaNombre,
    fechaCierre: formatTimestamp(t.fechaFin ?? t.fechaInicio),
    rendimiento: t.rendimiento?.trim() || '—',
  }
}

export function getMetricDetail(
  metric: MetricKey,
  tareas: Tarea[],
  _partes: ParteDeLabores[] = [],
): MetricDetailResult {
  switch (metric) {
    case 'total':
      return {
        title: 'Total de tareas',
        columns: [
          { key: 'tarea', label: 'Tarea' },
          { key: 'finca', label: 'Finca' },
          { key: 'responsable', label: 'Responsable' },
          { key: 'tipo', label: 'Tipo' },
          { key: 'fechaInicio', label: 'Inicio' },
          { key: 'estado', label: 'Estado' },
        ],
        rows: tareas.map(t => tareaRowBase(t)),
      }

    case 'finalizadas': {
      const list = getFinalizadas(tareas)
      return {
        title: 'Tareas finalizadas',
        columns: [
          { key: 'tarea', label: 'Tarea' },
          { key: 'responsable', label: 'Responsable' },
          { key: 'finca', label: 'Finca' },
          { key: 'fechaCierre', label: 'Fecha de cierre' },
          { key: 'rendimiento', label: 'Rendimiento' },
        ],
        rows: list.map(filaFinalizada),
      }
    }

    case 'en_progreso': {
      const list = getEnProgreso(tareas)
      return {
        title: 'Tareas en progreso',
        columns: [
          { key: 'tarea', label: 'Tarea' },
          { key: 'responsable', label: 'Responsable' },
          { key: 'finca', label: 'Finca' },
          { key: 'avance', label: 'Avance' },
          { key: 'fechaInicio', label: 'Inicio' },
          { key: 'tipo', label: 'Tipo' },
        ],
        rows: list.map(t => ({
          tarea: t.tarea,
          responsable: responsable(t),
          finca: t.fincaNombre,
          avance: formatProgressLabel(computeTareaProgress(t)),
          fechaInicio: formatTimestamp(t.fechaInicio),
          tipo: tipoLabel(t),
        })),
      }
    }

    case 'rendimiento': {
      const list = getConRendimiento(tareas)
      return {
        title: 'Rendimiento / tarea',
        columns: [
          { key: 'tarea', label: 'Tarea' },
          { key: 'responsable', label: 'Responsable' },
          { key: 'finca', label: 'Finca' },
          { key: 'fechaCierre', label: 'Fecha de cierre' },
          { key: 'rendimiento', label: 'Rendimiento' },
        ],
        rows: list.map(filaFinalizada),
        summary:
          list.length === 0
            ? 'Ninguna tarea tiene rendimiento registrado.'
            : `${list.length} tarea(s) con rendimiento registrado`,
      }
    }
  }
}
