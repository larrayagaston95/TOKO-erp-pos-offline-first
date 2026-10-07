const fs = require('fs');

let dbContent = fs.readFileSync('src/db/database.ts', 'utf8');

// Update database.ts to version 10
dbContent = dbContent.replace(
  `// Versión 9: Agrega marcas, rubros, subcategorias
    this.version(9).stores({
      productos: 'id, codigoBarras, categoria, nombre',
      clientes: 'id, codigo, nombre, tipo, zonaRuta',
      ventas: 'id, numeroTicket, fechaHora, tipoOperacion, estadoSync, turnoId',
      sync_outbox: 'id, tipoOperacion, referenciaId, estado, fechaCreacion',
      movimientos_caja: 'id, fechaHora, tipo, turnoId',
      pagos_cc: 'id, clienteId, fechaHora, estadoSync',
      turnos_caja: 'id, estado, cajero, fechaApertura',
      empleados: 'id, usuario, rol',
      categorias: 'id, empresa_id, nombre',
      proveedores: 'id, empresa_id, razon_social',
      marcas: 'id, empresa_id, nombre',
      rubros: 'id, empresa_id, nombre',
      subcategorias: 'id, empresa_id, nombre'
    });`,
  `// Versión 9: Agrega marcas, rubros, subcategorias
    this.version(9).stores({
      productos: 'id, codigoBarras, categoria, nombre',
      clientes: 'id, codigo, nombre, tipo, zonaRuta',
      ventas: 'id, numeroTicket, fechaHora, tipoOperacion, estadoSync, turnoId',
      sync_outbox: 'id, tipoOperacion, referenciaId, estado, fechaCreacion',
      movimientos_caja: 'id, fechaHora, tipo, turnoId',
      pagos_cc: 'id, clienteId, fechaHora, estadoSync',
      turnos_caja: 'id, estado, cajero, fechaApertura',
      empleados: 'id, usuario, rol',
      categorias: 'id, empresa_id, nombre',
      proveedores: 'id, empresa_id, razon_social',
      marcas: 'id, empresa_id, nombre',
      rubros: 'id, empresa_id, nombre',
      subcategorias: 'id, empresa_id, nombre'
    });

    // Versión 10: Taxonomía relacional en cascada
    this.version(10).stores({
      productos: 'id, codigoBarras, categoria, nombre',
      clientes: 'id, codigo, nombre, tipo, zonaRuta',
      ventas: 'id, numeroTicket, fechaHora, tipoOperacion, estadoSync, turnoId',
      sync_outbox: 'id, tipoOperacion, referenciaId, estado, fechaCreacion',
      movimientos_caja: 'id, fechaHora, tipo, turnoId',
      pagos_cc: 'id, clienteId, fechaHora, estadoSync',
      turnos_caja: 'id, estado, cajero, fechaApertura',
      empleados: 'id, usuario, rol',
      categorias: '++id, empresa_id, nombre, rubro_id, marca_id',
      proveedores: '++id, empresa_id, razon_social',
      marcas: '++id, empresa_id, nombre, rubro_id',
      rubros: '++id, empresa_id, nombre',
      subcategorias: '++id, empresa_id, nombre, categoria_id'
    });`
);
fs.writeFileSync('src/db/database.ts', dbContent);
console.log('database.ts updated');

// Update ProductosView.tsx
let viewContent = fs.readFileSync('src/views/productos/ProductosView.tsx', 'utf8');

// 1. Find and replace ComboBuscable logic in ModalProducto to support cascading
// We will replace the entire ModalProducto logic to safely handle `id` lookups and disabled states.

