/**
 * ============================================================================
 * VISTA: CONFIGURACIÓN Y SINCRONIZACIÓN - DISEÑO MODERN SAAS (ConfiguracionView.tsx)
 * ============================================================================
 * TOKO ERP - Panel de ajustes y administración de la base de datos local IndexedDB (Dexie.js):
 * - Descarga inicial (Bootstrap de catálogo y clientes desde Spring Boot).
 * - Monitor en vivo de las tablas: productos, clientes, ventas y sync_outbox.
 * - Inspección y sincronización manual de la cola de transacciones offline.
 */

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Settings, 
  Database, 
  RefreshCw, 
  Printer, 
  HardDrive, 
  CheckCircle2,
  CloudDownload,
  AlertTriangle,
  Clock,
  Send,
  Trash2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Users
} from 'lucide-react';
import { db, poblarBaseDeDatosInicial, SyncOutboxItem } from '../../db';

interface ConfiguracionViewProps {
  estaOnline: boolean;
  operacionesPendientes: number;
  alReiniciarColaSync: () => void;
}

export const ConfiguracionView: React.FC<ConfiguracionViewProps> = ({
  estaOnline,
  operacionesPendientes,
  alReiniciarColaSync
}) => {
  const [sincronizandoManual, setSincronizandoManual] = useState<boolean>(false);
  const [descargandoBootstrap, setDescargandoBootstrap] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Estados para Políticas de Cuenta Corriente
  const [modoMora, setModoMora] = useState<'INTERES_DIARIO' | 'REPOSICION'>(
    (localStorage.getItem('toko_modo_mora') as 'INTERES_DIARIO' | 'REPOSICION') || 'INTERES_DIARIO'
  );
  const [tasaMensual, setTasaMensual] = useState<number>(
    Number(localStorage.getItem('toko_tasa_mensual')) || 10
  );

  const guardarAjustesCuentaCorriente = () => {
    localStorage.setItem('toko_modo_mora', modoMora);
    localStorage.setItem('toko_tasa_mensual', tasaMensual.toString());
    setMensajeExito('✓ Políticas de Cuenta Corriente actualizadas correctamente.');
    setTimeout(() => setMensajeExito(null), 3000);
  };

  // Consultas en tiempo real a las tablas de Dexie
  const totalProductos = useLiveQuery(() => db.productos.count(), []) ?? 0;
  const totalClientes = useLiveQuery(() => db.clientes.count(), []) ?? 0;
  const totalVentas = useLiveQuery(() => db.ventas.count(), []) ?? 0;
  const itemsOutbox = useLiveQuery(
    () => db.sync_outbox.orderBy('fechaCreacion').reverse().limit(15).toArray(),
    []
  ) ?? [];

  /**
   * Ejecuta la descarga inicial (Bootstrap) poblando Dexie desde los mocks / Spring Boot
   */
  const ejecutarDescargaInicial = async () => {
    setDescargandoBootstrap(true);
    try {
      // Simulamos latencia de red de descarga de catálogo desde Spring Boot
      await new Promise(resolve => setTimeout(resolve, 800));
      const res = await poblarBaseDeDatosInicial(true);
      
      setMensajeExito(
        `✓ Descarga Inicial completada: ${res.productos} productos y ${res.clientes} clientes cargados en IndexedDB.`
      );
      setTimeout(() => setMensajeExito(null), 4000);
    } catch (error) {
      console.error('Error en descarga inicial:', error);
    } finally {
      setDescargandoBootstrap(false);
    }
  };

  /**
   * Sincroniza manualmente la cola offline con el backend
   */
  const forzarSincronizacionCola = async () => {
    setSincronizandoManual(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 900));
      await alReiniciarColaSync();
      setMensajeExito('✓ Cola de sincronización procesada: todos los comprobantes offline fueron enviados a la nube.');
      setTimeout(() => setMensajeExito(null), 3500);
    } finally {
      setSincronizandoManual(false);
    }
  };

  /**
   * Limpia el historial de ventas y la cola outbox para pruebas
   */
  const limpiarHistorialVentas = async () => {
    if (window.confirm('¿Desea vaciar el historial de ventas y la cola de sincronización local? El catálogo se mantendrá intacto.')) {
      await db.ventas.clear();
      await db.sync_outbox.clear();
      setMensajeExito('✓ Tablas de ventas y cola outbox reiniciadas en blanco.');
      setTimeout(() => setMensajeExito(null), 3000);
    }
  };

  return (
    <div id="vista-configuracion-modulo" className="flex-1 p-6 bg-slate-50/70 overflow-y-auto space-y-6">
      {/* Cabecera del Módulo */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-lg shadow-teal-900/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
              <Settings className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900">Persistencia Local & Sincronización</h2>
          </div>
          <p className="text-xs text-slate-500">
            Motor de base de datos local IndexedDB (Dexie.js) con patrón Outbox para alta disponibilidad offline.
          </p>
        </div>

        {/* Estado actual de red */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold self-start md:self-auto bg-slate-50 border-slate-200 shadow-2xs">
          <span className={`h-2.5 w-2.5 rounded-full ${estaOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 animate-ping'}`} />
          <span className="text-slate-700">
            {estaOnline ? 'Conectado a Spring Boot (Online)' : 'Modo Autónomo Local (Offline)'}
          </span>
        </div>
      </div>

      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Tarjeta Destacada: Descarga Inicial (Bootstrap) */}
      <div className="bg-white rounded-2xl border border-teal-200/80 p-5 shadow-lg shadow-teal-900/5 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-[11px] font-bold border border-teal-100">
              <CloudDownload className="h-3.5 w-3.5" />
              <span>Carga Inicial • Bootstrap Catálogo</span>
            </div>
            <h3 className="text-base font-black text-slate-900">
              Descarga Inicial del Catálogo y Clientes
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Descarga y almacena en el navegador los productos con sus precios diferenciados y la cartera de clientes con sus límites crediticios (simulando la llamada REST inicial desde el backend Spring Boot hacia IndexedDB).
            </p>
          </div>

          <button
            type="button"
            id="btn-descarga-inicial"
            onClick={ejecutarDescargaInicial}
            disabled={descargandoBootstrap}
            className="w-full lg:w-auto px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2.5 shadow-md shadow-teal-600/20 transition-all cursor-pointer shrink-0 hover:-translate-y-0.5 active:scale-95"
          >
            <RefreshCw className={`h-4 w-4 ${descargandoBootstrap ? 'animate-spin' : ''}`} />
            <span>{descargandoBootstrap ? 'Descargando desde Backend...' : 'Descarga Inicial (Spring Boot → IndexedDB)'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tarjeta 1: Monitor de Tablas en IndexedDB */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-lg shadow-teal-900/5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
                <Database className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Estado de Tablas Locales (Dexie.js)</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">DB: OmniPosDB (v1)</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 block text-[11px] font-medium">Tabla: productos</span>
              <span className="text-base font-black font-mono text-slate-900">{totalProductos}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Artículos en caché</span>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 block text-[11px] font-medium">Tabla: clientes</span>
              <span className="text-base font-black font-mono text-slate-900">{totalClientes}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Cartera con Cta. Cte.</span>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 block text-[11px] font-medium">Tabla: ventas</span>
              <span className="text-base font-black font-mono text-teal-700">{totalVentas}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Tickets y pedidos</span>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 block text-[11px] font-medium">Tabla: sync_outbox</span>
              <span className={`text-base font-black font-mono ${operacionesPendientes > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {operacionesPendientes}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Pendientes de subir</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">Manejo de almacenamiento:</span>
            <button
              type="button"
              onClick={limpiarHistorialVentas}
              className="text-slate-500 hover:text-rose-600 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Vaciar Historial Ventas</span>
            </button>
          </div>
        </div>

        {/* Tarjeta 2: Periféricos y Configuración de Impresión */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-lg shadow-teal-900/5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <Printer className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Impresora Térmica de Tickets</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-600 font-semibold block mb-1">Ancho de papel de ticket:</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-hidden focus:border-teal-500">
                <option value="80">Térmica 80mm (Estándar Mostrador)</option>
                <option value="58">Térmica 58mm (Portátil Bluetooth Preventa)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1">Protocolo de comunicación:</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-hidden focus:border-teal-500">
                <option value="escpos">Comandos nativos ESC/POS (Impresión directa rápida)</option>
                <option value="browser">Diálogo estándar de impresión del navegador</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setMensajeExito('✓ Señal de prueba enviada a la impresora térmica.');
                setTimeout(() => setMensajeExito(null), 2500);
              }}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs hover:-translate-y-0.5 active:scale-98"
            >
              Imprimir Ticket de Prueba
            </button>
          </div>
        </div>
      </div>

      {/* Tarjeta: Políticas de Cuenta Corriente */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-lg shadow-teal-900/5 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
            <Users className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Políticas de Cuenta Corriente (Mora)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-600 font-semibold block mb-1">Método de actualización por Mora:</label>
            <select
              value={modoMora}
              onChange={(e) => setModoMora(e.target.value as 'INTERES_DIARIO' | 'REPOSICION')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-hidden focus:border-teal-500"
            >
              <option value="INTERES_DIARIO">Interés Financiero Diario (%)</option>
              <option value="REPOSICION">Actualización a Precio de Góndola actual</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-1">Aplica sobre el saldo fiado cuando la deuda supera los 30 días.</p>
          </div>

          <div>
            <label className={`text-slate-600 font-semibold block mb-1 ${modoMora !== 'INTERES_DIARIO' ? 'opacity-50' : ''}`}>
              Tasa de interés mensual (%):
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={tasaMensual}
              onChange={(e) => setTasaMensual(Number(e.target.value))}
              disabled={modoMora !== 'INTERES_DIARIO'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-hidden focus:border-teal-500 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={guardarAjustesCuentaCorriente}
            className="py-2.5 px-6 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-teal-600/20 hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Guardar Cambios
          </button>
        </div>
      </div>

      {/* Tarjeta 3: Cola de Sincronización Outbox (sync_outbox) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-lg shadow-teal-900/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
                <Send className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Cola de Sincronización Offline (`sync_outbox`)</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Transacciones generadas en modo desconectado que esperan confirmación del servidor central.
            </p>
          </div>

          <button
            type="button"
            onClick={forzarSincronizacionCola}
            disabled={sincronizandoManual || operacionesPendientes === 0}
            className="py-2.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer self-start sm:self-auto shadow-md shadow-teal-600/20 hover:-translate-y-0.5 active:scale-95"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${sincronizandoManual ? 'animate-spin' : ''}`} />
            <span>{sincronizandoManual ? 'Sincronizando...' : 'Sincronizar Cola Ahora'}</span>
          </button>
        </div>

        {itemsOutbox.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs font-medium">
            No hay operaciones en la cola de sincronización. Todas las transacciones están al día.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Comprobante</th>
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3 text-right">Importe</th>
                  <th className="py-2.5 px-3">Fecha de Creación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
                {itemsOutbox.map((item) => {
                  const esPendiente = item.estado === 'PENDIENTE';
                  return (
                    <tr key={item.id} className="hover:bg-teal-50/30 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          esPendiente 
                            ? 'bg-amber-50 text-amber-800 border-amber-200' 
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {esPendiente ? (
                            <>
                              <Clock className="h-3 w-3" />
                              <span>PENDIENTE</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              <span>SINCRONIZADO</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-800">
                        {item.tipoOperacion === 'VENTA' ? 'POS Mostrador' : 'Preventa en Ruta'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-900 font-bold">
                        {item.payload?.numeroTicket ?? '-'}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-700">
                        {item.payload?.cliente?.nombre ?? 'Consumidor Final'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        ${(item.payload?.total ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-sans text-[11px]">
                        {new Date(item.fechaCreacion).toLocaleTimeString('es-AR')} - {new Date(item.fechaCreacion).toLocaleDateString('es-AR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
