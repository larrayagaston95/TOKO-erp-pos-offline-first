import React, { useState } from 'react';
import { useCajaController } from '../../controllers/useCajaController';
import {
  DollarSign, Clock, User, ArrowDownLeft, ArrowUpRight,
  Lock, CheckCircle2, XCircle, X, AlertTriangle, Banknote, Printer, Calendar, Receipt,
  ShoppingCart, Wallet, Calculator
} from 'lucide-react';
import { PDFViewer } from '@react-pdf/renderer';
import { ArqueoPdf, ResumenArqueo } from './ArqueoPdf';
import { ReporteCajasPdf } from '../reportes/ReporteCajasPdf';
import { TurnoCaja, Empleado } from '../../models';
import { CalculadoraBilletes } from '../../components/caja/CalculadoraBilletes';

interface CajaViewProps {
  usuarioAutenticado: Empleado;
}

/**
 * ============================================================================
 * VISTA: CONTROL DE APERTURA Y CIERRE DE CAJA (CajaView.tsx)
 * ============================================================================
 * Muestra el estado en tiempo real del turno activo con detalles de movimientos
 * y permite ejecutar el cierre parcial o final del día.
 */
export const CajaView: React.FC<CajaViewProps> = ({ usuarioAutenticado }) => {
  const { 
    turnoActivo, resumenTurnoActivo, todos_los_turnos, cerrarCaja,
    filtroFecha, setFiltroFecha,
    fechaDesde, setFechaDesde,
    fechaHasta, setFechaHasta,
    filtroTipoCierre, setFiltroTipoCierre,
    turnosCerradosFiltrados, kpisCajas
  } = useCajaController();

  const [pestanaActiva, setPestanaActiva] = useState<'TURNO_ACTUAL' | 'HISTORIAL'>('TURNO_ACTUAL');

  // Estados del modal de cierre
  const [modalCierre, setModalCierre] = useState<'PARCIAL' | 'FINAL' | null>(null);
  const [montoFisico, setMontoFisico] = useState<number>(0);
  const [notasCierre, setNotasCierre] = useState<string>('');
  const [procesando, setProcesando] = useState(false);
  const [toastExito, setToastExito] = useState<string | null>(null);
  const [mostrarCalculadora, setMostrarCalculadora] = useState(false);
  const [desgloseBilletes, setDesgloseBilletes] = useState<any>(null);

  // Estado para el visor de PDF del arqueo
  const [turnoParaArqueo, setTurnoParaArqueo] = useState<{ turno: TurnoCaja; resumen: ResumenArqueo; formato: 'ticket' | 'a4' } | null>(null);

  // Estado para el visor de PDF del reporte general
  const [formatoPdfGeneral, setFormatoPdfGeneral] = useState<'a4' | 'ticket' | null>(null);

  /** Formatea montos en pesos argentinos. */
  const formatearPeso = (monto: number) =>
    `$${monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

  /**
   * Ejecuta el cierre del turno.
   */
  const ejecutarCierre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalCierre) return;
    setProcesando(true);
    const exito = await cerrarCaja(montoFisico, notasCierre, modalCierre === 'FINAL', desgloseBilletes);
    setProcesando(false);
    if (exito) {
      setModalCierre(null);
      setMontoFisico(0);
      setNotasCierre('');
      setDesgloseBilletes(null);
      setToastExito(modalCierre === 'FINAL' ? '✅ Cierre final del día registrado.' : '✅ Turno cerrado correctamente.');
      setTimeout(() => setToastExito(null), 4000);
      setPestanaActiva('HISTORIAL');
    }
  };

  /**
   * Abre el visor PDF para imprimir el arqueo de un turno del historial individual.
   */
  const imprimirCierreIndividual = (turno: TurnoCaja) => {
    const esperado = turno.montoFinalEsperado || 0;
    const resumenDummy: ResumenArqueo = {
      ventasEfectivo: esperado - turno.montoInicial,
      ventasDebito: 0, ventasCredito: 0, ventasQr: 0, ventasCuentaCorriente: 0,
      retiros: 0, cobrosCC: 0, totalVentas: esperado - turno.montoInicial,
      cantidadTickets: 0
    };
    setTurnoParaArqueo({ turno, resumen: resumenDummy, formato: 'ticket' });
  };

  return (
    <div id="vista-caja-modulo" className="flex flex-col h-full w-full bg-slate-50">

      {/* ===================================================================
          BARRA DE PESTAÑAS (TABS)
          =================================================================== */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-3 flex gap-2 overflow-x-auto shrink-0 shadow-sm z-10">
        <button
          onClick={() => setPestanaActiva('TURNO_ACTUAL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
            pestanaActiva === 'TURNO_ACTUAL' 
              ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-transparent'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Turno Actual
        </button>
        {usuarioAutenticado.rol === 'ADMIN' && (
          <button
            onClick={() => setPestanaActiva('HISTORIAL')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              pestanaActiva === 'HISTORIAL' 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-transparent'
            }`}
          >
            <Banknote className="h-4 w-4" />
            Historial y Reportes
          </button>
        )}
      </div>

      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

      {/* Toast Notificación */}
      {toastExito && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl shadow-lg">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-bold text-emerald-800">{toastExito}</span>
          </div>
        </div>
      )}

      {/* ======= CONTENIDO DE LAS PESTAÑAS ======= */}
      
      {pestanaActiva === 'TURNO_ACTUAL' && (
        <div className="flex flex-col flex-1 min-h-0 p-4 overflow-y-auto space-y-6">
          {/* Cabecera Turno Actual */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <DollarSign className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black text-slate-900">Control de Caja</h2>
              </div>
              <p className="text-xs text-slate-500">
                Gestión de turnos, movimientos de efectivo y cierres de caja.
              </p>
            </div>
            {turnoActivo && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">Caja Abierta</span>
                </div>
              </div>
            )}
            {!turnoActivo && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-full">
                <Lock className="h-3.5 w-3.5 text-rose-500" />
                <span className="text-xs font-black text-rose-700 uppercase tracking-wider">Sin Turno Activo</span>
              </div>
            )}
          </div>

          {/* ======= TURNO ACTIVO ======= */}
          {turnoActivo ? (
            <>
              {/* Info del cajero y hora de apertura */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
                  <div className="bg-slate-100 p-3 rounded-xl"><User className="h-5 w-5 text-slate-600" /></div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cajero</p>
                    <p className="font-black text-slate-900">{turnoActivo.cajero}</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
                  <div className="bg-slate-100 p-3 rounded-xl"><Clock className="h-5 w-5 text-slate-600" /></div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Apertura</p>
                    <p className="font-black text-slate-900 text-sm">
                      {new Date(turnoActivo.fechaApertura).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
                  <div className="bg-blue-50 p-3 rounded-xl"><Banknote className="h-5 w-5 text-blue-600" /></div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Monto Inicial (Cambio)</p>
                    <p className="font-black text-slate-900 text-lg">{formatearPeso(turnoActivo.montoInicial)}</p>
                  </div>
                </div>
              </div>

              {/* Panel de Estado de Caja en Tiempo Real */}
              <div className="mt-6 border border-gray-100 rounded-xl bg-slate-50 p-5 sm:p-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                  📊 Estado de Caja en Tiempo Real
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Métrica 1: Efectivo */}
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ventas en Efectivo</span>
                    <p className="text-xl font-bold text-gray-700 mt-1">
                      ${(resumenTurnoActivo?.ventasEfectivo || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  {/* Métrica 2: Electrónico */}
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Medios Electrónicos</span>
                    <p className="text-xl font-bold text-gray-700 mt-1">
                      ${((resumenTurnoActivo?.ventasDebito || 0) + (resumenTurnoActivo?.ventasCredito || 0) + (resumenTurnoActivo?.ventasQr || 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  {/* Métrica 3: Total del Turno */}
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Operaciones</span>
                    <p className="text-xl font-bold text-gray-700 mt-1">
                      ${(resumenTurnoActivo?.totalVentas || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  {/* Métrica 4: Esperado (Destacado) */}
                  <div className="bg-teal-50 p-4 rounded-xl shadow-sm border border-teal-200">
                    <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Efectivo Esperado</span>
                    <p className="text-2xl font-black text-teal-700 mt-1">
                      ${(resumenTurnoActivo?.totalEsperado || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botones de Cierre */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setModalCierre('PARCIAL')}
                  className="flex items-center justify-center gap-3 bg-amber-50 border-2 border-amber-200 hover:bg-amber-100 text-amber-800 rounded-2xl p-5 font-black text-base transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-sm"
                >
                  <XCircle className="h-6 w-6 text-amber-600" />
                  Cerrar Turno (Cierre Parcial)
                </button>
                {usuarioAutenticado.rol === 'ADMIN' && (
                  <button
                    onClick={() => setModalCierre('FINAL')}
                    className="flex items-center justify-center gap-3 bg-rose-50 border-2 border-rose-200 hover:bg-rose-100 text-rose-800 rounded-2xl p-5 font-black text-base transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Lock className="h-6 w-6 text-rose-600" />
                    Cierre Final del Día
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <Lock className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-black text-slate-700 mb-2">No hay turno activo</h3>
              <p className="text-sm text-slate-500">
                Para habilitar el Punto de Venta, dirigite al POS y abrí la caja ingresando tu nombre y el monto inicial.
              </p>
            </div>
          )}
        </div>
      )}

      {pestanaActiva === 'HISTORIAL' && usuarioAutenticado.rol === 'ADMIN' && (
        <div className="flex flex-col flex-1 p-4 overflow-y-auto space-y-4">
          <div className="flex flex-col flex-1 gap-4">
            {/* CABECERA Y FILTROS (HISTORIAL) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Banknote className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-black text-slate-900">
                    Historial de Cajas (Resumen Gerencial)
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  Totales acumulados y detalle de turnos cerrados en el período.
                </p>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200/80 shadow-sm">
                <Calendar className="h-4 w-4 text-slate-400 ml-2" />
                <select
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value as any)}
                  className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none pr-4 cursor-pointer"
                >
                  <option value="HOY">Hoy</option>
                  <option value="ULTIMOS_7_DIAS">Últimos 7 Días</option>
                  <option value="ESTE_MES">Este Mes</option>
                  <option value="RANGO_PERSONALIZADO">Rango Personalizado...</option>
                </select>
              </div>
            </div>

            {filtroFecha === 'RANGO_PERSONALIZADO' && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-wrap gap-4 items-end shrink-0">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Desde</label>
                  <input 
                    type="date" 
                    value={fechaDesde} 
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Hasta</label>
                  <input 
                    type="date" 
                    value={fechaHasta} 
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200/80 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-2">Tipo de Cierre:</span>
                <select
                  value={filtroTipoCierre}
                  onChange={(e) => setFiltroTipoCierre(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="TODOS">Todos los Cierres</option>
                  <option value="PARCIALES">Solo Parciales (X)</option>
                  <option value="FINALES">Solo Finales (Z)</option>
                </select>
              </div>
              <button
                onClick={() => setFormatoPdfGeneral('a4')}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-colors"
              >
                <Printer className="h-4 w-4" />
                Imprimir Reporte General
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 shrink-0">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 text-blue-500">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Ventas</p>
                </div>
                <p className="text-xl font-black text-slate-900 mt-1">
                  {formatearPeso(kpisCajas.totalVentas)}
                </p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="bg-amber-50 p-2 rounded-lg border border-amber-100 text-amber-500">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Inicial Acumulado</p>
                </div>
                <p className="text-xl font-black text-slate-900 mt-1">
                  {formatearPeso(kpisCajas.totalInicial)}
                </p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-slate-500">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Esperado</p>
                </div>
                <p className="text-xl font-black text-slate-900 mt-1">
                  {formatearPeso(kpisCajas.totalEsperado)}
                </p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100 text-indigo-500">
                    <Banknote className="h-5 w-5" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Físico Rendido</p>
                </div>
                <p className="text-xl font-black text-indigo-600 mt-1">
                  {formatearPeso(kpisCajas.totalFisico)}
                </p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg border ${kpisCajas.diferenciaTotal < 0 ? 'bg-rose-50 border-rose-100 text-rose-500' : kpisCajas.diferenciaTotal > 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                    {kpisCajas.diferenciaTotal < 0 ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Diferencia Neta</p>
                </div>
                <p className={`text-xl font-black mt-1 ${kpisCajas.diferenciaTotal < 0 ? 'text-rose-600' : kpisCajas.diferenciaTotal > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {kpisCajas.diferenciaTotal > 0 ? '+' : ''}{formatearPeso(kpisCajas.diferenciaTotal)}
                </p>
              </div>
            </div>

            {/* TABLA DE CIERRES INDIVIDUALES CON SCROLL */}
            <div 
              className="flex-1 min-h-[400px] overflow-auto bg-white rounded-2xl border border-slate-200/80 shadow-lg shadow-indigo-900/5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400"
            >
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase font-semibold text-xs sticky top-0 shadow-sm z-10">
                  <tr>
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Cajero</th>
                    <th className="py-3 px-4 text-center">Tipo</th>
                    <th className="py-3 px-4 text-right">Esperado</th>
                    <th className="py-3 px-4 text-right">Físico</th>
                    <th className="py-3 px-4 text-right">Diferencia</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(turnosCerradosFiltrados || []).length > 0 ? (
                    (turnosCerradosFiltrados || []).map((turno) => {
                      const esperado = turno.montoFinalEsperado || 0;
                      const fisico = turno.montoFinalReal || 0;
                      const diferencia = fisico - esperado;

                      return (
                        <tr key={turno.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">{new Date(turno.fechaCierre || turno.fechaApertura).toLocaleString('es-AR')}</td>
                          <td className="py-3 px-4">{turno.cajero || (turno as any).usuario || 'Cajero Central'}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold tracking-wider ${turno.tipoCierre === 'FINAL' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                              {turno.tipoCierre === 'FINAL' ? 'FINAL' : 'PARCIAL'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">${esperado.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-medium">${fisico.toFixed(2)}</td>
                          <td className={`py-3 px-4 text-right font-bold ${diferencia < 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {diferencia > 0 ? '+' : ''}${diferencia.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => imprimirCierreIndividual(turno)}
                              className="text-gray-400 hover:text-blue-600 transition-colors inline-flex p-1 cursor-pointer"
                              title="Imprimir Comprobante"
                            >
                              <Printer size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        No hay cierres registrados en el período seleccionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* ===== MODAL DE CIERRE ===== */}
      {modalCierre && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200/80 overflow-hidden">
            <div className={`p-5 border-b flex items-center justify-between ${modalCierre === 'FINAL' ? 'bg-gradient-to-r from-rose-50 to-red-50 border-rose-100' : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-100'}`}>
              <div>
                <h3 className={`text-sm font-black flex items-center gap-2 ${modalCierre === 'FINAL' ? 'text-rose-900' : 'text-amber-900'}`}>
                  {modalCierre === 'FINAL' ? <Lock className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {modalCierre === 'FINAL' ? 'Cierre Final del Día' : 'Cierre Parcial de Turno'}
                </h3>
                <p className={`text-xs mt-0.5 ${modalCierre === 'FINAL' ? 'text-rose-700' : 'text-amber-700'}`}>
                  Total esperado en caja: <strong>{formatearPeso(resumenTurnoActivo.totalEsperado)}</strong>
                </p>
              </div>
              <button onClick={() => setModalCierre(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={ejecutarCierre} className="p-6 space-y-5">
              {modalCierre === 'FINAL' && (
                <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                  <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-700 font-medium">Esta acción cierra definitivamente el día. El Punto de Venta quedará bloqueado hasta la próxima apertura.</p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Efectivo Físico Contado ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  autoFocus
                  value={montoFisico || ''}
                  onChange={e => setMontoFisico(Number(e.target.value))}
                  className="w-full text-center text-4xl font-mono font-black text-slate-800 border-b-2 border-slate-200 focus:border-indigo-500 outline-none pb-2 bg-transparent transition-colors"
                  placeholder="0.00"
                />
                <div className="flex justify-center mt-2 mb-1">
                  <button
                    type="button"
                    onClick={() => setMostrarCalculadora(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-slate-200 shadow-sm"
                  >
                    <Calculator className="h-4 w-4" />
                    Abrir Calculadora de Billetes
                  </button>
                </div>
                {montoFisico > 0 && (
                  <p className={`text-center text-xs font-bold mt-1 ${(montoFisico - resumenTurnoActivo.totalEsperado) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    Diferencia: {(montoFisico - resumenTurnoActivo.totalEsperado) >= 0 ? '+' : ''}
                    {formatearPeso(montoFisico - resumenTurnoActivo.totalEsperado)}
                    {(montoFisico - resumenTurnoActivo.totalEsperado) >= 0 ? ' (Sobrante)' : ' (Faltante)'}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Notas / Observaciones (opcional)</label>
                <textarea
                  rows={2}
                  value={notasCierre}
                  onChange={e => setNotasCierre(e.target.value)}
                  placeholder="Ej: Se retiró dinero para gastos de limpieza, diferencia por pago con billetes falsos..."
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all w-full resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalCierre(null)}
                  className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando || !montoFisico}
                  className={`flex-1 px-4 py-2.5 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${modalCierre === 'FINAL' ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 shadow-rose-500/20' : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-amber-500/20'}`}
                >
                  <Lock className="h-4 w-4" />
                  {procesando ? 'Cerrando...' : modalCierre === 'FINAL' ? 'Confirmar Cierre Final' : 'Cerrar Turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== VISOR PDF: ARQUEO ===== */}
      {turnoParaArqueo && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col p-4">
          <div className="flex justify-between items-center bg-white rounded-t-2xl p-4">
            <div className="flex items-center gap-3">
              <Printer className="h-5 w-5 text-teal-600" />
              <h3 className="font-bold text-slate-800">
                {turnoParaArqueo.turno.tipoCierre === 'FINAL' ? 'Arqueo Z — Cierre Final' : 'Arqueo X — Cierre Parcial'}
              </h3>
              {/* Selector de formato */}
              <div className="flex bg-slate-100 rounded-lg p-1 ml-2 border border-slate-200">
                <button
                  onClick={() => setTurnoParaArqueo(p => p ? { ...p, formato: 'a4' } : null)}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition-colors ${turnoParaArqueo.formato === 'a4' ? 'bg-white shadow text-teal-700' : 'text-slate-500'}`}
                >A4</button>
                <button
                  onClick={() => setTurnoParaArqueo(p => p ? { ...p, formato: 'ticket' } : null)}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition-colors ${turnoParaArqueo.formato === 'ticket' ? 'bg-white shadow text-teal-700' : 'text-slate-500'}`}
                >Ticket 80mm</button>
              </div>
            </div>
            <button
              onClick={() => setTurnoParaArqueo(null)}
              className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 bg-slate-100 rounded-b-2xl overflow-hidden border-x border-b border-white">
            <PDFViewer width="100%" height="100%" className="border-none">
              <ArqueoPdf
                turno={turnoParaArqueo.turno}
                resumen={turnoParaArqueo.resumen}
                formato={turnoParaArqueo.formato}
              />
            </PDFViewer>
          </div>
        </div>
      )}
      
      {/* ===================================================================
          VISOR DE PDF (REPORTE GENERAL DE CAJAS)
          =================================================================== */}
      {formatoPdfGeneral && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex flex-col p-4 animate-in fade-in">
          <div className="bg-slate-800 text-white p-3 rounded-t-2xl flex justify-between items-center max-w-5xl w-full mx-auto shadow-2xl border-x border-t border-slate-700">
            <div className="flex items-center gap-3 pl-2">
              <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
                <Printer className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="font-bold text-sm">Reporte General de Cajas</h3>
                  <p className="text-[10px] text-slate-400">
                    Balance Consolidado
                  </p>
                </div>
                {/* Selector de formato */}
                <div className="flex bg-slate-700/50 rounded-lg p-1 ml-4 border border-slate-600">
                  <button
                    onClick={() => setFormatoPdfGeneral('a4')}
                    className={`px-3 py-1 text-[11px] font-bold rounded-md transition-colors ${formatoPdfGeneral === 'a4' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
                  >A4</button>
                  <button
                    onClick={() => setFormatoPdfGeneral('ticket')}
                    className={`px-3 py-1 text-[11px] font-bold rounded-md transition-colors ${formatoPdfGeneral === 'ticket' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
                  >Ticket 80mm</button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFormatoPdfGeneral(null)}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                title="Cerrar visor"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 max-w-5xl w-full mx-auto bg-slate-100 rounded-b-2xl overflow-hidden shadow-2xl border-x border-b border-white">
            <PDFViewer width="100%" height="100%" className="border-none">
              <ReporteCajasPdf 
                turnos={turnosCerradosFiltrados} 
                kpisCajas={kpisCajas}
                filtroFechaStr={filtroFecha === 'RANGO_PERSONALIZADO' ? `${fechaDesde || 'Inicio'} al ${fechaHasta || 'Fin'}` : filtroFecha}
                filtroTipoCierreStr={filtroTipoCierre}
                formato={formatoPdfGeneral}
              />
            </PDFViewer>
          </div>
        </div>
      )}

      {/* ===== MODAL CALCULADORA DE BILLETES ===== */}
      {mostrarCalculadora && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <CalculadoraBilletes 
            onTotalCalculado={(total, desglose) => {
              setMontoFisico(total);
              setDesgloseBilletes(desglose);
              setMostrarCalculadora(false);
            }} 
            onClose={() => setMostrarCalculadora(false)} 
          />
        </div>
      )}
    </div>
  );
};
