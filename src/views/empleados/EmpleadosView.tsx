// Archivo: src/views/empleados/EmpleadosView.tsx
import React, { useEffect, useState } from 'react';
import { useEmpleadosController } from '../../controllers/useEmpleadosController';
import { EmpleadoModal } from './EmpleadoModal';
import { Empleado } from '../../models/empleado.model';

// ============================================================================
// VISTA PRINCIPAL: Módulo de Empleados
// ============================================================================
export const EmpleadosView: React.FC = () => {
  // --- CONTROLADOR ---
  const controlador = useEmpleadosController();

  // --- ESTADO LOCAL DE INTERFAZ ---
  const [terminoBusqueda, asignarTerminoBusqueda] = useState('');
  const [modalAbierto, asignarModalAbierto] = useState(false);
  const [empleadoSeleccionado, asignarEmpleadoSeleccionado] = useState<Empleado | null>(null);

  // --- EFECTO DE INICIO ---
  useEffect(() => {
    controlador.cargarEmpleados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- EVENTOS INTERFAZ ---
  const abrirModalCreacion = () => {
    asignarEmpleadoSeleccionado(null);
    asignarModalAbierto(true);
  };

  const abrirModalEdicion = (empleado: Empleado) => {
    asignarEmpleadoSeleccionado(empleado);
    asignarModalAbierto(true);
  };

  const manejarEliminacion = async (idEmpleado: number) => {
    if (window.confirm('¿Confirmas que deseas retirar el acceso a este empleado de forma permanente?')) {
      await controlador.eliminarEmpleado(idEmpleado);
    }
  };

  // --- DERIVADOS ---
  const empleadosFiltrados = controlador.empleados.filter((emp) =>
    emp.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
    emp.usuario.toLowerCase().includes(terminoBusqueda.toLowerCase())
  );

  // --- RENDERIZADO ---
  return (
    <div className="flex-1 w-full h-full flex flex-col p-6 overflow-hidden bg-slate-50">
      
      {/* CABECERA */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Gestión de Empleados</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Acreditaciones y perfiles para el entorno POS Offline.
          </p>
        </div>
        <button
          onClick={abrirModalCreacion}
          className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow active:scale-95"
        >
          + Incorporar Empleado
        </button>
      </header>

      {/* BARRA DE BÚSQUEDA */}
      <div className="w-full shrink-0 mb-6 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
        <input
          type="text"
          placeholder="Rastrear por nombre o clave de usuario..."
          value={terminoBusqueda}
          onChange={(e) => asignarTerminoBusqueda(e.target.value)}
          className="w-full sm:max-w-md border-none bg-transparent p-3 text-slate-700 outline-none placeholder:text-slate-400 font-medium"
        />
      </div>

      {/* TABLA DE DATOS */}
      <div className="w-full flex-1 overflow-auto rounded-2xl bg-white shadow-sm border border-slate-200">
        <table className="w-full min-w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 sticky top-0 border-b border-slate-200">
            <tr>
              <th className="p-5 font-bold tracking-wide">Identidad (Nombre)</th>
              <th className="p-5 font-bold tracking-wide">Credencial (Login)</th>
              <th className="p-5 font-bold tracking-wide">Nivel de Acceso</th>
              <th className="p-5 font-bold tracking-wide text-right">Controles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {controlador.cargando ? (
              <tr>
                <td colSpan={4} className="p-10 text-center font-medium text-slate-400">
                  Verificando perfiles...
                </td>
              </tr>
            ) : empleadosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-10 text-center font-medium text-slate-400">
                  La búsqueda no coincide con ningún empleado registrado.
                </td>
              </tr>
            ) : (
              empleadosFiltrados.map((empleado) => (
                <tr key={empleado.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-5 font-bold text-slate-800">{empleado.nombre}</td>
                  <td className="p-5 font-medium text-slate-500">@{empleado.usuario}</td>
                  <td className="p-5">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                      empleado.rol === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}>
                      {empleado.rol}
                    </span>
                  </td>
                  <td className="p-5 text-right font-semibold">
                    <button
                      onClick={() => abrirModalEdicion(empleado)}
                      className="mr-4 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Modificar
                    </button>
                    <button
                      onClick={() => empleado.id && manejarEliminacion(empleado.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      Retirar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PORTAL MODAL */}
      {modalAbierto && (
        <EmpleadoModal
          empleadoEditar={empleadoSeleccionado}
          onGuardar={controlador.guardarEmpleado}
          onCerrar={() => asignarModalAbierto(false)}
        />
      )}
    </div>
  );
};

export default EmpleadosView;
