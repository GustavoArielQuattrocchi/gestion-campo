export interface AgroQuimico {
  id: number
  name: string
  description: string
  activeprinciple: string
  UM: string
  management: string
  dosis_ha: string
}

export const AGRO_CATEGORIAS = [
  'Fungicida',
  'Insecticida',
  'Herbicida',
  'Fertilizante',
  'Desincrustante',
  'Bioestimulante',
  'Micronutriente',
  'Coadyuvante',
] as const

export type AgroCategoria = (typeof AGRO_CATEGORIAS)[number]

export const AGRO_UM_OPTIONS = ['kg', 'L', 'cc'] as const
export const AGRO_MANEJO_CATALOGO = ['Orgánico', 'Convencional', 'Dual'] as const

/** kg = sólido, L = líquido a dosis alta, cc = concentrado a dosis baja. Dual = orgánico y convencional. */
export const AGRO_QUIMICOS: Record<AgroCategoria, AgroQuimico[]> = {
  Fungicida: [
    { id: 1, name: 'Verno (FG)', description: 'Peronóspera', activeprinciple: 'Óxido cuproso (30%) y óxido de zinc (30%)', UM: 'kg', management: 'Dual', dosis_ha: '' },
    { id: 2, name: 'Recop (WP)', description: 'Peronóspera', activeprinciple: 'Oxicloruro de cobre', UM: 'kg', management: 'Dual', dosis_ha: '' },
    { id: 3, name: 'Systhane (WP)', description: 'Oídio', activeprinciple: 'Myclobutanil', UM: 'kg', management: 'Convencional', dosis_ha: '' },
    { id: 4, name: 'Nordox 75 (WP)', description: 'Peronóspera', activeprinciple: 'Óxido cuproso', UM: 'kg', management: 'Dual', dosis_ha: '' },
    { id: 5, name: 'Vivando (SC)', description: 'Oídio', activeprinciple: 'Metrafenone', UM: 'cc', management: 'Convencional', dosis_ha: '' },
    { id: 6, name: 'Nativo (SC)', description: 'Oídio / Botrytis', activeprinciple: 'Tebuconazole + trifloxystrobin', UM: 'cc', management: 'Convencional', dosis_ha: '' },
    { id: 7, name: 'Kumulus (WP)', description: 'Oídio', activeprinciple: 'Azufre', UM: 'kg', management: 'Dual', dosis_ha: '' },
    { id: 8, name: 'Microthiol (WP)', description: 'Oídio', activeprinciple: 'Azufre', UM: 'kg', management: 'Dual', dosis_ha: '' },
    { id: 9, name: 'Manconil (WP)', description: 'Peronóspera', activeprinciple: 'Mancozeb', UM: 'kg', management: 'Convencional', dosis_ha: '' },
    { id: 10, name: 'Dithane (WP)', description: 'Peronóspera', activeprinciple: 'Mancozeb', UM: 'kg', management: 'Convencional', dosis_ha: '' },
    { id: 11, name: 'Bordocal', description: 'Peronóspera', activeprinciple: 'Sulfato de cobre pentahidratado', UM: 'kg', management: 'Orgánico', dosis_ha: '' },
    { id: 12, name: 'Aliette (WP)', description: 'Peronóspera', activeprinciple: 'Fosetil-Al (80%)', UM: 'kg', management: 'Convencional', dosis_ha: '' },
    { id: 13, name: 'Hidroxisuper (WP)', description: 'Peronóspera', activeprinciple: 'Hidróxido de cobre', UM: 'kg', management: 'Convencional', dosis_ha: '' },
  ],
  Insecticida: [
    { id: 14, name: 'Dipel (DF)', description: 'Lobesia', activeprinciple: 'Bacillus thuringiensis', UM: 'kg', management: 'Orgánico', dosis_ha: '' },
    { id: 15, name: 'Coragen (SC)', description: 'Lobesia', activeprinciple: 'Clorantraniliprole', UM: 'cc', management: 'Convencional', dosis_ha: '' },
    { id: 16, name: 'Virantra (SC)', description: 'Hormiga', activeprinciple: 'Isocycloseram', UM: 'cc', management: 'Convencional', dosis_ha: '' },
    { id: 17, name: 'Karate (SC)', description: 'Insectos', activeprinciple: 'Lambda-cialotrina', UM: 'cc', management: 'Convencional', dosis_ha: '' },
    { id: 18, name: 'Abamectina (SC)', description: 'Insectos', activeprinciple: 'Abamectina', UM: 'cc', management: 'Convencional', dosis_ha: '' },
    { id: 19, name: 'Cormoran (EC)', description: 'Carpocapsa', activeprinciple: 'Acetamiprid + novaluron', UM: 'cc', management: 'Convencional', dosis_ha: '' },
    { id: 20, name: 'Aceite Curafrutal', description: 'Insectos', activeprinciple: 'Aceite mineral', UM: 'L', management: 'Convencional', dosis_ha: '' },
  ],
  Herbicida: [
    { id: 21, name: 'Roundup Control Max (SL)', description: 'Malezas', activeprinciple: 'Glifosato', UM: 'L', management: 'Convencional', dosis_ha: '' },
    { id: 22, name: 'Gemmit Top (SC)', description: 'Malezas', activeprinciple: 'Flumioxazin', UM: 'L', management: 'Convencional', dosis_ha: '' },
    { id: 23, name: 'Gramoxone (SL)', description: 'Malezas', activeprinciple: 'Paraquat', UM: 'L', management: 'Convencional', dosis_ha: '' },
    { id: 24, name: 'Shark 40 (EC)', description: 'Desbrotante', activeprinciple: 'Carfentrazone', UM: 'cc', management: 'Convencional', dosis_ha: '' },
  ],
  Fertilizante: [
    { id: 25, name: 'Fosfato monoamónico (NPK 18-46-0)', description: 'Fertilizante', activeprinciple: 'Fosfato monoamónico', UM: 'kg', management: 'Convencional', dosis_ha: '' },
    { id: 26, name: 'SolMix (NPK 28-0-0-5,2S)', description: 'Fertilizante', activeprinciple: 'Nitrógeno + azufre', UM: 'kg', management: 'Convencional', dosis_ha: '' },
    { id: 27, name: 'Oasi Bio', description: 'Fertilizante', activeprinciple: 'Aminoácidos', UM: 'L', management: 'Orgánico', dosis_ha: '' },
    { id: 28, name: 'SolKS (NPK 0-0-25-17S)', description: 'Fertilizante', activeprinciple: 'Potasio + azufre', UM: 'kg', management: 'Convencional', dosis_ha: '' },
    { id: 29, name: 'Sulfato de amonio (NPK 21-0-0)', description: 'Fertilizante', activeprinciple: 'Sulfato de amonio', UM: 'kg', management: 'Convencional', dosis_ha: '' },
    { id: 30, name: 'Nutri 106 V (9-0-9)', description: 'Fertilizante', activeprinciple: 'NPK 9-0-9', UM: 'kg', management: 'Convencional', dosis_ha: '' },
    { id: 31, name: 'Nutri 264 (25-0-0-3,2S)', description: 'Fertilizante', activeprinciple: 'NPK 25-0-0 + 3,2% S', UM: 'kg', management: 'Convencional', dosis_ha: '' },
    { id: 32, name: 'Nutri 538 V (1,7-0-10,9-33S)', description: 'Fertilizante', activeprinciple: 'NPK 1,7-0-10,9 + 33% S', UM: 'kg', management: 'Convencional', dosis_ha: '' },
  ],
  Desincrustante: [
    { id: 33, name: 'Antiblock', description: 'Desincrustante', activeprinciple: 'Ácido sulfúrico', UM: 'L', management: 'Convencional', dosis_ha: '' },
  ],
  Bioestimulante: [
    { id: 34, name: 'Bioestimulante foliar', description: 'Foliar', activeprinciple: '—', UM: 'L', management: 'Convencional', dosis_ha: '' },
    { id: 35, name: 'Cytoplant', description: 'Foliar', activeprinciple: 'Citoquininas', UM: 'L', management: 'Convencional', dosis_ha: '' },
    { id: 36, name: 'Naturamin WSP', description: 'Foliar', activeprinciple: 'Aminoácidos', UM: 'kg', management: 'Dual', dosis_ha: '' },
    { id: 37, name: 'Phytness', description: 'Foliar', activeprinciple: 'Aminoácidos', UM: 'L', management: 'Dual', dosis_ha: '' },
    { id: 38, name: 'Azollumb H', description: 'Radical', activeprinciple: 'Aminoácidos', UM: 'L', management: 'Convencional', dosis_ha: '' },
    { id: 39, name: 'Raizal', description: 'Radical', activeprinciple: 'NPK + micronutrientes', UM: 'kg', management: 'Convencional', dosis_ha: '' },
  ],
  Micronutriente: [
    { id: 40, name: 'Ácido bórico', description: 'Boro', activeprinciple: 'Ácido bórico', UM: 'kg', management: 'Convencional', dosis_ha: '' },
    { id: 41, name: 'Stoller Zn', description: 'Zinc', activeprinciple: 'Zinc', UM: 'L', management: 'Convencional', dosis_ha: '' },
    { id: 42, name: 'Zintrac', description: 'Zinc', activeprinciple: 'Zinc', UM: 'L', management: 'Convencional', dosis_ha: '' },
    { id: 43, name: 'Solutop', description: 'Magnesio foliar', activeprinciple: 'Sulfato de magnesio', UM: 'kg', management: 'Dual', dosis_ha: '' },
  ],
  Coadyuvante: [
    { id: 44, name: 'Activador bio', description: 'Coadyuvante', activeprinciple: '—', UM: 'cc', management: 'Convencional', dosis_ha: '' },
  ],
}

