import { Link, useParams } from 'react-router-dom'
import { Sprout } from 'lucide-react'
import CuadroCatalogoResumen from '../components/cuadro/CuadroCatalogoResumen'
import CuadroTareasResumen from '../components/cuadro/CuadroTareasResumen'
import { useCuadroTareas } from '../hooks/useCuadroTareas'
import { getCuadroPublicInfo } from '../utils/cuadroQr'

export default function CuadroPublicPage() {
  const { fincaId = '', cuadroId = '' } = useParams()
  const cuadro = getCuadroPublicInfo(fincaId, cuadroId)
  const decodedCuadroId = decodeURIComponent(cuadroId)
  const { loading, error, grupos } = useCuadroTareas(fincaId, cuadroId)

  if (!cuadro) {
    return (
      <div className="cuadro-public-page">
        <div className="cuadro-public-card cuadro-public-card--error fade-in">
          <Sprout size={40} color="#16a34a" />
          <h1>Cuadro no encontrado</h1>
          <p>
            No hay datos para <strong>{decodedCuadroId || '—'}</strong> en la finca{' '}
            <strong>{decodeURIComponent(fincaId || '—')}</strong>.
          </p>
          <Link to="/campo" className="btn btn-primary cuadro-public-cta">
            Ir a Gestión de Campo
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="cuadro-public-page">
      <header className="cuadro-public-header">
        <Sprout size={22} color="#16a34a" aria-hidden />
        <span>Gestión de Campo</span>
      </header>

      <main className="cuadro-public-stack fade-in">
        <section className="cuadro-public-card">
          <CuadroCatalogoResumen cuadro={cuadro} />
        </section>

        <section className="cuadro-public-card cuadro-public-card--tareas">
          <CuadroTareasResumen
            enProgreso={grupos.enProgreso}
            finalizadas={grupos.finalizadas}
            cuadroId={cuadro.id}
            loading={loading}
            error={error}
          />
        </section>
      </main>
    </div>
  )
}
