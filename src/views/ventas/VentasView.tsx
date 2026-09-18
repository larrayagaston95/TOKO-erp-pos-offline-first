/**
 * ============================================================================
 * VISTA: VENTAS Y CIERRE DE CAJA (VentasView.tsx)
 * ============================================================================
 * Panel de resumen financiero diario del Punto de Venta.
 * Muestra totales agrupados por medios de pago y el historial de tickets.
 */

import React, { useState } from 'react';
import { useVentasController } from '../../controllers/useVentasController';
import {
  Wallet,
  Banknote,
  CreditCard,
  QrCode,
  FileText,
  Receipt,
  Clock,
  CheckCircle2,
  AlertCircle,
  Printer,
  ArrowDownCircle,
  X
} from 'lucide-react';
import { MetodoPago, VentaRealizada } from '../../models';
import { TicketImpresion } from '../pos/TicketImpresion';
import { FacturaLegalPdf } from '../pos/FacturaLegalPdf';
import { TicketComunPdf } from '../pos/TicketComunPdf';
import { PDFViewer } from '@react-pdf/renderer';

// Mapeo visual para los métodos de pago
const METODO_PAGO_VISUAL: Record<MetodoPago, { label: string, color: string, icon: React.FC<any> }> = {
  EFECTIVO: { label: 'Efectivo', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: Banknote },
  DEBITO: { label: 'Débito', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: CreditCard },
  CREDITO: { label: 'Crédito', color: 'text-purple-600 bg-purple-50 border-purple-200', icon: CreditCard },
  TRANSFERENCIA_QR: { label: 'QR / Transf.', color: 'text-indigo-600 bg-indigo-50 border-indigo-200', icon: QrCode },
  CUENTA_CORRIENTE: { label: 'Cta. Corriente', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: FileText }
};

