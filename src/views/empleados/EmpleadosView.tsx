import React, { useState } from 'react';
import { useEmpleadosController } from '../../controllers/useEmpleadosController';
import { Search, Plus, Edit2, Trash2, Shield, User, X, Check } from 'lucide-react';
import { Empleado, RolSeguridad } from '../../models';

/**
 * ============================================================================
 * VISTA: GESTIÓN DE PERSONAL Y ROLES (EmpleadosView.tsx)
 * ============================================================================
 * Permite a los administradores gestionar los usuarios del sistema.
 */
export const EmpleadosView: React.FC = () => {
  const controlador = useEmpleadosController();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [empleadoEnEdicion, setEmpleadoEnEdicion] = useState<Empleado | null>(null);

  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [usuario, setUsuario] = useState('');
  const [pinOContrasena, setPinOContrasena] = useState('');
  const [rol, setRol] = useState<RolSeguridad>('VENDEDOR');

  const abrirModalCrear = () => {
    setEmpleadoEnEdicion(null);
    setNombre('');
    setUsuario('');
    setPinOContrasena('');
    setRol('VENDEDOR');
    setModalAbierto(true);
  };

  const abrirModalEditar = (empleado: Empleado) => {
    setEmpleadoEnEdicion(empleado);
    setNombre(empleado.nombre);
    setUsuario(empleado.usuario);
    setPinOContrasena(empleado.pinOContrasena);
    setRol(empleado.rol);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
  };

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !usuario || !pinOContrasena) return;

    if (empleadoEnEdicion) {
      await controlador.editarEmpleado(empleadoEnEdicion.id, { nombre, usuario, pinOContrasena, rol });
    } else {
      await controlador.crearEmpleado(nombre, usuario, pinOContrasena, rol);
    }
    cerrarModal();
  };

  const manejarEliminar = async (empleado: Empleado) => {
    if (empleado.rol === 'ADMIN' && controlador.empleados.filter(e => e.rol === 'ADMIN').length === 1) {
      alert("No puedes eliminar al único administrador del sistema.");
      return;
    }
    if (window.confirm(`¿Estás seguro de eliminar al empleado "${empleado.nombre}"?`)) {
      await controlador.eliminarEmpleado(empleado.id);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50/50 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Personal & Roles
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Gestión de usuarios, accesos y credenciales del sistema
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar personal..." 
              value={controlador.busqueda}
              onChange={(e) => controlador.setBusqueda(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none w-64 shadow-sm"
            />
          </div>
          <button 
            onClick={abrirModalCrear}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo Empleado
          </button>
        </div>
      </div>

      {/* Grid de Empleados */}
      <div className="flex-1 overflow-auto bg-white rounded-2xl shadow-sm border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Nombre del Empleado</th>
              <th className="px-6 py-4 font-semibold">Usuario (Login)</th>
              <th className="px-6 py-4 font-semibold">Rol de Acceso</th>
              <th className="px-6 py-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {controlador.empleados.map(empleado => (
              <tr key={empleado.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${empleado.rol === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-teal-100 text-teal-600'}`}>
                      {empleado.rol === 'ADMIN' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{empleado.nombre}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 font-mono">
                    {empleado.usuario}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                    empleado.rol === 'ADMIN' 
                      ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {empleado.rol}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => abrirModalEditar(empleado)}
                      className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                      title="Editar empleado"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => manejarEliminar(empleado)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar empleado"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {controlador.empleados.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500 text-sm">
                  No se encontraron empleados con los criterios de búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal CRUD */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-lg">
                {empleadoEnEdicion ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h3>
              <button 
                onClick={cerrarModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={manejarSubmit} className="p-6 space-y-4 flex-1">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Nombre Completo
                </label>
                <input 
                  type="text"
                  required
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Usuario
                  </label>
                  <input 
                    type="text"
                    required
                    value={usuario}
                    onChange={e => setUsuario(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-mono"
                    placeholder="jperez"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    PIN / Contraseña
                  </label>
                  <input 
                    type="text"
                    required
                    value={pinOContrasena}
                    onChange={e => setPinOContrasena(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                    placeholder="1234"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Rol de Seguridad
                </label>
                <select
                  value={rol}
                  onChange={e => setRol(e.target.value as RolSeguridad)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium text-slate-700"
                >
                  <option value="VENDEDOR">Vendedor / Cajero</option>
                  <option value="VENTA_LOGISTICA">Venta y Logística</option>
                  <option value="ADMIN">Administrador (Acceso Total)</option>
                </select>
                {rol === 'ADMIN' && (
                  <p className="text-[11px] text-purple-600 mt-1 flex items-center gap-1 font-medium">
                    <Shield className="w-3 h-3" />
                    Tendrá acceso total al sistema, reportes y configuración.
                  </p>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-6">
                <button 
                  type="button"
                  onClick={cerrarModal}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
