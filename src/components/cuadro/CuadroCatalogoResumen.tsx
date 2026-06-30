import { Grape, MapPin, Ruler } from 'lucide-react'
import type { CuadroDetalle } from '../../data/fincaData'
import { formatHectareas } from '../../utils/cuadroQr'

const EXTRA_KEY_ORDER = [
  'Pie',
  'Clon',
  'Año de plantacion',
  'Marco de plantacion',
  'Hileras',
  'Cantidad de plantas',
  'Metros de canopia/hilera',
  'Malla Antigranizo',
  'Calidad',
  'Equipo de Riego',
  'Equipo',
  'OP-1',
  'OP-2',
  'OP-3',
  'OP-4',
  'Op-1',
  'Op-2',
  'Op-3',
  'Op-4',
]

function orderedExtras(extras: Record<string, string>): [string, string][] {
  const used = new Set<string>()
  const rows: [string, string][] = []

  for (const key of EXTRA_KEY_ORDER) {
    const value = extras[key]
    if (value) {
      rows.push([key, value])
      used.add(key)
    }
  }

  for (const key of Object.keys(extras).sort((a, b) => a.localeCompare(b, 'es'))) {
    if (!used.has(key) && extras[key]) {
      rows.push([key, extras[key]])
    }
  }

  return rows
}

interface Props {
  cuadro: CuadroDetalle
  compact?: boolean
}

export default function CuadroCatalogoResumen({ cuadro, compact = false }: Props) {
  const extraRows = cuadro.extras ? orderedExtras(cuadro.extras) : []

  return (
    <div className={`cuadro-catalogo-resumen${compact ? ' cuadro-catalogo-resumen--compact' : ''}`}>
      <p className="cuadro-public-eyebrow">{cuadro.finca}</p>
      <h1 className={compact ? 'cuadro-catalogo-title-compact' : 'cuadro-public-title'}>
        {cuadro.nombre}
      </h1>
      <p className="cuadro-public-variedad">
        <Grape size={18} aria-hidden />
        {cuadro.variedad}
      </p>

      <dl className="cuadro-public-details">
        <div className="cuadro-public-detail">
          <dt>
            <MapPin size={16} aria-hidden />
            Viñedo
          </dt>
          <dd>{cuadro.vinedo}</dd>
        </div>
        <div className="cuadro-public-detail">
          <dt>
            <Ruler size={16} aria-hidden />
            Superficie
          </dt>
          <dd>{formatHectareas(cuadro.hectareas)}</dd>
        </div>
      </dl>

      {extraRows.length > 0 && (
        <div className="cuadro-catalogo-extras">
          <h2 className="cuadro-catalogo-extras-title">Datos técnicos</h2>
          <dl className="cuadro-catalogo-extras-grid">
            {extraRows.map(([key, value]) => (
              <div key={key} className="cuadro-catalogo-extra-row">
                <dt>{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  )
}
