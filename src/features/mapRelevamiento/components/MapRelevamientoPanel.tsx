import { useState } from 'react'
import { ClipboardPlus, CheckCircle2 } from 'lucide-react'
import type { CuadroDetalle } from '../../../data/fincaData'
import type { Tarea } from '../../../types'
import { cuadroFinalizadoEnTarea } from '../../../utils/cuadroTareas'
import { formatTareaMapLabel } from '../../../utils/vineyardMapLabels'
import {
  detectAsignarLaborConflict,
  getTareasPendientesEnCuadro,
} from '../escritorioTareaConflicts'
import type { MapRelevamientoActions } from '../useMapRelevamiento'
import AsignarLaborModal from './AsignarLaborModal'
import FinalizarCuadroModal from './FinalizarCuadroModal'

interface Props {
  cuadro: CuadroDetalle
  tareasEnProgreso: Tarea[]
  allTareas: Tarea[]
  actions: MapRelevamientoActions
  onLaborAsignada?: (labor: string) => void
}

export default function MapRelevamientoPanel({
  cuadro,
  tareasEnProgreso,
  allTareas,
  actions,
  onLaborAsignada,
}: Props) {
  const [asignarOpen, setAsignarOpen] = useState(false)
  const [finalizarTarget, setFinalizarTarget] = useState<Tarea | null>(null)

  const fincaId = cuadro.finca
  const cuadroId = cuadro.id

  const tareasPendientes = getTareasPendientesEnCuadro(allTareas, fincaId, cuadroId)

  const handleAsignarClick = () => {
    actions.clearError()
    const conflict = detectAsignarLaborConflict(allTareas, fincaId, cuadroId)
    if (conflict) {
      const lista = conflict.tareasPendientes.map(t => `• ${formatTareaMapLabel(t)}`).join('\n')
      const continuar = window.confirm(
        `Este cuadro ya tiene trabajo en progreso sin finalizar:\n\n${lista}\n\n¿Desea asignar otra labor de todas formas?`,
      )
      if (!continuar) return
    }
    setAsignarOpen(true)
  }

  return (
    <div className="map-relevamiento-panel">
      <h4 className="map-relevamiento-title">Relevamiento escritorio</h4>
      <p className="map-relevamiento-desc">
        Para registrar labores que Campo no relevó. Sin parte de labores.
      </p>

      <button
        type="button"
        className="map-relevamiento-btn-asignar"
        onClick={handleAsignarClick}
        disabled={actions.busy}
      >
        <ClipboardPlus size={16} />
        Asignar labor
      </button>

      {tareasPendientes.length > 0 && (
        <div className="map-relevamiento-pendientes">
          <h5>Pendientes de finalizar</h5>
          <ul>
            {tareasPendientes.map(tarea => (
              <li key={tarea.id}>
                <span>{formatTareaMapLabel(tarea)}</span>
                <button
                  type="button"
                  className="map-relevamiento-btn-finalizar-cuadro"
                  disabled={actions.busy}
                  onClick={() => {
                    actions.clearError()
                    setFinalizarTarget(tarea)
                  }}
                >
                  <CheckCircle2 size={14} />
                  Finalizar cuadro
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tareasEnProgreso.length > 0 &&
        tareasEnProgreso.every(t => cuadroFinalizadoEnTarea(t, cuadroId)) && (
          <p className="map-relevamiento-all-done">
            Todos los trabajos en progreso de este cuadro están finalizados.
          </p>
        )}

      {actions.actionError && !asignarOpen && !finalizarTarget && (
        <p className="map-relevamiento-error" role="alert">
          {actions.actionError}
        </p>
      )}

      <AsignarLaborModal
        open={asignarOpen}
        cuadro={cuadro}
        allTareas={allTareas}
        actions={actions}
        onClose={() => setAsignarOpen(false)}
        onSuccess={labor => {
          setAsignarOpen(false)
          onLaborAsignada?.(labor)
        }}
      />

      {finalizarTarget && (
        <FinalizarCuadroModal
          open
          tarea={finalizarTarget}
          cuadroId={cuadroId}
          cuadroNombre={cuadro.nombre}
          actions={actions}
          onClose={() => setFinalizarTarget(null)}
          onSuccess={() => setFinalizarTarget(null)}
        />
      )}
    </div>
  )
}
