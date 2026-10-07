const fs = require('fs');

let content = fs.readFileSync('src/views/productos/ProductosView.tsx', 'utf8');

// --- PART 1: ModalProducto ABM logic ---
// Add useLiveQuery imports if not present (it's already imported at line 11)

// Inject hooks and handleAddTaxonomy into ModalProducto
const modalHookInjection = `
  const dbMarcas = useLiveQuery(() => db.marcas.toArray()) || [];
  const dbSubCategorias = useLiveQuery(() => db.subcategorias.toArray()) || [];
  const dbProveedores = useLiveQuery(() => db.proveedores.toArray()) || [];

  const handleAddTaxonomy = async (store: 'categorias' | 'marcas' | 'subcategorias' | 'proveedores', label: string, campoForm: keyof typeof form) => {
    const valor = window.prompt(\`Ingrese el nombre de \${label}:\`);
    if (valor && valor.trim() !== '') {
      try {
        const payload = store === 'proveedores' 
          ? { id: \\\`prov-\\\${Date.now()}\\\`, razon_social: valor.trim(), empresa_id: 'emp-1' } 
          : { id: \\\`\\\${store}-\\\${Date.now()}\\\`, nombre: valor.trim(), empresa_id: 'emp-1' };
        await (db[store] as any).add(payload);
        actualizar(campoForm, valor.trim());
      } catch (err) {
        console.error('Error guardando', err);
      }
    }
  };
`;

content = content.replace('const { categorias } = useCategoriasController();', 'const { categorias } = useCategoriasController();\n' + modalHookInjection);

// Replace ComboBuscable props in ModalProducto
content = content.replace(
  /options=\{categorias\.map\(c => c\.nombre\)\}\s*onChange=\{\(v\) => actualizar\('categoria', v\)\}\s*onAdd=\{\(\) => alert\('Apertura de modal para nuevo Rubro'\)\}/g,
  `options={categorias.map(c => c.nombre)}
                  onChange={(v) => actualizar('categoria', v)}
                  onAdd={() => handleAddTaxonomy('categorias', 'nuevo Rubro/Categoría', 'categoria')}`
);

content = content.replace(
  /options=\{?\['Coca-Cola'.*?\]\}?\s*onChange=\{\(v\) => actualizar\('marca', v\)\}\s*onAdd=\{\(\) => alert\('Apertura de modal para nueva Marca'\)\}/gs,
  `options={dbMarcas.map(m => m.nombre)}
                  onChange={(v) => actualizar('marca', v)}
                  onAdd={() => handleAddTaxonomy('marcas', 'la nueva Marca', 'marca')}`
);

content = content.replace(
  /options=\{?\['Lácteos Frescos'.*?\]\}?\s*onChange=\{\(v\) => actualizar\('subCategoria', v\)\}\s*onAdd=\{\(\) => alert\('Apertura de modal para nueva Sub-Categoría'\)\}/gs,
  `options={dbSubCategorias.map(s => s.nombre)}
                  onChange={(v) => actualizar('subCategoria', v)}
                  onAdd={() => handleAddTaxonomy('subcategorias', 'la nueva Sub-Categoría', 'subCategoria')}`
);

content = content.replace(
  /options=\{?\['Distribuidora Norte'.*?\]\}?\s*onChange=\{\(v\) => actualizar\('proveedor', v\)\}\s*onAdd=\{\(\) => alert\('Apertura de modal para nuevo Proveedor'\)\}/gs,
  `options={dbProveedores.map(p => p.razon_social)}
                    onChange={(v) => actualizar('proveedor', v)}
                    onAdd={() => handleAddTaxonomy('proveedores', 'el nuevo Proveedor', 'proveedor')}`
);

// --- PART 2: Header Refactor ---
const oldHeaderRegex = /\{\/\* Cabecera del Módulo \*\/\}.*?<div className="bg-white rounded-2xl border border-slate-200\/80 p-5 shadow-lg shadow-teal-900\/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">.*?<\/div>\s*<\/div>\s*<!--/gs;

// Actually I will manually find the header chunk
const oldHeaderStart = `{/* Cabecera del Módulo */}`;
const oldHeaderEnd = `{/* Tabla de Artículos */}`;

const startIndex = content.indexOf(oldHeaderStart);
const endIndex = content.indexOf(oldHeaderEnd);

const newHeader = `{/* Cabecera del Módulo */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-lg shadow-teal-900/5 flex flex-col gap-4 shrink-0">
            {/* Fila 1: Títulos y Botonera */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
                    <Package className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-black text-slate-900">Catálogo de Productos e Inventario</h2>
                </div>
                <p className="text-xs text-slate-500">
                  Control de existencias físicas, precios diferenciados y códigos EAN de barras.
                </p>
              </div>

              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setVerStockCritico(!verStockCritico)}
                  className={\`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm border whitespace-nowrap \${
                    verStockCritico 
                      ? 'bg-amber-100 text-amber-800 border-amber-300 ring-2 ring-amber-500/20' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }\`}
                >
                  <AlertTriangle className={\`h-4 w-4 \${verStockCritico ? 'text-amber-600' : 'text-slate-400'}\`} />
                  <span>⚠️ Ver Stock Crítico</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalMasivo(true)}
                  className="px-4 py-2 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:-translate-y-0.5 whitespace-nowrap"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Actualización Masiva</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalCategoriasAbierto(true)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
                >
                  <span className="text-sm">⚙️</span>
                  <span>Configurar Rubros</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalAlta(true)}
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-teal-600/20 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nuevo Artículo</span>
                </button>
              </div>
            </div>

            {/* Fila 2: Buscador Principal */}
            <div className="relative max-w-2xl w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-teal-600" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por descripción o código de barras..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-hidden focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-2xs"
              />
            </div>
          </div>
          `;

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newHeader + '\\n      ' + content.substring(endIndex);
  fs.writeFileSync('src/views/productos/ProductosView.tsx', content);
  console.log('Successfully updated ProductosView.tsx');
} else {
  console.error('Could not find header boundaries');
}

