import {
  acumularGastoPorFinca,
  acumularGastoProductos,
  formatCantidad,
  formatCantidadConUnidad,
  formatDesvioPorcentaje,
  formatDiferenciaDosis,
  hayDiferenciaDosis,
  type GastoFincaGrupo,
  type GastoProductoAcumulado,
} from '../../../utils/aplicacionFitosanitaria'
import type { AplicacionFitosanitaria } from '../types'

interface Props {
  titulo: string
  turnos: AplicacionFitosanitaria[]
  desglosePorFinca?: boolean
}

function ProductosTable({ productos }: { productos: GastoProductoAcumulado[] }) {
  return (
    <div className="oc-table-responsive">
      <table className="oc-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Gastado</th>
            <th>Ideal</th>
            <th>Desvío</th>
            <th>Desvío %</th>
          </tr>
        </thead>
        <tbody>
          {productos.length === 0 ? (
            <tr>
              <td colSpan={5} className="oc-empty">Sin gasto de producto</td>
            </tr>
          ) : (
            productos.map(p => {
              const marcada = hayDiferenciaDosis(p.desvio)
              const tono = !marcada ? '' : (p.desvio ?? 0) > 0 ? 'af-diff-up' : 'af-diff-down'
              return (
                <tr key={`${p.producto}|${p.presentacion}`} className={tono || undefined}>
                  <td>{p.producto}</td>
                  <td>{formatCantidadConUnidad(p.gasto, p.presentacion)}</td>
                  <td>{formatCantidadConUnidad(p.ideal, p.presentacion)}</td>
                  <td className={marcada ? 'af-diff-value' : undefined}>
                    {formatDiferenciaDosis(p.desvio, p.presentacion)}
                  </td>
                  <td className={marcada ? 'af-diff-value' : undefined}>
                    {formatDesvioPorcentaje(p.desvioPct)}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

function resumenTurnos(turnosCount: number, litrosCaldo: number, haAplicadas: number): string {
  if (turnosCount === 0) return 'Todavía no hay turnos para acumular.'
  const turnosLabel = turnosCount === 1 ? 'turno' : 'turnos'
  return `${turnosCount} ${turnosLabel} · ${formatCantidad(litrosCaldo)} L de caldo · ${formatCantidad(haAplicadas)} ha aplicadas`
}

function FincaGrupo({ grupo }: { grupo: GastoFincaGrupo }) {
  return (
    <div className="af-gasto-grupo">
      <h3>{grupo.finca}</h3>
      <p className="oc-muted">{resumenTurnos(grupo.turnosCount, grupo.litrosCaldo, grupo.haAplicadas)}</p>
      <ProductosTable productos={grupo.productos} />
    </div>
  )
}

export default function GastoAcumulado({ titulo, turnos, desglosePorFinca = false }: Props) {
  const productos = acumularGastoProductos(turnos)
  const litrosCaldo = turnos.reduce((sum, t) => sum + (t.volumenLitros || 0), 0)
  const haAplicadas = turnos.reduce((sum, t) => sum + (t.haTotal || 0), 0)
  const grupos = desglosePorFinca ? acumularGastoPorFinca(turnos) : []

  return (
    <section className="oc-card">
      <h2>{titulo}</h2>
      <p className="oc-muted">{resumenTurnos(turnos.length, litrosCaldo, haAplicadas)}</p>
      <ProductosTable productos={productos} />
      {desglosePorFinca && grupos.length > 1
        ? grupos.map(grupo => (
            <FincaGrupo key={grupo.fincaKey || '__sin_finca__'} grupo={grupo} />
          ))
        : null}
    </section>
  )
}