export const VentasView: React.FC = () => {
  const { historialVentas, totales, registrarRetiroEfectivo } = useVentasController();
  const [ticketParaImprimir, setTicketParaImprimir] = useState<VentaRealizada | null>(null);
  const [modalRetiro, setModalRetiro] = useState(false);
  const [montoRetiro, setMontoRetiro] = useState<number | ''>('');
  const [conceptoRetiro, setConceptoRetiro] = useState('Retiro parcial de efectivo');

  const [modalAfip, setModalAfip] = useState(false);
  const [ventaParaAfip, setVentaParaAfip] = useState<VentaRealizada | null>(null);
  const [cuitAfip, setCuitAfip] = useState('');
  
  const [modalOpcionesImpresion, setModalOpcionesImpresion] = useState(false);
  const [imprimirComoFactura, setImprimirComoFactura] = useState(false);
  const [mostrarVisorPdf, setMostrarVisorPdf] = useState(false);
  const [modoMediaHoja, setModoMediaHoja] = useState(true);

  const procesarRetiro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (montoRetiro && montoRetiro > 0) {
      await registrarRetiroEfectivo(Number(montoRetiro), conceptoRetiro);
      setModalRetiro(false);
      setMontoRetiro('');
    }
  };

  const procesarFacturaAfip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ventaParaAfip && cuitAfip) {
      await convertirAFactura(ventaParaAfip.id, cuitAfip);
      setModalAfip(false);
      setVentaParaAfip(null);
      setCuitAfip('');
    }
  };

  return (
    <div id="vista-ventas-modulo" className="flex-1 p-6 bg-slate-50/70 overflow-y-auto space-y-6 print:hidden">
      
      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Wallet className="h-6 w-6 text-teal-600" />
            Ventas y Cierre de Caja
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Resumen de la recaudación local y registro de tickets emitidos.
          </p>
        </div>
        
        <button
          onClick={() => setModalRetiro(true)}
          className="flex items-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm"
        >
          <ArrowDownCircle className="h-4 w-4" />
          Retirar Efectivo
        </button>
      </div>

      {/* ── Tarjetas de Resumen (Cards) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Recaudado */}
        <div className="lg:col-span-2 bg-gradient-to-br from-teal-600 to-emerald-700 rounded-2xl p-5 shadow-lg shadow-teal-900/10 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <p className="text-teal-50 text-xs font-bold uppercase tracking-widest mb-1 opacity-80">Total Recaudado</p>
          <p className="text-4xl font-black font-mono drop-shadow-md">
            ${totales.totalRecaudado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-teal-100 text-xs mt-3 font-medium">
            En {totales.cantidadTickets} ticket{totales.cantidadTickets !== 1 ? 's' : ''} cobrados
          </p>
        </div>

        {/* Efectivo */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-md shadow-slate-200/50">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <Banknote className="h-4 w-4 text-emerald-500" />
            Efectivo
          </div>
          <p className="text-2xl font-black text-slate-800 font-mono">
            ${totales.desglosePorMetodo['EFECTIVO'].toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Débito / Otros Electrónicos */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-md shadow-slate-200/50">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <CreditCard className="h-4 w-4 text-blue-500" />
            Débito
          </div>
          <p className="text-2xl font-black text-slate-800 font-mono">
            ${totales.desglosePorMetodo['DEBITO'].toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* ── Tabla de Historial de Tickets ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg shadow-teal-900/5 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <Receipt className="h-4 w-4 text-slate-400" />
          <h3 className="font-bold text-sm text-slate-700">Historial de Tickets Emitidos</h3>
        </div>
        
        {historialVentas.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-3">
              <Receipt className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-500">No hay ventas registradas hoy</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Comprobante</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Método de Pago</th>
                  <th className="py-3 px-4">Sincronización</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {historialVentas.map((venta) => {
                  const visualPago = METODO_PAGO_VISUAL[venta.metodoPago];
                  const IconoPago = visualPago.icon;
                  const esSync = venta.estadoSync === 'SINCRONIZADO';

                  return (
                    <tr key={venta.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {new Date(venta.fechaHora).toLocaleString('es-AR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {venta.numeroTicket}
                      </td>
                      <td className="py-3 px-4">
                        {venta.cliente.nombre}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${visualPago.color}`}>
                          <IconoPago className="h-3 w-3" />
                          {visualPago.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className={`flex items-center gap-1 font-bold ${esSync ? 'text-emerald-600' : 'text-amber-500'}`}>
                          {esSync ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                          <span className="text-[10px] uppercase tracking-wider">{esSync ? 'Sincronizado' : 'Pendiente'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                        ${venta.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          {venta.tipoComprobante === 'TICKET_X' && (
                            <button
                              onClick={() => {
                                setVentaParaAfip(venta);
                                setCuitAfip('');
                                setModalAfip(true);
                              }}
                              className="px-2 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-md text-[10px] font-bold transition-colors"
                            >
                              Facturar AFIP
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setTicketParaImprimir(venta);
                              setModalOpcionesImpresion(true);
                            }}
                            title="Opciones de Impresión"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* ===================================================================
          MODAL RETIRO DE EFECTIVO
          =================================================================== */}
      {modalRetiro && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-amber-50">
              <h3 className="font-bold text-amber-900 flex items-center gap-2">
                <ArrowDownCircle className="h-5 w-5 text-amber-600" />
                Retiro de Efectivo
              </h3>
              <button onClick={() => setModalRetiro(false)} className="text-amber-700/50 hover:text-amber-900">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={procesarRetiro} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Monto a Retirar ($)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={montoRetiro}
                  onChange={(e) => setMontoRetiro(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                  placeholder="Ej: 5000"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Concepto / Motivo</label>
                <input
                  type="text"
                  required
                  value={conceptoRetiro}
                  onChange={(e) => setConceptoRetiro(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalRetiro(false)}
                  className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-500 text-white rounded-lg font-bold text-sm hover:bg-amber-600 shadow-md shadow-amber-500/20"
                >
                  Confirmar Retiro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL CONVERTIR A FACTURA AFIP
          =================================================================== */}
      {modalAfip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-teal-50">
              <h3 className="font-bold text-teal-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" />
                Generar Factura AFIP
              </h3>
              <button onClick={() => setModalAfip(false)} className="text-teal-700/50 hover:text-teal-900">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={procesarFacturaAfip} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">CUIT o DNI del Cliente</label>
                <input
                  type="text"
                  required
                  value={cuitAfip}
                  onChange={(e) => setCuitAfip(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-hidden"
                  placeholder="Ej: 20123456789 (Sin guiones)"
                />
                <p className="text-[10px] text-slate-400 mt-1">Ingrese 00000000 para Consumidor Final anónimo (montos menores).</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAfip(false)}
                  className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-teal-600 text-white rounded-lg font-bold text-sm hover:bg-teal-700 shadow-md shadow-teal-500/20"
                >
                  Generar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL OPCIONES DE IMPRESIÓN
          =================================================================== */}
      {modalOpcionesImpresion && ticketParaImprimir && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl animate-in zoom-in-95 flex flex-col gap-4 text-center">
            <h3 className="font-bold text-slate-800">Seleccionar Formato</h3>
            <p className="text-sm text-slate-500 mb-2">Ticket N° {ticketParaImprimir.numeroTicket}</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setImprimirComoFactura(false);
                  setModalOpcionesImpresion(false);
                  setMostrarVisorPdf(true);
                }}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Printer className="h-4 w-4" /> IMPRIMIR TICKET COMÚN
              </button>
              <button
                onClick={() => {
                  setImprimirComoFactura(true);
                  setModalOpcionesImpresion(false);
                  setMostrarVisorPdf(true);
                }}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <FileText className="h-4 w-4 text-teal-600" /> IMPRIMIR FACTURA LEGAL
              </button>
            </div>
            <button onClick={() => setModalOpcionesImpresion(false)} className="text-xs font-bold text-slate-400 mt-2 hover:text-slate-600">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* COMPONENTE DE IMPRESIÓN (Invisible salvo al imprimir) */}
      {/* Se elimina la impresión térmica HTML legacy */}

      {/* ===================================================================
          MODAL VISOR DE PDF
          =================================================================== */}
      {mostrarVisorPdf && ticketParaImprimir && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col p-4 animate-in fade-in">
          <div className="flex justify-between items-center bg-white rounded-t-2xl p-4">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                {imprimirComoFactura ? <FileText className="h-5 w-5 text-teal-600" /> : <Printer className="h-5 w-5 text-slate-600" />}
                {imprimirComoFactura ? 'Vista Previa de Factura A4' : 'Vista Previa de Ticket 80mm'}
              </h3>

              {/* Controles extra sólo para Factura */}
              {imprimirComoFactura && (
                <div className="flex bg-slate-100 rounded-lg p-1 ml-4 border border-slate-200">
                  <button 
                    onClick={() => setModoMediaHoja(true)}
                    className={`px-3 py-1 text-[11px] font-bold rounded-md transition-colors ${modoMediaHoja ? 'bg-white shadow-xs text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    1 Hoja (Ecológico)
                  </button>
                  <button 
                    onClick={() => setModoMediaHoja(false)}
                    className={`px-3 py-1 text-[11px] font-bold rounded-md transition-colors ${!modoMediaHoja ? 'bg-white shadow-xs text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    2 Hojas Separadas
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={() => {
                setMostrarVisorPdf(false);
                setTicketParaImprimir(null);
              }}
              className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 bg-slate-100 rounded-b-2xl overflow-hidden border-x border-b border-white">
            <PDFViewer width="100%" height="100%" className="border-none">
              {imprimirComoFactura ? (
                <FacturaLegalPdf venta={{...ticketParaImprimir, tipoComprobante: 'FACTURA_AFIP'}} modoMediaHoja={modoMediaHoja} />
              ) : (
                <TicketComunPdf venta={ticketParaImprimir} />
              )}
            </PDFViewer>
          </div>
        </div>
      )}
    </div>
  );
};
