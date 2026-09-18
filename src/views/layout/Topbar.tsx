/**
 * ============================================================================
 * VISTA: BARRA SUPERIOR - DISEÑO MODERN SAAS (Topbar.tsx)
 * ============================================================================
 * TOKO ERP - Monitor de terminal y red de alta visibilidad:
 * - Indicadores nítidos de red Online (Esmeralda) y Offline (Rosa/Rojo).
 * - Monitor en tiempo real de cola de sincronización Outbox en Dexie.
 * - Interruptor de simulación de corte de conexión.
 * - Fondo blanco translúcido con efecto glassmorphism sutil y bordes fluidos.
 */

import React from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  User, 
  ArrowDownUp,
  Activity,
  Terminal
} from 'lucide-react';

interface TopbarProps {
  estaOnline: boolean;
  modoOfflineForzado: boolean;
  operacionesPendientes: number;
  alAlternarModoOffline: () => void;
  tituloModulo: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  estaOnline,
  modoOfflineForzado,
  operacionesPendientes,
  alAlternarModoOffline,
  tituloModulo
}) => {
  return (
    <header 
      id="topbar-principal" 
      className="print:hidden h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-20 select-none text-slate-800 shadow-xs"
    >
      {/* Título del módulo activo */}
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-black text-white bg-gradient-to-r from-teal-600 to-emerald-600 px-2.5 py-0.5 rounded-md shadow-2xs">
              TOKO
            </span>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
              {tituloModulo}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-medium">
            <span className="text-teal-700 font-bold font-mono">TERMINAL #01</span>
          </div>
        </div>
      </div>

      {/* Controles de Red, Sincronización y Cajero */}
      <div className="flex items-center gap-3 shrink-0">
        {/* ===================================================================
            INDICADOR DE ESTADO DE CONEXIÓN REAL (ONLINE / OFFLINE)
            =================================================================== */}
        <div 
          id="indicador-estado-red" 
          title={estaOnline ? "Conectado al servidor central." : "Operando en modo offline."}
          className={`flex items-center justify-center h-9 w-9 rounded-xl border select-none shadow-2xs ${
            estaOnline
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-rose-50 border-rose-200 animate-pulse'
          }`}
        >
          {estaOnline ? (
            <Wifi className="h-4 w-4 text-emerald-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-rose-600" />
          )}
        </div>

        {/* Cola de Sincronización Outbox */}
        {operacionesPendientes > 0 && (
          <div 
            id="badge-cola-sincronizacion"
            title="Ventas registradas localmente en espera de subida al servidor"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-mono font-bold shadow-2xs"
          >
            <RefreshCw className="h-3 w-3 animate-spin text-amber-600" />
            <span>{operacionesPendientes}</span>
            <span className="hidden lg:inline text-[10px] text-amber-700">EN COLA</span>
          </div>
        )}

        {/* Separador vertical sutil */}
        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* Perfil del Operador */}
        <div className="flex items-center gap-2.5 pl-0.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-teal-600/20 shrink-0">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <span className="text-xs font-bold text-slate-800 block truncate">
              Gastón N.
            </span>
            <span className="text-[11px] text-slate-500 font-medium block">
              Cajero Central
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