// We need to inject the relational ABM and filtering:
const newModalHookInjection = `
  const dbRubros = useLiveQuery(() => db.rubros.toArray()) || [];
  const dbMarcasAll = useLiveQuery(() => db.marcas.toArray()) || [];
  const dbCategoriasAll = useLiveQuery(() => db.categorias.toArray()) || [];
  const dbSubCategoriasAll = useLiveQuery(() => db.subcategorias.toArray()) || [];
  const dbProveedoresAll = useLiveQuery(() => db.proveedores.toArray()) || [];

  // Lógica de Cascada (filtramos por el ID del padre seleccionado)
  const rubroActualId = dbRubros.find(r => r.nombre === form.rubro)?.id;
  const dbMarcas = dbMarcasAll.filter(m => !rubroActualId || m.rubro_id === rubroActualId);
  
  const marcaActualId = dbMarcasAll.find(m => m.nombre === form.marca)?.id;
  const dbCategorias = dbCategoriasAll.filter(c => 
    (!rubroActualId || c.rubro_id === rubroActualId) && 
    (!marcaActualId || c.marca_id === marcaActualId)
  );

  const categoriaActualId = dbCategoriasAll.find(c => c.nombre === form.categoria)?.id;
  const dbSubCategorias = dbSubCategoriasAll.filter(s => !categoriaActualId || s.categoria_id === categoriaActualId);

  const handleAddTaxonomy = async (store: 'rubros' | 'categorias' | 'marcas' | 'subcategorias' | 'proveedores', label: string, campoForm: keyof typeof form) => {
    const valor = window.prompt(\`Ingrese el nombre de \${label}:\`);
    if (valor && valor.trim() !== '') {
      try {
        let payload: any = { nombre: valor.trim(), empresa_id: 'emp-1' };
        
        if (store === 'proveedores') {
          payload = { razon_social: valor.trim(), empresa_id: 'emp-1' };
        } else if (store === 'marcas') {
          if (rubroActualId) payload.rubro_id = rubroActualId;
        } else if (store === 'categorias') {
          if (rubroActualId) payload.rubro_id = rubroActualId;
          if (marcaActualId) payload.marca_id = marcaActualId;
        } else if (store === 'subcategorias') {
          if (categoriaActualId) payload.categoria_id = categoriaActualId;
        }

        await (db[store] as any).add(payload);
        actualizar(campoForm, valor.trim());
      } catch (err) {
        console.error('Error guardando en', store, err);
      }
    }
  };
`;

// Replace the previous useLiveQuery block:
const oldUseLiveQueryBlockRegex = /const dbMarcas = useLiveQuery.*?\};/s;
viewContent = viewContent.replace(oldUseLiveQueryBlockRegex, newModalHookInjection.trim());

// We must also update `ComboBuscableProps` slightly to support `disabled` and `placeholder`.
const oldComboBuscableDef = `interface ComboBuscableProps {
  label: string;
  value: string;
  options: string[]; // Simplificado para usar strings como mock
  onChange: (v: string) => void;
  onAdd: () => void;
}`;

const newComboBuscableDef = `interface ComboBuscableProps {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  onAdd: () => void;
  disabled?: boolean;
}`;

viewContent = viewContent.replace(oldComboBuscableDef, newComboBuscableDef);

// Make ComboBuscable respect disabled
const oldInput = `<input
            type="text"
            className={inputCls}`;
const newInput = `<input
            type="text"
            className={\`\${inputCls} \${disabled ? 'opacity-50 cursor-not-allowed' : ''}\`}
            disabled={disabled}`;
viewContent = viewContent.replace(oldInput, newInput);

const oldButtonAdd = `onClick={onAdd}
          className="p-2 bg-teal-50 text-teal-600 rounded-xl border border-teal-100 hover:bg-teal-100 transition-colors shrink-0"`;
const newButtonAdd = `onClick={onAdd}
          disabled={disabled}
          className={\`p-2 bg-teal-50 text-teal-600 rounded-xl border border-teal-100 transition-colors shrink-0 \${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-teal-100'}\`}`;
viewContent = viewContent.replace(oldButtonAdd, newButtonAdd);

// Now update the form combos in ModalProducto to use the new cascading logic
// We'll replace the whole form chunk
const oldFormStart = `<div className="flex flex-col gap-6">`;
const oldFormEnd = `{/* Pie */}`;
const startIndex = viewContent.indexOf(oldFormStart);
const endIndex = viewContent.indexOf(oldFormEnd);

