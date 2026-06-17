import { useMemo, useState } from 'react'

import { Search } from 'lucide-react'

import { getCuadrosPorFinca } from '../../data/catalog'

import type { CuadroSelection } from '../../types'



interface Props {

  fincaNombre: string

  seleccionadosIds: string[]

  onChange: (selection: CuadroSelection) => void

}



function selectionFromIds(

  cuadros: ReturnType<typeof getCuadrosPorFinca>,

  ids: string[],

): CuadroSelection {

  const cuadroIds: string[] = []

  const nombres: string[] = []

  for (const id of ids) {

    const cuadro = cuadros.find(c => c.id === id)

    if (!cuadro) continue

    cuadroIds.push(cuadro.id)

    nombres.push(cuadro.nombre)

  }

  return { cuadros: nombres, cuadroIds }

}



export default function CuadroSelector({ fincaNombre, seleccionadosIds, onChange }: Props) {

  const [busqueda, setBusqueda] = useState('')



  const cuadros = useMemo(() => getCuadrosPorFinca(fincaNombre), [fincaNombre])



  const cuadrosFiltrados = useMemo(() => {

    const term = busqueda.trim().toLowerCase()

    if (!term) return cuadros

    return cuadros.filter(c =>

      c.nombre.toLowerCase().includes(term) ||

      c.variedad.toLowerCase().includes(term) ||

      c.id.toLowerCase().includes(term)

    )

  }, [cuadros, busqueda])



  const toggleCuadro = (id: string) => {

    const nextIds = seleccionadosIds.includes(id)

      ? seleccionadosIds.filter(c => c !== id)

      : [...seleccionadosIds, id]

    onChange(selectionFromIds(cuadros, nextIds))

  }



  if (cuadros.length === 0) {

    return (

      <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>

        No hay cuadros cargados para esta finca.

      </p>

    )

  }



  return (

    <div className="cuadro-selector">

      <div className="cuadro-selector-search">

        <Search size={16} />

        <input

          type="search"

          className="form-input"

          placeholder="Buscar cuadro o variedad..."

          value={busqueda}

          onChange={e => setBusqueda(e.target.value)}

        />

      </div>



      <div className="cuadro-selector-meta">

        <span>{seleccionadosIds.length} seleccionado{seleccionadosIds.length !== 1 ? 's' : ''}</span>

        <span>{cuadrosFiltrados.length} de {cuadros.length} cuadros</span>

      </div>



      <div className="checkbox-grid cuadro-selector-grid">

        {cuadrosFiltrados.map(c => (

          <label

            key={c.id}

            className={`checkbox-item ${seleccionadosIds.includes(c.id) ? 'selected' : ''}`}

          >

            <input

              type="checkbox"

              checked={seleccionadosIds.includes(c.id)}

              onChange={() => toggleCuadro(c.id)}

            />

            <span className="cuadro-selector-label">

              <strong>{c.nombre}</strong>

              <small>{c.variedad} · {c.hectareas} ha</small>

            </span>

          </label>

        ))}

      </div>



      {cuadrosFiltrados.length === 0 && (

        <p style={{ fontSize: 14, color: 'var(--gray-500)', marginTop: 8 }}>

          No se encontraron cuadros con ese criterio.

        </p>

      )}

    </div>

  )

}

