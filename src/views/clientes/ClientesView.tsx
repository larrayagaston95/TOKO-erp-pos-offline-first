import React, { useState } from 'react';
import { useClientesController, ClienteConSaldo } from '../../controllers/useClientesController';
import { Users, Search, Plus, User, Phone, MapPin, Edit, X, Wallet, CheckCircle2, DollarSign } from 'lucide-react';
import { Cliente } from '../../models';
import { DetalleCuentaCorriente } from './DetalleCuentaCorriente';

/**
 * ============================================================================
 * VISTA: GESTIÓN DE CLIENTES Y CUENTA CORRIENTE
 * ============================================================================
 */
export const ClientesView: React.FC = () => {
  const controlador = useClientesController();
  const [busqueda, setBusqueda] = useState('');
  
  // Estados para modales
  const [clienteEditando, setClienteEditando] = useState<Partial<Cliente> | null>(null);
  const [clienteCuentaCorriente, setClienteCuentaCorriente] = useState<ClienteConSaldo | null>(null);
  const [toastExito, setToastExito] = useState<string | null>(null);

  // Totales
  const totalDeudaCalle = controlador.clientes.reduce((sum, c) => sum + (c.saldoCalculado > 0 ? c.saldoCalculado : 0), 0);
  const clientesConDeuda = controlador.clientes.filter(c => c.saldoCalculado > 0).length;

  const clientesFiltrados = controlador.clientes.filter(c => 
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    c.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.documento.includes(busqueda)
  );

  const guardarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clienteEditando) {
      const exito = await controlador.guardarCliente(clienteEditando as Cliente);
      if (exito) {
        setClienteEditando(null);
        mostrarToast('Cliente guardado correctamente');
      }
    }
  };

  const mostrarToast = (mensaje: string) => {
    setToastExito(mensaje);
    setTimeout(() => setToastExito(null), 3000);
  };

  return (
    <div id="vista-clientes-modulo" className="flex-1 p-6 bg-slate-50/70 overflow-y-auto space-y-5">
      {/* Toast Notificación */}
      {toastExito && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl shadow-lg shadow-emerald-900/10">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-bold text-emerald-800">{toastExito}</span>
          </div>
        </div>
      )}

      {/* Si hay un cliente seleccionado para CC, mostramos el detalle en lugar del listado */}
      {clienteCuentaCorriente ? (
        <DetalleCuentaCorriente
          cliente={clienteCuentaCorriente}
          controlador={controlador}
          alVolver={() => setClienteCuentaCorriente(null)}
        />
      ) : (
        <>
          {/* Tarjetas de Métricas (Header) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-lg shadow-teal-900/5 border border-slate-200/80 flex items-center gap-4">
          <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
            <DollarSign className="h-6 w-6 text-rose-500" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Deuda en la Calle</p>
            <p className="text-2xl font-black text-slate-900">${totalDeudaCalle.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-lg shadow-teal-900/5 border border-slate-200/80 flex items-center gap-4">
          <div className="bg-teal-50 p-3 rounded-xl border border-teal-100">
            <Users className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Clientes Activos con Deuda</p>
            <p className="text-2xl font-black text-slate-900">{clientesConDeuda} <span className="text-sm font-medium text-slate-400">/ {controlador.clientes.length} total</span></p>
          </div>
        </div>
      </div>

      {/* Cabecera del Módulo (Buscador y Nuevo) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-lg shadow-teal-900/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
              <Users className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900">Cartera de Clientes</h2>
          </div>
          <p className="text-xs text-slate-500">
            Gestión de clientes, cuentas corrientes, fiados y pagos a cuenta.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-600" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, código o CUIT..."
              className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 w-72 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => setClienteEditando({ 
              nombre: '', codigo: '', documento: '', telefono: '', direccion: '', 
              tipo: 'CONSUMIDOR_FINAL', zonaRuta: '', listaPrecioPorDefecto: 'MOSTRADOR', saldoCuentaCorriente: 0, limiteCredito: 0 
            })}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-teal-600/20 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Tabla de Clientes (Full Width) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg shadow-teal-900/5 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Cliente / Razón Social</th>
              <th className="py-3 px-4">Contacto</th>
              <th className="py-3 px-4">Perfil</th>
              <th className="py-3 px-4 text-right">Saldo Actual</th>
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {clientesFiltrados.map((cliente) => (
              <tr key={cliente.id} className="hover:bg-teal-50/30 transition-colors group">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-teal-600 font-black text-lg">
                      {cliente.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">{cliente.nombre}</span>
                      <span className="text-[10px] text-slate-500">{cliente.documento} • {cliente.codigo}</span>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-slate-600"><Phone className="h-3.5 w-3.5 text-slate-400" /> {cliente.telefono || '-'}</span>
                    <span className="flex items-center gap-1.5 text-slate-600 truncate max-w-[200px]" title={cliente.direccion}><MapPin className="h-3.5 w-3.5 text-slate-400" /> {cliente.direccion || '-'}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80 uppercase tracking-wider">
                    {cliente.tipo.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className={`font-mono font-black text-sm ${cliente.saldoCalculado > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      ${Math.abs(cliente.saldoCalculado).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                    {cliente.saldoCalculado > 0 && <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Deuda Activa</span>}
                    {cliente.saldoCalculado <= 0 && <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Al Día</span>}
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setClienteCuentaCorriente(cliente)}
                      title="Ver Cuenta Corriente"
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-200 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Wallet className="h-4 w-4" /> <span className="text-[10px] font-bold uppercase tracking-wider">Cta. Cte.</span>
                    </button>
                    <button
                      onClick={() => setClienteEditando(cliente)}
                      title="Editar Cliente"
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-teal-50 hover:text-teal-600 border border-transparent hover:border-teal-200 transition-all cursor-pointer"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {clientesFiltrados.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                  No se encontraron clientes que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===================================================================
          MODAL: EDITAR / NUEVO CLIENTE
          =================================================================== */}
      {clienteEditando && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200/80">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-emerald-50">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-white border border-teal-100 text-teal-600">
                  <User className="h-4 w-4" />
                </div>
                {clienteEditando.id ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <button onClick={() => setClienteEditando(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={guardarCliente} className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nombre / Razón Social</label>
                  <input
                    type="text"
                    required
                    value={clienteEditando.nombre}
                    onChange={e => setClienteEditando({...clienteEditando, nombre: e.target.value})}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all w-full"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">DNI / CUIT</label>
                  <input
                    type="text"
                    required
                    value={clienteEditando.documento}
                    onChange={e => setClienteEditando({...clienteEditando, documento: e.target.value})}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all w-full"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Teléfono</label>
                  <input
                    type="text"
                    value={clienteEditando.telefono}
                    onChange={e => setClienteEditando({...clienteEditando, telefono: e.target.value})}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all w-full"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Código / Referencia</label>
                  <input
                    type="text"
                    value={clienteEditando.codigo}
                    onChange={e => setClienteEditando({...clienteEditando, codigo: e.target.value})}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all w-full"
                  />
                </div>
                <div className="md:col-span-2 flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Dirección</label>
                  <input
                    type="text"
                    value={clienteEditando.direccion}
                    onChange={e => setClienteEditando({...clienteEditando, direccion: e.target.value})}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all w-full"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tipo de Cliente</label>
                  <select
                    value={clienteEditando.tipo}
                    onChange={e => setClienteEditando({...clienteEditando, tipo: e.target.value as any})}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all w-full cursor-pointer"
                  >
                    <option value="CONSUMIDOR_FINAL">Consumidor Final</option>
                    <option value="COMERCIO_MINORISTA">Comercio Minorista</option>
                    <option value="DISTRIBUIDOR">Distribuidor</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Límite de Crédito ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={clienteEditando.limiteCredito}
                    onChange={e => setClienteEditando({...clienteEditando, limiteCredito: Number(e.target.value)})}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all w-full"
                  />
                </div>
              </div>
              
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setClienteEditando(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={controlador.cargando}
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-teal-600/20 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                >
                  {controlador.cargando ? 'Guardando...' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
