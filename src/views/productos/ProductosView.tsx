/**
 * ============================================================================
 * VISTA: CATÁLOGO Y STOCK - DISEÑO MODERN SAAS (ProductosView.tsx)
 * ============================================================================
 * TOKO ERP - Panel de inventario con lista de precios dual (Mostrador vs Mayorista),
 * control de stock actual, umbrales mínimos y código de barras.
 * ABM: Alta, Baja y Modificación de productos via Dexie.js (IndexedDB).
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Package,
  Search,
  Plus,
  Barcode,
  AlertTriangle,
  Pencil,
  Trash2,
  X,
  Save,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Layers,
  Tag,
  ListTree,
  Box,
  Briefcase,
} from 'lucide-react';
import { db } from '../../db';
import { PRODUCTOS_MOCK, Producto, CategoriaProducto } from '../../models';
import { useProductosController } from '../../controllers/useProductosController';
import { useCategoriasController } from '../../controllers/useCategoriasController';
import { ModalConfirmacion } from '../../components/ui/ModalConfirmacion';
import { GestorCategoriasModal } from './GestorCategoriasModal';
import { useProveedoresController } from '../../controllers/useProveedoresController';
import { ProveedorModal } from './ProveedorModal';
import { ModalTaxonomias } from './ModalTaxonomias';
import { Proveedor } from '../../models/proveedor.model';

// ─── Valores iniciales para el formulario ───────────────────────────────────
const PRODUCTO_VACIO: Omit<Producto, 'id'> = {
  codigoBarras: '',
  nombre: '',
  categoria: 'Almacén',
  precioVenta: 0,
  precioMayorista: 0,
  precioCosto: 0,
  stock: 0,
  stockMinimo: 0,
  imagenUrl: '',
  unidadMedida: 'UNIDAD',
  proveedor: '',
  marca: '',
  rubro: '',
  subCategoria: '',
};

const CATEGORIAS: CategoriaProducto[] = [
  'Almacén',
  'Bebidas',
  'Lácteos',
  'Golosinas',
  'Limpieza',
  'Fiambres y Quesos',
];

// ─── Componente: Wrapper de campo de formulario ──────────────────────────────
interface CampoProps {
  label: string;
  children: React.ReactNode;
}
const Campo: React.FC<CampoProps> = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</label>
    {children}
  </div>
);


// ─── Componente: Combo Buscable con Autocompletado ───────────────────────────
interface ComboBuscableProps {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  onAdd: () => void;
  disabled?: boolean;
}
const ComboBuscable: React.FC<ComboBuscableProps> = ({ label, value, options, onChange, onAdd, disabled = false }) => {
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
            className={`${inputCls} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={disabled}
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
          disabled={disabled}
          className={`p-2 bg-teal-50 text-teal-600 rounded-xl border border-teal-100 transition-colors shrink-0 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-teal-100'}`}
          title={`Añadir ${label}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </Campo>
  );
};

const inputCls =
  'px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-hidden focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all w-full';

// ─── Componente: Modal Alta / Edición de Producto ────────────────────────────
interface ModalProductoProps {
  producto: Producto | null;
  onCerrar: () => void;
}

const ModalProducto: React.FC<ModalProductoProps> = ({ producto, onCerrar }) => {
  const esEdicion = producto !== null;
  const [form, setForm] = useState<Omit<Producto, 'id'>>(
    esEdicion ? { ...producto } : { ...PRODUCTO_VACIO }
  );
  const { guardarProducto, guardando, error: errorCtrl, setError: setErrorCtrl } = useProductosController();
  const error = errorCtrl;
  const setError = setErrorCtrl;
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const { categorias } = useCategoriasController();

  const dbRubros = useLiveQuery(() => db.rubros.toArray()) || [];
  const dbMarcasAll = useLiveQuery(() => db.marcas.toArray()) || [];
  const dbCategoriasAll = useLiveQuery(() => db.categorias.toArray()) || [];
  const dbSubCategoriasAll = useLiveQuery(() => db.subcategorias.toArray()) || [];
  const dbProveedoresAll = useLiveQuery(() => db.proveedores.toArray()) || [];

  // Lógica de Cascada Estricta
  const rubroActualId = dbRubros.find(r => r.nombre === form.rubro)?.id;
  const dbMarcas = rubroActualId ? dbMarcasAll.filter(m => m.rubro_id === rubroActualId) : [];
  
  const marcaActualId = dbMarcasAll.find(m => m.nombre === form.marca)?.id;
  const dbCategorias = marcaActualId ? dbCategoriasAll.filter(c => c.marca_id === marcaActualId) : [];

  const categoriaActualId = dbCategoriasAll.find(c => c.nombre === form.categoria)?.id;
  const dbSubCategorias = categoriaActualId ? dbSubCategoriasAll.filter(s => s.categoria_id === categoriaActualId) : [];

  const handleAddTaxonomy = async (store: 'rubros' | 'categorias' | 'marcas' | 'subcategorias' | 'proveedores', label: string, campoForm: keyof typeof form) => {
    // Validaciones estrictas de herencia
    if (store === 'marcas' && !rubroActualId) {
      alert("Debe seleccionar un Rubro primero para crear una Marca.");
      return;
    }
    if (store === 'categorias' && !marcaActualId) {
      alert("Debe seleccionar una Marca primero para crear una Categoría.");
      return;
    }
    if (store === 'subcategorias' && !categoriaActualId) {
      alert("Debe seleccionar una Categoría primero para crear una Subcategoría.");
      return;
    }

    const valor = window.prompt(`Ingrese el nombre de ${label}:`);
    if (valor && valor.trim() !== '') {
      try {
        let payload: any = { nombre: valor.trim(), empresa_id: 'emp-1' };
        
        if (store === 'proveedores') {
          payload = { razon_social: valor.trim(), empresa_id: 'emp-1' };
        } else if (store === 'marcas') {
          payload.rubro_id = rubroActualId;
        } else if (store === 'categorias') {
          payload.marca_id = marcaActualId;
          if (rubroActualId) payload.rubro_id = rubroActualId;
        } else if (store === 'subcategorias') {
          payload.categoria_id = categoriaActualId;
        }

        await (db[store] as any).add(payload);
        actualizar(campoForm, valor.trim());
      } catch (err) {
        console.error('Error guardando en', store, err);
      }
    }
  };


  const [modalConfirmacionAbierto, setModalConfirmacionAbierto] = useState(false);

  const actualizar = (campo: keyof typeof form, valor: string | number) => {
    setForm((prev) => {
      const next = { ...prev, [campo]: valor };
      // Limpieza en cascada si cambia un padre
      if (campo === 'rubro') {
        next.marca = '';
        next.categoria = '' as any;
        next.subCategoria = '';
      } else if (campo === 'marca') {
        next.categoria = '' as any;
        next.subCategoria = '';
      } else if (campo === 'categoria') {
        next.subCategoria = '';
      }
      return next;
    });
  };

  const iniciarGuardado = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!form.nombre.trim()) { setError('El nombre del artículo es obligatorio.'); return; }
    if (!form.codigoBarras.trim()) { setError('El código de barras es obligatorio.'); return; }
    
    setModalConfirmacionAbierto(true);
  };

  const manejarImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 150;
        canvas.height = 150;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const ratio = Math.max(150 / img.width, 150 / img.height);
          const drawWidth = img.width * ratio;
          const drawHeight = img.height * ratio;
          const drawX = (150 - drawWidth) / 2;
          const drawY = (150 - drawHeight) / 2;
          
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 150, 150);
          ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
          
          const base64 = canvas.toDataURL('image/webp', 0.7);
          actualizar('imagenUrl', base64);
        }
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const ejecutarGuardado = async () => {
    try {
      const payload: Producto = {
        id: esEdicion ? producto!.id : `prod-${Date.now()}`,
        ...form,
        precioVenta: Number(form.precioVenta),
        precioMayorista: Number(form.precioMayorista),
        stock: Number(form.stock),
        stockMinimo: Number(form.stockMinimo),
      };
      await guardarProducto(payload);
      
      setMensajeExito('✅ Producto guardado correctamente');
      if (!esEdicion) {
        setForm({ ...PRODUCTO_VACIO });
      }
      
      setTimeout(() => {
        setMensajeExito(null);
      }, 3000);
      
    } catch (e) {
      // Error handled by controller
    } finally {
      setModalConfirmacionAbierto(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onCerrar} />

      {/* Panel modal */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden">
        {/* Encabezado */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-emerald-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white border border-teal-100 shadow-sm text-teal-600">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {esEdicion ? 'Editar Artículo' : 'Nuevo Artículo'}
              </h3>
              <p className="text-[10px] text-slate-500">
                {esEdicion ? `ID: ${producto!.id}` : 'Registrar nuevo producto en el catálogo'}
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cuerpo */}
        <form onSubmit={iniciarGuardado}>
          <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
            {mensajeExito && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-bold animate-in fade-in">
                <span>{mensajeExito}</span>
              </div>
            )}
            {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-6">
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
                  disabled={!form.marca}
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
        </div>

        {/* Pie */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-teal-600/20 hover:-translate-y-0.5 active:scale-95"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{guardando ? 'Guardando...' : 'Guardar Artículo'}</span>
          </button>
        </div>
        </form>
      </div>

      <ModalConfirmacion
        estaAbierto={modalConfirmacionAbierto}
        titulo="Confirmar Artículo"
        mensaje="¿Deseas guardar los cambios en este producto?"
        textoConfirmar="Guardar"
        textoCancelar="Cancelar"
        tipoAccion="info"
        alConfirmar={ejecutarGuardado}
        alCancelar={() => setModalConfirmacionAbierto(false)}
      />
    </div>
  );
};

