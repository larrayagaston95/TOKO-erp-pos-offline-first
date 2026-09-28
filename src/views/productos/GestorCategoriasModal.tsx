import React, { useState } from 'react';
import { X, Plus, Trash2, Tag, AlertCircle } from 'lucide-react';
import { useCategoriasController } from '../../controllers/useCategoriasController';

interface GestorCategoriasModalProps {
  estaAbierto: boolean;
  alCerrar: () => void;
}

/**
 * ============================================================================
 * VISTA: GESTIÓN DE RUBROS (CATEGORÍAS)
 * ============================================================================
 * Modal aislado para el alta y baja de categorías/rubros del catálogo.
 */
export const GestorCategoriasModal: React.FC<GestorCategoriasModalProps> = ({ estaAbierto, alCerrar }) => {
  const { categorias, agregarCategoria, eliminarCategoria, error } = useCategoriasController();
  const [nuevoRubro, setNuevoRubro] = useState('');

  if (!estaAbierto) return null;

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoRubro.trim()) return;
    try {
      await agregarCategoria(nuevoRubro.trim());
      setNuevoRubro('');
    } catch (e) {
      // El error ya lo maneja el controlador y lo expone en `error`
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in">
      {/* Fondo Semitransparente */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={alCerrar} />

      {/* Contenedor Principal */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white border border-slate-200 shadow-sm rounded-lg text-slate-700">
              <Tag className="h-4 w-4" />
            </div>
            <h3 className="font-black text-slate-800">Gestión de Rubros</h3>
          </div>
          <button
            onClick={alCerrar}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Área de Input (Alta Rápida) */}
        <div className="p-6 border-b border-slate-100 bg-white">
          <form onSubmit={handleAgregar} className="flex gap-2">
            <input
              type="text"
              value={nuevoRubro}
              onChange={(e) => setNuevoRubro(e.target.value)}
              placeholder="Ej: Bebidas sin alcohol..."
              className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-hidden focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all"
            />
            <button
              type="submit"
              disabled={!nuevoRubro.trim()}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors shadow-sm active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </button>
          </form>
          {error && (
            <div className="mt-3 flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Lista de Rubros Actuales */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
          {categorias.length === 0 ? (
            <div className="text-center py-10 flex flex-col items-center">
              <Tag className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-slate-500 text-sm font-medium">No hay rubros registrados.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {categorias.map((cat) => (
                <li
                  key={cat.id}
                  className="flex items-center justify-between p-3.5 mx-1 bg-white border border-slate-200/60 rounded-xl shadow-sm hover:border-slate-300 transition-colors group"
                >
                  <span className="text-sm font-bold text-slate-700">{cat.nombre}</span>
                  <button
                    onClick={() => eliminarCategoria(cat.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Eliminar Rubro"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
};
