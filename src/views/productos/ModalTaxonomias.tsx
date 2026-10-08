import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { X, Pencil, Trash2, Tag, Layers, Briefcase, ListTree, Box } from 'lucide-react';

interface ModalTaxonomiasProps {
  estaAbierto: boolean;
  alCerrar: () => void;
}

export const ModalTaxonomias: React.FC<ModalTaxonomiasProps> = ({ estaAbierto, alCerrar }) => {
  const [pestana, setPestana] = useState<'rubros' | 'marcas' | 'categorias' | 'subcategorias' | 'proveedores'>('rubros');

  const rubros = useLiveQuery(() => db.rubros.toArray()) ?? [];
  const marcas = useLiveQuery(() => db.marcas.toArray()) ?? [];
  const categorias = useLiveQuery(() => db.categorias.toArray()) ?? [];
  const subcategorias = useLiveQuery(() => db.subcategorias.toArray()) ?? [];
  const proveedores = useLiveQuery(() => db.proveedores.toArray()) ?? [];

  const productos = useLiveQuery(() => db.productos.toArray()) ?? [];

  if (!estaAbierto) return null;

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

  const renderTabs = () => (
    <div className="flex border-b border-slate-200 px-4 overflow-x-auto shrink-0 bg-slate-50">
      {[
        { id: 'rubros', icon: <Layers className="w-4 h-4" />, label: 'Rubros' },
        { id: 'marcas', icon: <Tag className="w-4 h-4" />, label: 'Marcas' },
        { id: 'categorias', icon: <ListTree className="w-4 h-4" />, label: 'Categorías' },
        { id: 'subcategorias', icon: <Box className="w-4 h-4" />, label: 'Subcategorías' },
        { id: 'proveedores', icon: <Briefcase className="w-4 h-4" />, label: 'Proveedores' },
      ].map((t) => (
        <button
          key={t.id}
          onClick={() => setPestana(t.id as any)}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-colors border-b-2 whitespace-nowrap ${
            pestana === t.id ? 'border-teal-600 text-teal-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
          }`}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );

  const renderLista = () => {
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

    if (data.length === 0) {
      return (
        <div className="p-8 text-center text-slate-400 text-xs font-medium">
          No hay registros guardados en esta sección.
        </div>
      );
    }

    return (
      <div className="overflow-y-auto max-h-[50vh] p-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-2 px-3">Nombre</th>
              {pestana !== 'rubros' && pestana !== 'proveedores' && (
                <th className="py-2 px-3">Jerarquía Padre</th>
              )}
              <th className="py-2 px-3">Artículos Asociados</th>
              <th className="py-2 px-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((item) => {
              const count = productos.filter((p: any) => p[prodPropName] === item[propName]).length;
              return (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                <td className="py-2.5 px-3 text-xs font-bold text-slate-700">{item[propName]}</td>
                {pestana !== 'rubros' && pestana !== 'proveedores' && (
                  <td className="py-2.5 px-3 text-[10px] text-slate-500 font-medium">
                    {parentLabels(item)}
                  </td>
                )}
                <td className="py-2.5 px-3 text-[10px] text-slate-500 font-medium">
                  <span className={`px-2 py-0.5 rounded-full ${count > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                    {count} {count === 1 ? 'artículo' : 'artículos'}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEditar(pestana, item.id, item[propName], propName)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleEliminar(pestana, item.id, item[propName], count)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={alCerrar} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-3xl overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm text-teal-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800">Administrador de Taxonomías</h2>
              <p className="text-[10px] text-slate-500">Gestión global de listas maestras del sistema</p>
            </div>
          </div>
          <button onClick={alCerrar} className="p-2 text-slate-400 hover:bg-white rounded-xl transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        {renderTabs()}

        {/* Contenido */}
        <div className="bg-white flex-1 min-h-[300px]">
          {renderLista()}
        </div>
      </div>
    </div>
  );
};