export type OrigenCatalogo = 'static' | 'extra'

export interface ProductoCatalogoVista {
  id: string
  codigo: number
  categoria: string
  nombre: string
  ia: string
  presentacion: string
  dosis_ha: string
  description: string
  management: string
  origen: OrigenCatalogo
}

function iaCatalogo(value: string): string {
  const trimmed = value.trim()
  return !trimmed || trimmed === '—' ? '' : trimmed
}

export function catalogoDesdeArchivo(): ProductoCatalogoVista[] {
  return AGRO_CATEGORIAS.flatMap(categoria =>
    AGRO_QUIMICOS[categoria].map(item => ({
      id: `static-${item.id}`,
      codigo: item.id,
      categoria,
      nombre: item.name,
      ia: iaCatalogo(item.activeprinciple),
      presentacion: item.UM,
      dosis_ha: item.dosis_ha.trim(),
      description: item.description,
      management: item.management,
      origen: 'static' as const,
    })),
  )
}

export function nextAgroCodigo(codigos: number[]): number {
  return codigos.reduce((max, n) => (Number.isFinite(n) && n > max ? n : max), 0) + 1
}

function indiceCategoria(categoria: string): number {
  const index = AGRO_CATEGORIAS.indexOf(categoria as AgroCategoria)
  return index === -1 ? AGRO_CATEGORIAS.length : index
}

