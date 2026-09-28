// Archivo: src/views/empleados/EmpleadoModal.tsx
import React, { useState, useEffect } from 'react';
import { Empleado } from '../../models/empleado.model';

// ============================================================================
// INTERFACES
// ============================================================================
interface PropiedadesModal {
  empleadoEditar: Empleado | null;
  onGuardar: (empleado: Omit<Empleado, 'id' | 'empresa_id'> & { id?: number }) => Promise<boolean>;
  onCerrar: () => void;
}

// ============================================================================
// COMPONENTE: EmpleadoModal
// ============================================================================
export const EmpleadoModal: React.FC<PropiedadesModal> = ({ empleadoEditar, onGuardar, onCerrar }) => {
  // --- ESTADOS LOCALES ---
  const [nombre, asignarNombre] = useState('');
  const [usuario, asignarUsuario] = useState('');
  const [rol, asignarRol] = useState<'ADMIN' | 'VENDEDOR'>('VENDEDOR');
  const [pinAcceso, asignarPinAcceso] = useState('');
  const [guardando, asignarGuardando] = useState(false);

  // --- EFECTOS ---
  useEffect(() => {
    if (empleadoEditar) {
      asignarNombre(empleadoEditar.nombre || '');
      asignarUsuario(empleadoEditar.usuario || '');
      asignarRol((empleadoEditar.rol as 'ADMIN' | 'VENDEDOR') || 'VENDEDOR');
      asignarPinAcceso(empleadoEditar.pin_acceso || empleadoEditar.pinOContrasena || '');
    }
  }, [empleadoEditar]);

  // --- MANEJADORES ---
  const manejarEnvio = async (evento: React.FormEvent) => {
    evento.preventDefault();
    if (pinAcceso.length < 4) {
      alert('Por seguridad, el PIN táctil debe contener al menos 4 dígitos.');
      return;
    }
    
    asignarGuardando(true);
    const exito = await onGuardar({
      ...(empleadoEditar?.id ? { id: empleadoEditar.id } : {}),
      nombre,
      usuario,
      rol,
      pin_acceso: pinAcceso,
      pinOContrasena: pinAcceso // Soporte retrocompatible
    });

    asignarGuardando(false);
    if (exito) onCerrar();
  };

  // --- RENDERIZADO ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        
        <header className="bg-slate-50 px-6 py-5 border-b border-slate-100">
          <h2 className="text-xl font-extrabold text-slate-800">
            {empleadoEditar ? 'Editar Perfil de Empleado' : 'Registrar Nuevo Empleado'}
          </h2>
        </header>

        <form onSubmit={manejarEnvio} className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-700">Nombre Completo</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => asignarNombre(e.target.value)}
              className="rounded-xl border border-slate-300 p-3 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Ej: Laura Méndez"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-700">Usuario de Ingreso (Login)</label>
            <input
              type="text"
              required
              value={usuario}
              onChange={(e) => asignarUsuario(e.target.value)}
              className="rounded-xl border border-slate-300 p-3 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Ej: laura.m"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">Privilegios (Rol)</label>
              <select
                value={rol}
                onChange={(e) => asignarRol(e.target.value as 'ADMIN' | 'VENDEDOR')}
                className="rounded-xl border border-slate-300 p-3 outline-none bg-white font-medium transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="VENDEDOR">Vendedor</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">PIN Táctil (POS)</label>
              <input
                type="text"
                required
                maxLength={6}
                pattern="\d+"
                value={pinAcceso}
                onChange={(e) => asignarPinAcceso(e.target.value.replace(/\D/g, ''))}
                className="rounded-xl border border-slate-300 p-3 outline-none text-center font-mono tracking-widest transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="1234"
              />
            </div>
          </div>

          <footer className="mt-2 flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              className="rounded-xl px-5 py-3 font-bold text-slate-600 transition-colors hover:bg-slate-100 active:bg-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-95 disabled:opacity-50"
            >
              {guardando ? 'Almacenando...' : 'Confirmar Datos'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
