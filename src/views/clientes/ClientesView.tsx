import React, { useState } from 'react';
import { useClientesController, ClienteConSaldo } from '../../controllers/useClientesController';
import { Users, Search, Plus, User, Phone, MapPin, CreditCard, DollarSign, Edit, Trash2, X, Wallet, ArrowDownRight, ArrowUpRight, CheckCircle2 } from 'lucide-react';
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
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative">
      {/* Toast Notificación */}
      {toastExito && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in duration-300">
          <div className="bg-emerald-500 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            {toastExito}
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Users className="h-7 w-7 text-teal-600" />
            Clientes y Cuentas Corrientes
          </h1>
          <p className="text-sm font-medium text-slate-500">Gestión de cartera, fiados y pagos a cuenta</p>
        </div>
        <button
          onClick={() => setClienteEditando({ 
            nombre: '', codigo: '', documento: '', telefono: '', direccion: '', 
            tipo: 'CONSUMIDOR_FINAL', zonaRuta: '', listaPrecioPorDefecto: 'MOSTRADOR', saldoCuentaCorriente: 0, limiteCredito: 0 
          })}
          className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors active:scale-95"
        >
          <Plus className="h-5 w-5" /> Nuevo Cliente
        </button>
      </header>

      {/* TARJETAS RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 shrink-0">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-red-50 p-4 rounded-xl">
            <DollarSign className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Total en la Calle (Deuda)</p>
            <p className="text-3xl font-black text-slate-800">${totalDeudaCalle.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-teal-50 p-4 rounded-xl">
            <Users className="h-8 w-8 text-teal-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Clientes con Deuda Activa</p>
            <p className="text-3xl font-black text-slate-800">{clientesConDeuda} <span className="text-base font-medium text-slate-400">/ {controlador.clientes.length} total</span></p>
          </div>
        </div>
      </div>

      {/* FILTROS Y TABLA */}
      <div className="flex-1 flex flex-col p-6 pt-0 min-h-0">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col min-h-0">
          <div className="p-4 border-b border-slate-100">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre, código o CUIT..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all outline-none"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contacto</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Perfil</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Saldo (Deuda)</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientesFiltrados.map(cliente => (
                  <tr key={cliente.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-lg shrink-0">
                          {cliente.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{cliente.nombre}</p>
                          <p className="text-xs font-medium text-slate-500">{cliente.documento} • {cliente.codigo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs font-medium text-slate-600 flex flex-col gap-1">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-slate-400" /> {cliente.telefono}</span>
                        <span className="flex items-center gap-1 truncate max-w-[150px]" title={cliente.direccion}><MapPin className="h-3 w-3 text-slate-400" /> {cliente.direccion}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                        {cliente.tipo.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className={`inline-flex flex-col items-end`}>
                        <span className={`font-black ${cliente.saldoCalculado > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          ${Math.abs(cliente.saldoCalculado).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                        {cliente.saldoCalculado > 0 && <span className="text-[10px] font-bold text-red-400">DEUDA ACTIVA</span>}
                        {cliente.saldoCalculado <= 0 && <span className="text-[10px] font-bold text-emerald-400">AL DÍA</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setClienteCuentaCorriente(cliente)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                          title="Ver Cuenta Corriente"
                        >
                          <Wallet className="h-4 w-4" /> Cta. Cte.
                        </button>
                        <button
                          onClick={() => setClienteEditando(cliente)}
                          className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
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
                      No se encontraron clientes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===================================================================
          MODAL: EDITAR / NUEVO CLIENTE
          =================================================================== */}
      {clienteEditando && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <User className="h-5 w-5 text-teal-600" />
                {clienteEditando.id ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <button onClick={() => setClienteEditando(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={guardarCliente} className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nombre / Razón Social</label>
                  <input
                    type="text"
                    required
                    value={clienteEditando.nombre}
                    onChange={e => setClienteEditando({...clienteEditando, nombre: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">DNI / CUIT</label>
                  <input
                    type="text"
                    required
                    value={clienteEditando.documento}
                    onChange={e => setClienteEditando({...clienteEditando, documento: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={clienteEditando.telefono}
                    onChange={e => setClienteEditando({...clienteEditando, telefono: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Código / Referencia</label>
                  <input
                    type="text"
                    value={clienteEditando.codigo}
                    onChange={e => setClienteEditando({...clienteEditando, codigo: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:bg-white outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={clienteEditando.direccion}
                    onChange={e => setClienteEditando({...clienteEditando, direccion: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Tipo de Cliente</label>
                  <select
                    value={clienteEditando.tipo}
                    onChange={e => setClienteEditando({...clienteEditando, tipo: e.target.value as any})}
                    className="w-full px-3 py-2 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-teal-500/20 outline-none"
                  >
                    <option value="CONSUMIDOR_FINAL">Consumidor Final</option>
                    <option value="COMERCIO_MINORISTA">Comercio Minorista</option>
                    <option value="DISTRIBUIDOR">Distribuidor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Límite de Crédito ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={clienteEditando.limiteCredito}
                    onChange={e => setClienteEditando({...clienteEditando, limiteCredito: Number(e.target.value)})}
                    className="w-full px-3 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:bg-white outline-none"
                  />
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setClienteEditando(null)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={controlador.cargando}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors active:scale-95 disabled:opacity-50 flex items-center gap-2"
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden">
            <div className="bg-slate-800 p-6 text-white shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black flex items-center gap-2">
                    <Wallet className="h-6 w-6 text-indigo-400" />
                    Cuenta Corriente
                  </h3>
                  <p className="text-slate-300 font-medium mt-1">{clienteCuentaCorriente.nombre}</p>
                </div>
                <button onClick={() => setClienteCuentaCorriente(null)} className="text-slate-400 hover:text-white">
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mt-6 flex items-end justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Saldo Actual (Deuda)</p>
                  <p className={`text-4xl font-black ${clienteCuentaCorriente.saldoCalculado > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    ${Math.abs(clienteCuentaCorriente.saldoCalculado).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {clienteCuentaCorriente.saldoCalculado > 0 && (
                  <button
                    onClick={() => setModalPagoAbierto(true)}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
                  >
                    <CreditCard className="h-5 w-5" />
                    Registrar Pago
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto p-0 bg-slate-50">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white sticky top-0 border-b border-slate-200 shadow-sm">
                  <tr>
                    <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase">Fecha</th>
                    <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase">Concepto</th>
                    <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase text-right">Cargo (Fiado)</th>
                    <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase text-right">Abono (Pago)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {controlador.obtenerHistorialCliente(clienteCuentaCorriente.id).map(mov => (
                    <tr key={mov.id} className="hover:bg-white transition-colors">
                      <td className="py-3 px-6 text-sm font-medium text-slate-600">
                        {new Date(mov.fechaHora).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3 px-6 text-sm font-bold text-slate-800 flex items-center gap-2">
                        {mov.tipo === 'COMPRA' ? <ArrowDownRight className="h-4 w-4 text-red-500" /> : <ArrowUpRight className="h-4 w-4 text-emerald-500" />}
                        {mov.descripcion}
                      </td>
                      <td className="py-3 px-6 text-sm font-black text-red-600 text-right">
                        {mov.tipo === 'COMPRA' ? `$${mov.monto.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-3 px-6 text-sm font-black text-emerald-600 text-right">
                        {mov.tipo === 'PAGO' ? `$${mov.monto.toFixed(2)}` : '-'}
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
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-50 p-6 border-b border-indigo-100">
              <h3 className="text-xl font-black text-indigo-900 flex items-center gap-2 mb-1">
                <CreditCard className="h-6 w-6 text-indigo-600" />
                Registrar Pago
              </h3>
              <p className="text-sm font-medium text-indigo-600/80">
                Abonar a cuenta de {clienteCuentaCorriente.nombre}
              </p>
            </div>

            <form onSubmit={procesarPago} className="p-6">
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Monto a Pagar ($)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={clienteCuentaCorriente.saldoCalculado > 0 ? clienteCuentaCorriente.saldoCalculado : undefined}
                  required
                  autoFocus
                  value={montoPago || ''}
                  onChange={e => setMontoPago(Number(e.target.value))}
                  className="w-full text-center text-4xl font-black text-slate-800 border-b-2 border-slate-200 focus:border-indigo-500 outline-none pb-2 bg-transparent transition-colors"
                  placeholder="0.00"
                />
                {clienteCuentaCorriente.saldoCalculado > 0 && (
                  <div className="mt-2 text-center">
                    <button 
                      type="button" 
                      onClick={() => setMontoPago(clienteCuentaCorriente.saldoCalculado)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-full transition-colors"
                    >
                      Saldar total: ${clienteCuentaCorriente.saldoCalculado.toFixed(2)}
                    </button>
                  </div>
                )}
              </div>

              <div className="mb-8">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Forma de Pago</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['EFECTIVO', 'DEBITO', 'TRANSFERENCIA_QR'] as const).map(metodo => (
                    <button
                      key={metodo}
                      type="button"
                      onClick={() => setMetodoPago(metodo)}
                      className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border ${
                        metodoPago === metodo 
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {metodo.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setModalPagoAbierto(false);
                    setMontoPago(0);
                  }}
                  className="px-5 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors w-full"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!montoPago || montoPago <= 0 || controlador.cargando}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 w-full"
                >
                  {controlador.cargando ? 'Procesando...' : 'Confirmar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
