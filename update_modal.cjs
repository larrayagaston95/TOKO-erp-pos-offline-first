const fs = require('fs');

let content = fs.readFileSync('src/views/productos/ProductosView.tsx', 'utf8');

// 1. Add `useRef, useEffect` to React import if not there
if (!content.includes('useRef')) {
  content = content.replace('import React, { useState, useMemo } from \'react\';', 'import React, { useState, useMemo, useRef, useEffect } from \'react\';');
}

// 2. Define `ComboBuscable` right after `Campo` definition
const comboBuscableDef = `
// ─── Componente: Combo Buscable con Autocompletado ───────────────────────────
interface ComboBuscableProps {
  label: string;
  value: string;
  options: string[]; // Simplificado para usar strings como mock
  onChange: (v: string) => void;
  onAdd: () => void;
}
const ComboBuscable: React.FC<ComboBuscableProps> = ({ label, value, options, onChange, onAdd }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));

  return (
    <Campo label={label}>
      <div className="relative flex items-center gap-1" ref={ref}>
        <div className="relative flex-1">
          <input
            type="text"
            className={inputCls}
            placeholder="Buscar o seleccionar..."
            value={open ? query : value}
            onFocus={() => { setQuery(''); setOpen(true); }}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
          />
          {open && (
            <div className="absolute z-50 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto p-1">
              {filtered.map(o => (
                <button
                  key={o}
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs hover:bg-teal-50 hover:text-teal-900 rounded-lg"
                  onClick={() => { onChange(o); setOpen(false); }}
                >
                  {o}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="p-2 text-xs text-slate-500">
                  No hay coincidencias.
                </div>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="p-2 bg-teal-50 text-teal-600 rounded-xl border border-teal-100 hover:bg-teal-100 transition-colors shrink-0"
          title={\`Añadir \${label}\`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </Campo>
  );
};
`;

if (!content.includes('ComboBuscableProps')) {
  content = content.replace('const inputCls =', comboBuscableDef + '\nconst inputCls =');
}

// 3. Replace the entire Form content in `ModalProducto`
// It currently starts at: `<div className="flex flex-col gap-6">` inside `<form onSubmit={iniciarGuardado}>`
// And ends before: `{/* Pie */}`

const oldFormStart = `<div className="flex flex-col gap-6">`;
const newFormContent = `<div className="flex flex-col gap-6">
            {/* ─── SECCIÓN 1: DATOS BÁSICOS ─── */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700 mb-3 border-b border-slate-100 pb-1">Datos Básicos</p>
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
                  label="Rubro / Categoría Principal"
                  value={form.categoria}
                  options={categorias.map(c => c.nombre)}
                  onChange={(v) => actualizar('categoria', v)}
                  onAdd={() => alert('Apertura de modal para nuevo Rubro')}
                />
              </div>
            </div>

            {/* ─── SECCIÓN 2: TAXONOMÍA Y RELACIONES ─── */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700 mb-3 border-b border-slate-100 pb-1">Categorización y Proveedores</p>
              <div className="grid grid-cols-2 gap-4">
                <ComboBuscable
                  label="Marca"
                  value={form.marca || ''}
                  options={['Coca-Cola', 'Arcor', 'Natura', 'Bimbo', 'Danone', 'La Serenísima', 'Quilmes', 'Genérica']}
                  onChange={(v) => actualizar('marca', v)}
                  onAdd={() => alert('Apertura de modal para nueva Marca')}
                />
                <ComboBuscable
                  label="Sub-Categoría"
                  value={form.subCategoria || ''}
                  options={['Lácteos Frescos', 'Aguas con gas', 'Galletitas Dulces', 'Snacks']}
                  onChange={(v) => actualizar('subCategoria', v)}
                  onAdd={() => alert('Apertura de modal para nueva Sub-Categoría')}
                />
                <div className="col-span-2">
                  <ComboBuscable
                    label="Proveedor"
                    value={form.proveedor || ''}
                    options={['Distribuidora Norte', 'Mayorista Makro', 'Diarco', 'Maxiconsumo', 'Yaguar', 'Directo de Fábrica']}
                    onChange={(v) => actualizar('proveedor', v)}
                    onAdd={() => alert('Apertura de modal para nuevo Proveedor')}
                  />
                </div>
              </div>
            </div>

            {/* ─── SECCIÓN 3: PRECIOS ─── */}
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

            {/* ─── SECCIÓN 4: STOCK Y MULTIMEDIA ─── */}
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
                    onChange={(e) => actualizar('unidadMedida', e.target.value as Producto['unidadMedida'])}
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
          </div>`;

const endMarker = '{/* Pie */}';
const startIndex = content.indexOf(oldFormStart);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newFormContent + '\\n          ' + content.substring(endIndex);
  fs.writeFileSync('src/views/productos/ProductosView.tsx', content);
  console.log('ProductosView.tsx successfully refactored!');
} else {
  console.log('Failed to find form boundaries.');
}