/** Une el archivo con extras. Si el nombre ya está en el .ts, gana el archivo. */
export function mergeCatalogo(
  base: ProductoCatalogoVista[],
  extras: ProductoCatalogoVista[],
): ProductoCatalogoVista[] {
  const byName = new Map(base.map(p => [p.nombre.trim().toLowerCase(), p]))
  for (const extra of extras) {
    const key = extra.nombre.trim().toLowerCase()
    if (!key || byName.has(key)) continue
    byName.set(key, extra)
  }
  return [...byName.values()].sort((a, b) => {
    const byCat = indiceCategoria(a.categoria) - indiceCategoria(b.categoria)
    if (byCat !== 0) return byCat
    return a.nombre.localeCompare(b.nombre, 'es')
  })
}

export function groupCatalogo(
  productos: ProductoCatalogoVista[],
): Array<{ categoria: string; productos: ProductoCatalogoVista[] }> {
  const buckets = new Map<string, ProductoCatalogoVista[]>()
  for (const producto of productos) {
    const categoria = producto.categoria.trim() || 'Sin clasificar'
    const list = buckets.get(categoria) ?? []
    list.push(producto)
    buckets.set(categoria, list)
  }
  const ordered: Array<{ categoria: string; productos: ProductoCatalogoVista[] }> = AGRO_CATEGORIAS
    .filter(cat => buckets.has(cat))
    .map(categoria => ({
      categoria,
      productos: buckets.get(categoria) ?? [],
    }))
  for (const [categoria, list] of buckets) {
    if (AGRO_CATEGORIAS.includes(categoria as AgroCategoria)) continue
    ordered.push({ categoria, productos: list })
  }
  return ordered
}

export function findProductoCatalogo(
  catalogo: ProductoCatalogoVista[],
  nombre: string,
): ProductoCatalogoVista | undefined {
  const clave = nombre.trim().toLowerCase()
  if (!clave) return undefined
  return catalogo.find(p => p.nombre.trim().toLowerCase() === clave)
}
