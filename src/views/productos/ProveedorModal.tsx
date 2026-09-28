import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Proveedor } from '../../models/proveedor.model';
import { useProveedoresController } from '../../controllers/useProveedoresController';

interface ProveedorModalProps {
  estaAbierto: boolean;
  proveedorAEditar: Proveedor | null;
  alCerrar: () => void;
}

export const ProveedorModal: React.FC<ProveedorModalProps> = ({ estaAbierto, proveedorAEditar, alCerrar }) => {
  const { guardarProveedor } = useProveedoresController();
  const [form, setForm] = useState({ razon_social: '', cuit: '', telefono: '', viajante_contacto: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (proveedorAEditar) {
      setForm({
        razon_social: proveedorAEditar.razon_social,
        cuit: proveedorAEditar.cuit,
        telefono: proveedorAEditar.telefono || '',
        viajante_contacto: proveedorAEditar.viajante_contacto || ''
      });
    } else {
      setForm({ razon_social: '', cuit: '', telefono: '', viajante_contacto: '' });
    }
    setError('');
  }, [proveedorAEditar, estaAbierto]);

  if (!estaAbierto) return null;

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.razon_social.trim() || !form.cuit.trim()) {
      setError('Razón Social y CUIT son obligatorios.');
      return;
    }
    try {
      await guardarProveedor({
        ...(proveedorAEditar ? { id: proveedorAEditar.id } : {}),
        ...form
      });
      alCerrar();
    } catch (err) {
      setError('Error al guardar. Verifica la conexión o recarga la base de datos.');
    }
  };

  const inputCls = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all outline-hidden";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={alCerrar} />

      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-black text-slate-800">
            {proveedorAEditar ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </h3>
          <button onClick={alCerrar} className="p-1.5 text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleGuardar}>
          <div className="p-6 space-y-4">
            {error && <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">{error}</div>}
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Razón Social *</label>
              <input type="text" value={form.razon_social} onChange={e => setForm({...form, razon_social: e.target.value})} className={inputCls} placeholder="Ej: Distribuidora SA" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">CUIT *</label>
              <input type="text" value={form.cuit} onChange={e => setForm({...form, cuit: e.target.value})} className={inputCls} placeholder="30-12345678-9" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Teléfono</label>
              <input type="text" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} className={inputCls} placeholder="Ej: 011 4444 5555" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Viajante / Contacto</label>
              <input type="text" value={form.viajante_contacto} onChange={e => setForm({...form, viajante_contacto: e.target.value})} className={inputCls} placeholder="Ej: Juan Perez" />
            </div>
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
            <button type="button" onClick={alCerrar} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
            <button type="submit" className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all">
              <Save className="h-4 w-4" /> Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
