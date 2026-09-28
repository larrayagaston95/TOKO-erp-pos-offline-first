import React, { useState } from 'react';
import { ArrowLeft, Wallet, CreditCard, ArrowDownRight, ArrowUpRight, CheckCircle2, X } from 'lucide-react';
import { ClienteConSaldo, useClientesController } from '../../controllers/useClientesController';

interface Props {
  cliente: ClienteConSaldo;
  controlador: ReturnType<typeof useClientesController>;
  alVolver: () => void;
}

export const DetalleCuentaCorriente: React.FC<Props> = ({ cliente, controlador, alVolver }) => {
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  const [montoPago, setMontoPago] = useState<number>(0);
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'DEBITO' | 'TRANSFERENCIA_QR'>('EFECTIVO');

  const historial = controlador.cargarHistorialCliente(cliente.id);
  const esDeudor = cliente.saldoCalculado > 0;

  const procesarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (montoPago > 0) {
      const exito = await controlador.registrarPago(cliente.id, montoPago, metodoPago, 'Pago a cuenta');
      if (exito) {
        setModalPagoAbierto(false);
        setMontoPago(0);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/80 shadow-lg overflow-hidden animate-in fade-in">
      {/* HEADER */}
      <div className="bg-slate-900 p-6 text-white shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Wallet className="w-48 h-48 text-white" />
        </div>
        <div className="relative z-10 flex items-center justify-between mb-6">
          <button 
            onClick={alVolver} 
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm font-bold bg-white/10 px-4 py-2 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al Directorio
          </button>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h3 className="text-2xl font-black flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Wallet className="h-6 w-6" />
              </div>
              Estado de Cuenta
            </h3>
            <p className="text-slate-300 font-medium mt-2">{cliente.nombre} • {cliente.documento}</p>
          </div>
          
          <div className="flex flex-col items-start md:items-end gap-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 md:text-right">Saldo Actual</p>
              <p className={`text-4xl sm:text-5xl font-mono font-black ${esDeudor ? 'text-rose-400' : 'text-emerald-400'}`}>
                ${cliente.saldoCalculado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
              {esDeudor && (
                <p className="text-rose-400/80 text-xs font-bold mt-1 uppercase text-right tracking-wider">Saldo Deudor</p>
              )}
            </div>
            {esDeudor && (
              <button
                onClick={() => setModalPagoAbierto(true)}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer w-full md:w-auto justify-center"
              >
                <CreditCard className="h-4 w-4" /> Registrar Pago
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TIMELINE / HISTORIAL */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
          Historial de Movimientos
        </h4>
        
        <div className="space-y-6">
          {historial.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium bg-white rounded-2xl border border-slate-200 border-dashed">
              No hay movimientos registrados para este cliente.
            </div>
          ) : (
            historial.map((mov) => (
              <div key={mov.id} className="relative flex gap-4">
                <div className="absolute left-6 top-10 bottom-[-24px] w-0.5 bg-slate-200 last:hidden"></div>
                <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border-2 z-10 ${
                  mov.tipo === 'COMPRA' 
                    ? 'bg-rose-50 border-rose-100 text-rose-500' 
                    : 'bg-emerald-50 border-emerald-100 text-emerald-500'
                }`}>
                  {mov.tipo === 'COMPRA' ? <ArrowDownRight className="h-6 w-6" /> : <ArrowUpRight className="h-6 w-6" />}
                </div>
                
                <div className="flex-1 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm shadow-slate-200/50">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 mb-2">
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        mov.tipo === 'COMPRA' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {mov.tipo === 'COMPRA' ? 'Cargo (Venta)' : 'Abono (Pago)'}
                      </span>
                      <p className="text-slate-800 font-bold mt-2">{mov.descripcion}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(mov.fechaHora).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })}
                        {mov.metodoPago && ` • ${mov.metodoPago}`}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className={`text-xl font-mono font-black ${
                        mov.tipo === 'COMPRA' ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {mov.tipo === 'COMPRA' ? '-' : '+'}${mov.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Detalles de Items de Venta */}
                  {mov.tipo === 'COMPRA' && mov.items && mov.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/50 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Detalle de Artículos:</p>
                      <ul className="space-y-1">
                        {mov.items.map((item, idx) => (
                          <li key={idx} className="flex justify-between text-xs text-slate-500 font-medium">
                            <span>{item.cantidad}x {item.producto.nombre}</span>
                            <span className="font-mono text-slate-400">${item.subtotal.toLocaleString('es-AR')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL REGISTRAR PAGO */}
      {modalPagoAbierto && (
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
                  Abonar a cuenta de {cliente.nombre}
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
                  max={cliente.saldoCalculado > 0 ? cliente.saldoCalculado : undefined}
                  required
                  autoFocus
                  value={montoPago || ''}
                  onChange={e => setMontoPago(Number(e.target.value))}
                  className="w-full text-center text-4xl font-mono font-black text-slate-800 border-b-2 border-slate-200 focus:border-indigo-500 outline-none pb-2 bg-transparent transition-colors"
                  placeholder="0.00"
                />
                {cliente.saldoCalculado > 0 && (
                  <div className="mt-3 text-center">
                    <button 
                      type="button" 
                      onClick={() => setMontoPago(cliente.saldoCalculado)}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors border border-indigo-200 cursor-pointer"
                    >
                      Saldar total adeudado: ${cliente.saldoCalculado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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