// ─── Componente: Modal Confirmación de Baja ──────────────────────────────────
interface ModalEliminarProps {
  producto: Producto;
  onCerrar: () => void;
}

const ModalEliminar: React.FC<ModalEliminarProps> = ({ producto, onCerrar }) => {
  const { eliminarProducto, eliminando } = useProductosController();

  const confirmarEliminacion = async () => {
    try {
      await eliminarProducto(producto.id);
      onCerrar();
    } catch (e) {
      // Error handled by controller
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onCerrar} />

      {/* Panel */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-sm overflow-hidden">
        <div className="px-6 py-5 text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center">
            <Trash2 className="h-5 w-5 text-rose-500" />
          </div>
          <h3 className="text-sm font-black text-slate-900 mb-1">Eliminar Artículo</h3>
          <p className="text-xs text-slate-500 mb-1">¿Confirmás la eliminación de:</p>
          <p className="text-xs font-bold text-slate-800 mb-4">"{producto.nombre}"?</p>
          <p className="text-[10px] text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            Esta acción no se puede deshacer y eliminará el registro de la base de datos local.
          </p>
        </div>
        <div className="flex items-center gap-2.5 px-6 pb-5">
          <button
            type="button"
            onClick={onCerrar}
            className="flex-1 px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmarEliminacion}
            disabled={eliminando}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-500/20 hover:-translate-y-0.5 active:scale-95"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{eliminando ? 'Eliminando...' : 'Sí, eliminar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Componente: Pestaña de Clasificaciones ────────────────────────────────────
const TabClasificaciones = () => {
  const [pestana, setPestana] = useState<'rubros' | 'marcas' | 'categorias' | 'subcategorias' | 'proveedores'>('rubros');

  const rubros = useLiveQuery(() => db.rubros.toArray()) ?? [];
  const marcas = useLiveQuery(() => db.marcas.toArray()) ?? [];
  const categorias = useLiveQuery(() => db.categorias.toArray()) ?? [];
  const subcategorias = useLiveQuery(() => db.subcategorias.toArray()) ?? [];
  const proveedores = useLiveQuery(() => db.proveedores.toArray()) ?? [];

  const productos = useLiveQuery(() => db.productos.toArray()) ?? [];

  const handleEliminar = async (store: string, id: string, nombre: string, count: number) => {
    if (count > 0) {
      if (!window.confirm(`Hay ${count} artículo(s) asociado(s) a "${nombre}". ¿Estás seguro de eliminarlo y dejar los artículos sin esta referencia?`)) {
        return;
      }
    } else {
      if (!window.confirm(`¿Estás seguro de eliminar "${nombre}"? Esta acción no se puede deshacer.`)) {
        return;
      }
    }
    
    try {
      await (db as any)[store].delete(id);
    } catch (err) {
      console.error('Error al eliminar', err);
    }
  };

  const handleEditar = async (store: string, id: string, nombreActual: string, campoProp: string) => {
    const nuevoNombre = window.prompt(`Editar nombre de ${nombreActual}:`, nombreActual);
    if (nuevoNombre && nuevoNombre.trim() !== '' && nuevoNombre !== nombreActual) {
      try {
        await (db as any)[store].update(id, { [campoProp]: nuevoNombre.trim() });
      } catch (err) {
        console.error('Error al editar', err);
      }
    }
  };

  let data: any[] = [];
  let parentLabels = (item: any): string => '';
  let propName = 'nombre';
  let prodPropName = 'rubro';

  if (pestana === 'rubros') {
    data = rubros;
    prodPropName = 'rubro';
  } else if (pestana === 'marcas') {
    data = marcas;
    prodPropName = 'marca';
    parentLabels = (m) => `Rubro: ${rubros.find(r => r.id === m?.rubro_id)?.nombre ?? 'Sin rubro'}`;
  } else if (pestana === 'categorias') {
    data = categorias;
    prodPropName = 'categoria';
    parentLabels = (c) => `Rubro: ${rubros.find(r => r.id === c?.rubro_id)?.nombre ?? '-'} | Marca: ${marcas.find(m => m.id === c?.marca_id)?.nombre ?? '-'}`;
  } else if (pestana === 'subcategorias') {
    data = subcategorias;
    prodPropName = 'subCategoria';
    parentLabels = (s) => `Categoría: ${categorias.find(c => c.id === s?.categoria_id)?.nombre ?? 'Sin categoría'}`;
  } else if (pestana === 'proveedores') {
    data = proveedores;
    propName = 'razon_social';
    prodPropName = 'proveedor';
  }

  return (
    <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Cabecera / Pestañas */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 gap-4 shrink-0">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <span className="text-xl">🏷️</span> Clasificaciones
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Gestioná los atributos de tus productos.</p>
        </div>
        <div className="flex border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
          {[
            { id: 'rubros', icon: <Layers className="w-3.5 h-3.5" />, label: 'Rubros' },
            { id: 'marcas', icon: <Tag className="w-3.5 h-3.5" />, label: 'Marcas' },
            { id: 'categorias', icon: <ListTree className="w-3.5 h-3.5" />, label: 'Categorías' },
            { id: 'subcategorias', icon: <Box className="w-3.5 h-3.5" />, label: 'Subcat.' },
            { id: 'proveedores', icon: <Briefcase className="w-3.5 h-3.5" />, label: 'Prov.' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setPestana(t.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-colors border-r border-slate-100 last:border-r-0 ${
                pestana === t.id ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
              }`}
            >
              {t.icon}
              <span className="hidden md:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido / Tabla */}
      {data.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm font-medium flex-1 flex flex-col items-center justify-center">
           <span className="text-4xl mb-3 grayscale opacity-50">📂</span>
           No hay registros guardados en esta sección.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-4">Nombre</th>
                {pestana !== 'rubros' && pestana !== 'proveedores' && (
                  <th className="py-2.5 px-4">Jerarquía Padre</th>
                )}
                <th className="py-2.5 px-4 text-center">Artículos Asociados</th>
                <th className="py-2.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map((item) => {
                const count = productos.filter((p: any) => p[prodPropName] === item[propName]).length;
                return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-3 px-4 text-sm font-bold text-slate-700">{item[propName]}</td>
                  {pestana !== 'rubros' && pestana !== 'proveedores' && (
                    <td className="py-3 px-4 text-xs text-slate-500 font-medium">
                      {parentLabels(item)}
                    </td>
                  )}
                  <td className="py-3 px-4 text-xs text-slate-500 font-medium text-center">
                    <span className={`px-2.5 py-1 rounded-full ${count > 0 ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-400'}`}>
                      {count}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEditar(pestana, item.id, item[propName], propName)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEliminar(pestana, item.id, item[propName], count)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Vista Principal ─────────────────────────────────────────────────────────
export const ProductosView: React.FC = () => {
  const { productos, mensajeNotificacion, eliminarProducto } = useProductosController();
  const [busqueda, setBusqueda] = useState<string>('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODAS');
  const [pestanaActiva, setPestanaActiva] = useState<'inventario' | 'clasificacion' | 'proveedores'>('inventario');

  const { proveedores, eliminarProveedor } = useProveedoresController();
  const [modalProveedorAbierto, setModalProveedorAbierto] = useState(false);
  const [proveedorEditar, setProveedorEditar] = useState<Proveedor | null>(null);
  const [modalEliminarProvAbierto, setModalEliminarProvAbierto] = useState(false);
  const [proveedorEliminar, setProveedorEliminar] = useState<Proveedor | null>(null);

  // Estado de modales ABM
  const [modalAlta, setModalAlta] = useState(false);
  const [productoEditar, setProductoEditar] = useState<Producto | null>(null);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(null);
  const [modalCategoriasAbierto, setModalCategoriasAbierto] = useState(false);
  const [modalMasivo, setModalMasivo] = useState(false);
  
  // Estados del modal de actualización masiva
  const [filtroMarca, setFiltroMarca] = useState('');
  const [filtroRubro, setFiltroRubro] = useState('');
  const [filtroProveedor, setFiltroProveedor] = useState('');
  const [tipoAjuste, setTipoAjuste] = useState<'%' | '$'>('%');
  const [valorAjuste, setValorAjuste] = useState<number>(0);
  const [campoAjuste, setCampoAjuste] = useState<'venta' | 'mayorista' | 'costo' | 'todos'>('todos');
  const [aplicandoMasivo, setAplicandoMasivo] = useState(false);
  const [mensajeMasivo, setMensajeMasivo] = useState('');

  /** Calcula los productos que serán afectados por el ajuste masivo. */
  const productosParaAjuste = useMemo(() => {
    return productos.filter(p => {
      const mM = !filtroMarca || (p.marca?.toLowerCase().includes(filtroMarca.toLowerCase()));
      const mR = !filtroRubro || (p.rubro?.toLowerCase().includes(filtroRubro.toLowerCase()));
      const mP = !filtroProveedor || (p.proveedor?.toLowerCase().includes(filtroProveedor.toLowerCase()));
      return mM && mR && mP;
    });
  }, [productos, filtroMarca, filtroRubro, filtroProveedor]);

  /**
   * Aplica el ajuste de precios masivo a los productos filtrados en IndexedDB.
   */
  const aplicarAjusteMasivo = async () => {
    if (valorAjuste === 0 || productosParaAjuste.length === 0) return;
    setAplicandoMasivo(true);
    try {
      await db.transaction('rw', db.productos, async () => {
        for (const prod of productosParaAjuste) {
          const calcNuevo = (precio: number) =>
            tipoAjuste === '%'
              ? Math.round((precio * (1 + valorAjuste / 100)) * 100) / 100
              : Math.round((precio + valorAjuste) * 100) / 100;

          const cambios: Partial<Producto> = {};
          if (campoAjuste === 'venta' || campoAjuste === 'todos') cambios.precioVenta = calcNuevo(prod.precioVenta);
          if (campoAjuste === 'mayorista' || campoAjuste === 'todos') cambios.precioMayorista = calcNuevo(prod.precioMayorista);
          if (campoAjuste === 'costo' || campoAjuste === 'todos') cambios.precioCosto = calcNuevo(prod.precioCosto ?? 0);
          await db.productos.update(prod.id, cambios);
        }
      });
      setMensajeMasivo(`✅ ${productosParaAjuste.length} productos actualizados correctamente.`);
      setTimeout(() => { setMensajeMasivo(''); setModalMasivo(false); }, 2500);
    } catch (err) {
      setMensajeMasivo('❌ Error al aplicar el ajuste. Intente de nuevo.');
    } finally {
      setAplicandoMasivo(false);
    }
  };

  // Filtro de stock crítico
  const [verStockCritico, setVerStockCritico] = useState<boolean>(false);

  const productosFiltrados = productos.filter((p) => {
    const coincideTexto =
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigoBarras.includes(busqueda);
    const coincideCategoria = categoriaFiltro === 'TODAS' || p.categoria === categoriaFiltro;
    
    // Si el filtro de stock crítico está activo, solo mostramos los que tienen stock <= stockMinimo
    const coincideStock = verStockCritico ? p.stock <= p.stockMinimo : true;
    
    return coincideTexto && coincideCategoria && coincideStock;
  });

  return (
    <div id="vista-productos-modulo" className="flex-1 p-6 bg-slate-50/70 flex flex-col min-h-0 gap-5 overflow-hidden">
      {/* ── Tabs de Navegación ── */}
      <div className="flex items-center gap-6 border-b border-slate-200 px-2 shrink-0 overflow-x-auto">
        <button
          onClick={() => setPestanaActiva('inventario')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            pestanaActiva === 'inventario'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          📦 Inventario Principal
        </button>
        <button
          onClick={() => setPestanaActiva('clasificacion')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            pestanaActiva === 'clasificacion'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          🏷️ Clasificaciones
        </button>
        <button
          onClick={() => setPestanaActiva('proveedores')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            pestanaActiva === 'proveedores'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          🏢 Proveedores
        </button>
      </div>

      {/* ── Modales ABM ── */}
      {modalAlta && (
        <ModalProducto producto={null} onCerrar={() => setModalAlta(false)} />
      )}
      {productoEditar && (
        <ModalProducto producto={productoEditar} onCerrar={() => setProductoEditar(null)} />
      )}

      <ProveedorModal 
        estaAbierto={modalProveedorAbierto}
        proveedorAEditar={proveedorEditar}
        alCerrar={() => {
          setModalProveedorAbierto(false);
          setProveedorEditar(null);
        }}
      />


      <ModalTaxonomias 
        estaAbierto={modalCategoriasAbierto} 
        alCerrar={() => setModalCategoriasAbierto(false)} 
      />

      {/* ── Modal Actualización Masiva ── */}
      {modalMasivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">Actualización Masiva de Precios</h3>
                  <p className="text-[10px] text-slate-500">Filtrá por marca, rubro o proveedor y aplicá un ajuste en lote</p>
                </div>
              </div>
              <button onClick={() => setModalMasivo(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Filtros */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Marca</label>
                  <input type="text" value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)} placeholder="Todas" className={inputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rubro</label>
                  <input type="text" value={filtroRubro} onChange={e => setFiltroRubro(e.target.value)} placeholder="Todos" className={inputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Proveedor</label>
                  <input type="text" value={filtroProveedor} onChange={e => setFiltroProveedor(e.target.value)} placeholder="Todos" className={inputCls} />
                </div>
              </div>

              {/* Selector de campo y ajuste */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Campo a ajustar</label>
                  <select value={campoAjuste} onChange={e => setCampoAjuste(e.target.value as any)} className={inputCls}>
                    <option value="todos">Todos los precios</option>
                    <option value="venta">Precio Mostrador</option>
                    <option value="mayorista">Precio Mayorista</option>
                    <option value="costo">Precio Costo</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tipo de ajuste</label>
                  <select value={tipoAjuste} onChange={e => setTipoAjuste(e.target.value as '%' | '$')} className={inputCls}>
                    <option value="%">Porcentaje (%)</option>
                    <option value="$">Monto fijo ($)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Valor de ajuste</label>
                  <input type="number" step={0.01} value={valorAjuste} onChange={e => setValorAjuste(Number(e.target.value))} className={inputCls} placeholder="0" />
                </div>
              </div>

              {/* Preview */}
              <div className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-bold ${
                productosParaAjuste.length > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <span>{productosParaAjuste.length === productos.length ? '📦 Todos los productos' : `🔍 ${productosParaAjuste.length} productos coindicen`}</span>
                <span className="text-xs font-medium">{valorAjuste > 0 ? `Ajuste: ${tipoAjuste === '%' ? `+${valorAjuste}%` : `+$${valorAjuste}`}` : 'Ingresá un valor'}</span>
              </div>

              {mensajeMasivo && <p className="text-sm font-bold text-center text-teal-700">{mensajeMasivo}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalMasivo(false)} className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={aplicandoMasivo || valorAjuste === 0 || productosParaAjuste.length === 0}
                  onClick={aplicarAjusteMasivo}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  {aplicandoMasivo ? 'Aplicando...' : `Aplicar a ${productosParaAjuste.length} productos`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notificación */}
      {mensajeNotificacion && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl shadow-lg shadow-emerald-900/10">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-bold text-emerald-800">{mensajeNotificacion}</span>
          </div>
        </div>
      )}

      {pestanaActiva === 'inventario' && (
        <>
          {/* Cabecera del Módulo */}
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

              <div className="flex flex-1 justify-end items-center gap-4 flex-wrap pb-2 sm:pb-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVerStockCritico(!verStockCritico)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm border whitespace-nowrap ${
                      verStockCritico 
                        ? 'bg-amber-100 text-amber-800 border-amber-300 ring-2 ring-amber-500/20' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle className={`h-4 w-4 ${verStockCritico ? 'text-amber-600' : 'text-slate-400'}`} />
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
                </div>
                
                <button
                  type="button"
                  onClick={() => setModalAlta(true)}
                  className="ml-auto sm:ml-0 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-teal-600/20 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
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
      {/* Tabla de Artículos */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg shadow-teal-900/5 overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Artículo</th>
              <th className="py-3 px-3">Código de Barras</th>
              <th className="py-3 px-3">Categoría</th>
              <th className="py-3 px-4 text-right">Precio Mostrador</th>
              <th className="py-3 px-4 text-right">Precio Mayorista</th>
              <th className="py-3 px-4 text-center">Stock Central</th>
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {productosFiltrados.map((prod) => {
              const stockBajo = prod.stock <= prod.stockMinimo;
              return (
                <tr key={prod.id} className="hover:bg-teal-50/30 transition-colors group">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {prod.imagenUrl ? (
                        <img
                          src={prod.imagenUrl}
                          alt={prod.nombre}
                          className="h-10 w-10 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-slate-400">
                          <Package className="h-5 w-5" />
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-slate-900 block">{prod.nombre}</span>
                        <span className="text-[10px] text-slate-400">Unidad: {prod.unidadMedida}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Barcode className="h-3.5 w-3.5 text-teal-600" />
                      <span className="font-bold text-teal-800">{prod.codigoBarras}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
                      {prod.categoria}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    ${(prod.precioVenta ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-teal-700">
                    ${(prod.precioMayorista ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    {(() => {
                      const agotado = prod.stock <= 0;
                      const stockBajo = prod.stock <= prod.stockMinimo && prod.stock > 0;
                      const saludable = prod.stock > prod.stockMinimo;

                      return (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          agotado
                            ? 'bg-rose-50 text-rose-900 border-rose-200'
                            : stockBajo
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {agotado && <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />}
                          {stockBajo && <div className="h-2 w-2 rounded-full bg-amber-500" />}
                          {saludable && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
                          <span>{prod.stock} u.</span>
                        </span>
                      );
                    })()}
                  </td>
                  {/* Columna Acciones */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setProductoEditar(prod)}
                        title="Editar artículo"
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-teal-50 hover:text-teal-700 border border-transparent hover:border-teal-200 transition-all"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setProductoAEliminar(prod); setModalEliminarAbierto(true); }}
                        title="Eliminar artículo"
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-200 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
      </>
      )}

      {pestanaActiva === 'clasificacion' && (
        <TabClasificaciones />
      )}

      {pestanaActiva === 'proveedores' && (
        <div className="flex-1 flex flex-col min-h-0 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>🏢</span> Directorio de Proveedores
              </h2>
              <p className="text-xs text-slate-500">Administrá las empresas que te suministran mercadería.</p>
            </div>
            <button 
              onClick={() => { setProveedorEditar(null); setModalProveedorAbierto(true); }}
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-teal-600/20 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Proveedor</span>
            </button>
          </div>
          <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            {proveedores.length === 0 ? (
              <div className="flex-1 overflow-y-auto p-8 text-center flex flex-col items-center justify-center">
                 <span className="text-4xl mb-3 grayscale opacity-50">📇</span>
                 <h3 className="text-slate-700 font-bold mb-1">Aún no hay proveedores</h3>
                 <p className="text-slate-500 text-sm">Agregá tu primer proveedor para empezar a asociarle artículos.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3 px-4">Razón Social</th>
                      <th className="py-3 px-4">CUIT</th>
                      <th className="py-3 px-4">Viajante</th>
                      <th className="py-3 px-4">Teléfono</th>
                      <th className="py-3 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {proveedores.map(prov => (
                      <tr key={prov.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="py-3 px-4 font-bold">{prov.razon_social}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{prov.cuit}</td>
                        <td className="py-3 px-4">{prov.viajante_contacto || '-'}</td>
                        <td className="py-3 px-4">{prov.telefono || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setProveedorEditar(prov); setModalProveedorAbierto(true); }} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => { setProveedorEliminar(prov); setModalEliminarProvAbierto(true); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <ModalConfirmacion
        estaAbierto={modalEliminarProvAbierto}
        titulo="Eliminar Proveedor"
        mensaje={`¿Estás seguro de que deseas eliminar a "${proveedorEliminar?.razon_social}"?`}
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        tipoAccion="peligro"
        alConfirmar={async () => {
          if (proveedorEliminar) {
            await eliminarProveedor(proveedorEliminar.id);
            setModalEliminarProvAbierto(false);
            setProveedorEliminar(null);
          }
        }}
        alCancelar={() => {
          setModalEliminarProvAbierto(false);
          setProveedorEliminar(null);
        }}
      />

      <ModalConfirmacion
        estaAbierto={modalEliminarAbierto}
        titulo="Eliminar Artículo"
        mensaje={`¿Estás seguro de que deseas eliminar "${productoAEliminar?.nombre}" del catálogo? Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar Artículo"
        textoCancelar="Cancelar"
        tipoAccion="peligro"
        alConfirmar={async () => {
          if (productoAEliminar) {
            await eliminarProducto(productoAEliminar.id);
            setModalEliminarAbierto(false);
            setProductoAEliminar(null);
          }
        }}
        alCancelar={() => {
          setModalEliminarAbierto(false);
          setProductoAEliminar(null);
        }}
      />

    </div>
  );
};
