import React, { useState } from 'react';
import { useClientesController, ClienteConSaldo } from '../../controllers/useClientesController';
import { Users, Search, Plus, User, Phone, MapPin, CreditCard, DollarSign, Edit, X, Wallet, ArrowDownRight, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Cliente } from '../../models';

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
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  const [montoPago, setMontoPago] = useState<number>(0);
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'DEBITO' | 'TRANSFERENCIA_QR'>('EFECTIVO');
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

  const procesarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clienteCuentaCorriente && montoPago > 0) {
      const exito = await controlador.registrarPago(clienteCuentaCorriente.id, montoPago, metodoPago, 'Pago a cuenta');
      if (exito) {
        setModalPagoAbierto(false);
        setMontoPago(0);
        mostrarToast('Pago registrado correctamente');
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

      {/* ===================================================================
          MODAL: CUENTA CORRIENTE (HISTORIAL Y PAGO)
          =================================================================== */}
      {clienteCuentaCorriente && !modalPagoAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200/80">
            <div className="bg-slate-900 p-6 text-white shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Wallet className="w-48 h-48 text-white" />
              </div>
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      <Wallet className="h-5 w-5" />
                    </div>
                    Estado de Cuenta Corriente
                  </h3>
                  <p className="text-slate-300 font-medium mt-2 text-sm">{clienteCuentaCorriente.nombre} • {clienteCuentaCorriente.documento}</p>
                </div>
                <button onClick={() => setClienteCuentaCorriente(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="relative z-10 mt-6 flex items-end justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Saldo Actual</p>
                  <p className={`text-4xl font-mono font-black ${clienteCuentaCorriente.saldoCalculado > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    ${Math.abs(clienteCuentaCorriente.saldoCalculado).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {clienteCuentaCorriente.saldoCalculado > 0 && (
                  <button
                    onClick={() => setModalPagoAbierto(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                  >
                    <CreditCard className="h-4 w-4" />
                    Registrar Pago
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-50">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white sticky top-0 border-b border-slate-200 shadow-sm z-10">
                  <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-6">Fecha</th>
                    <th className="py-3 px-6">Concepto</th>
                    <th className="py-3 px-6 text-right">Cargo (Fiado)</th>
                    <th className="py-3 px-6 text-right">Abono (Pago)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {controlador.obtenerHistorialCliente(clienteCuentaCorriente.id).map(mov => (
                    <tr key={mov.id} className="hover:bg-teal-50/30 transition-colors">
                      <td className="py-3 px-6 font-medium text-slate-500">
                        {new Date(mov.fechaHora).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3 px-6 font-bold text-slate-800 flex items-center gap-2">
                        {mov.tipo === 'COMPRA' ? (
                          <div className="p-1 rounded bg-rose-100 text-rose-600"><ArrowDownRight className="h-3.5 w-3.5" /></div>
                        ) : (
                          <div className="p-1 rounded bg-emerald-100 text-emerald-600"><ArrowUpRight className="h-3.5 w-3.5" /></div>
                        )}
                        {mov.descripcion}
                      </td>
                      <td className="py-3 px-6 font-mono font-black text-rose-600 text-right">
                        {mov.tipo === 'COMPRA' ? `$${mov.monto.toLocaleString('es-AR', {minimumFractionDigits: 2})}` : '-'}
                      </td>
                      <td className="py-3 px-6 font-mono font-black text-emerald-600 text-right">
                        {mov.tipo === 'PAGO' ? `$${mov.monto.toLocaleString('es-AR', {minimumFractionDigits: 2})}` : '-'}
                      </td>
                    </tr>
                  ))}
                  {controlador.obtenerHistorialCliente(clienteCuentaCorriente.id).length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-500 font-medium bg-white">
                        No hay movimientos registrados para este cliente.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: REGISTRAR PAGO
          =================================================================== */}
      {modalPagoAbierto && clienteCuentaCorriente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-5 border-b border-indigo-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-indigo-900 flex items-center gap-2 mb-0.5">
                  <CreditCard className="h-4 w-4 text-indigo-600" />
                  Registrar Pago
                </h3>
                <p className="text-xs font-medium text-indigo-600/80">
                  Abonar a cuenta de {clienteCuentaCorriente.nombre}
                </p>
              </div>
              <button onClick={() => setModalPagoAbierto(false)} className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-100 hover:text-indigo-700 transition-colors cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={procesarPago} className="p-5">
              <div className="mb-5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Monto a Pagar ($)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={clienteCuentaCorriente.saldoCalculado > 0 ? clienteCuentaCorriente.saldoCalculado : undefined}
                  required
                  autoFocus
                  value={montoPago || ''}
                  onChange={e => setMontoPago(Number(e.target.value))}
                  className="w-full text-center text-4xl font-mono font-black text-slate-800 border-b-2 border-slate-200 focus:border-indigo-500 outline-none pb-2 bg-transparent transition-colors"
                  placeholder="0.00"
                />
                {clienteCuentaCorriente.saldoCalculado > 0 && (
                  <div className="mt-3 text-center">
                    <button 
                      type="button" 
                      onClick={() => setMontoPago(clienteCuentaCorriente.saldoCalculado)}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors border border-indigo-200 cursor-pointer"
                    >
                      Saldar total adeudado: ${clienteCuentaCorriente.saldoCalculado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </button>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Medio de Pago</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['EFECTIVO', 'DEBITO', 'TRANSFERENCIA_QR'] as const).map(metodo => (
                    <button
                      key={metodo}
                      type="button"
                      onClick={() => setMetodoPago(metodo)}
                      className={`py-2 px-1 rounded-xl text-[10px] font-bold transition-all border cursor-pointer ${
                        metodoPago === metodo 
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      {metodo.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalPagoAbierto(false);
                    setMontoPago(0);
                  }}
                  className="flex-1 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!montoPago || montoPago <= 0 || controlador.cargando}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {controlador.cargando ? 'Procesando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
