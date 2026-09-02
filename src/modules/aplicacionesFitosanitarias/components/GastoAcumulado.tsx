import {
  acumularGastoProductos,
  formatCantidad,
  formatCantidadConUnidad,
} from '../../../utils/aplicacionFitosanitaria'
import type { AplicacionFitosanitaria } from '../types'

interface Props {
  titulo: string
  turnos: AplicacionFitosanitaria[]
}

export default function GastoAcumulado({ titulo, turnos }: Props) {
  const productos = acumularGastoProductos(turnos)
  const litrosCaldo = turnos.reduce((sum, t) => sum + (t.volumenLitros || 0), 0)
  const haTotal = turnos.reduce((sum, t) => sum + (t.haTotal || 0), 0)

  return (
    <section className="oc-card">
      <h2>{titulo}</h2>
      <p className="oc-muted">
        {turnos.length === 0
          ? 'Todavía no hay turnos para acumular.'
          : `${turnos.length} ${turnos.length === 1 ? 'turno' : 'turnos'} · ${formatCantidad(litrosCaldo)} L de caldo · ${formatCantidad(haTotal)} ha`}
      </p>
      <div className="oc-table-responsive">
        <table className="oc-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Gastado</th>
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 ? (
              <tr>
                <td colSpan={2} className="oc-empty">Sin gasto de producto</td>
              </tr>
            ) : (
              productos.map(p => (
                <tr key={`${p.producto}|${p.presentacion}`}>
                  <td>{p.producto}</td>
                  <td>{formatCantidadConUnidad(p.gasto, p.presentacion)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