const newFormChunk = `<div className="flex flex-col gap-6">
            {/* ─── SECCIÓN 1: DATOS BÁSICOS Y TAXONOMÍA ─── */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700 mb-3 border-b border-slate-100 pb-1">Datos Básicos y Categorización</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Campo label="Nombre del artículo">
                    <input
                      type="text"
                      value={form.nombre}
                      onChange={(e) => actualizar('nombre', e.target.value)}
                      placeholder="Ej: Aceite de Girasol Natura 900ml"
                      className={inputCls}
                    />
                  </Campo>
                </div>
                <Campo label="Código de barras (EAN)">
                  <input
                    type="text"
                    value={form.codigoBarras}
                    onChange={(e) => actualizar('codigoBarras', e.target.value)}
                    placeholder="7790070411802"
                    className={inputCls}
                  />
                </Campo>
                <ComboBuscable
                  label="Rubro"
                  value={form.rubro || ''}
                  options={dbRubros.map(r => r.nombre)}
                  onChange={(v) => actualizar('rubro', v)}
                  onAdd={() => handleAddTaxonomy('rubros', 'el nuevo Rubro', 'rubro')}
                />
                
                {/* Combos dependientes */}
                <ComboBuscable
                  label="Marca"
                  value={form.marca || ''}
                  options={dbMarcas.map(m => m.nombre)}
                  onChange={(v) => actualizar('marca', v)}
                  onAdd={() => handleAddTaxonomy('marcas', 'la nueva Marca', 'marca')}
                  disabled={!form.rubro}
                />
                <ComboBuscable
                  label="Categoría"
                  value={form.categoria}
                  options={dbCategorias.map(c => c.nombre)}
                  onChange={(v) => actualizar('categoria', v as any)}
                  onAdd={() => handleAddTaxonomy('categorias', 'la nueva Categoría', 'categoria')}
                  disabled={!form.rubro}
                />
                <ComboBuscable
                  label="Sub-Categoría"
                  value={form.subCategoria || ''}
                  options={dbSubCategorias.map(s => s.nombre)}
                  onChange={(v) => actualizar('subCategoria', v)}
                  onAdd={() => handleAddTaxonomy('subcategorias', 'la nueva Sub-Categoría', 'subCategoria')}
                  disabled={!form.categoria}
                />
                <ComboBuscable
                  label="Proveedor"
                  value={form.proveedor || ''}
                  options={dbProveedoresAll.map(p => p.razon_social)}
                  onChange={(v) => actualizar('proveedor', v)}
                  onAdd={() => handleAddTaxonomy('proveedores', 'el nuevo Proveedor', 'proveedor')}
                />
              </div>
            </div>

            {/* ─── SECCIÓN 2: PRECIOS ─── */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700 mb-3 border-b border-slate-100 pb-1">Precios</p>
              <div className="grid grid-cols-3 gap-4">
                <Campo label="Precio Costo ($)">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.precioCosto || 0}
                    onChange={(e) => actualizar('precioCosto', e.target.value)}
                    className={inputCls}
                  />
                </Campo>
                <Campo label="Precio Mostrador ($)">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.precioVenta}
                    onChange={(e) => actualizar('precioVenta', e.target.value)}
                    className={inputCls}
                  />
                </Campo>
                <Campo label="Precio Mayorista ($)">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.precioMayorista}
                    onChange={(e) => actualizar('precioMayorista', e.target.value)}
                    className={inputCls}
                  />
                </Campo>
              </div>
            </div>

            {/* ─── SECCIÓN 3: STOCK Y MULTIMEDIA ─── */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700 mb-3 border-b border-slate-100 pb-1">Stock e Imagen</p>
              <div className="grid grid-cols-3 gap-4">
                <Campo label="Stock actual (u.)">
                  <input
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(e) => actualizar('stock', e.target.value)}
                    className={inputCls}
                  />
                </Campo>
                <Campo label="Stock mínimo (u.)">
                  <input
                    type="number"
                    min={0}
                    value={form.stockMinimo}
                    onChange={(e) => actualizar('stockMinimo', e.target.value)}
                    className={inputCls}
                  />
                </Campo>
                <Campo label="Unidad de medida">
                  <select
                    value={form.unidadMedida}
                    onChange={(e) => actualizar('unidadMedida', e.target.value as any)}
                    className={inputCls}
                  >
                    <option value="UNIDAD">UNIDAD</option>
                    <option value="KG">KG</option>
                    <option value="PACK">PACK</option>
                  </select>
                </Campo>

                <div className="col-span-3 mt-2">
                  <Campo label="Imagen del Producto (Opcional)">
                    <div className="flex items-center gap-4 p-2 border border-slate-200 border-dashed rounded-xl bg-slate-50">
                      {form.imagenUrl ? (
                        <div className="relative group shrink-0">
                          <img src={form.imagenUrl} alt="Preview" className="w-14 h-14 rounded-lg object-cover border border-slate-200 bg-white" />
                          <button type="button" onClick={() => actualizar('imagenUrl', '')} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-300 shrink-0">
                          <Package className="h-6 w-6" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={manejarImagen}
                          className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                        />
                        <p className="text-[9px] text-slate-400 mt-1 truncate">Se redimensionará y comprimirá automáticamente a WebP para ahorrar espacio.</p>
                      </div>
                    </div>
                  </Campo>
                </div>
              </div>
            </div>
          </div>
          
          `;

viewContent = viewContent.substring(0, startIndex) + newFormChunk + viewContent.substring(endIndex);

// Fix the header horizontal scroll in the main view
// The user asked to remove `overflow-x-auto` from the action buttons container and add flex-wrap and gaps.
// Look for `overflow-x-auto pb-2 sm:pb-0` in the header
viewContent = viewContent.replace(
  'className="flex items-center gap-2.5 overflow-x-auto pb-2 sm:pb-0"',
  'className="flex items-center gap-2.5 flex-wrap pb-2 sm:pb-0"'
);

fs.writeFileSync('src/views/productos/ProductosView.tsx', viewContent);
console.log('ProductosView.tsx updated for cascading ABM and header flex-wrap');

