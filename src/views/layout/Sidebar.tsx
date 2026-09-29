/**
 * ============================================================================
 * VISTA: MENÚ LATERAL - DISEÑO MODERN SAAS (Sidebar.tsx)
 * ============================================================================
 * TOKO ERP - Estética SaaS de alta gama:
 * - Fondos blancos puros y grises luminosos con acentos vibrantes Teal & Emerald.
 * - Bordes suaves y redondeados (rounded-xl) con sombras sutiles y difusas.
 * - Efectos de hover elegantes (hover:-translate-y-0.5 transition-all).
 * - Identidad de marca oficial: TOKO ERP.
 */

import React from 'react';
import logoToko from "../../assets/logo-toko.png";

import {
  Store,
  Smartphone,
  Users,
  Package,
  Settings,
  ChevronRight,
  HardDrive,
  Cpu,
  Sparkles,
  Wallet,
  Building2,
  BarChart,
  Banknote,
  UsersRound,
  LogOut
} from 'lucide-react';
import { Empleado } from '../../models';

export type RolUsuario = 'ADMIN' | 'CAJERO' | 'PREVENTISTA' | 'VENDEDOR' | 'VENTA_LOGISTICA';

export type ModuloActivo = 'pos' | 'ventas' | 'preventa' | 'clientes' | 'productos' | 'configuracion' | 'reportes' | 'caja' | 'empleados';

interface SidebarProps {
  moduloActivo: ModuloActivo;
  alSeleccionarModulo: (modulo: ModuloActivo) => void;
  usuarioActual: Empleado;
  /** Callback para cerrar la sesión del usuario y regresar al Login. */
  alCerrarSesion: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ moduloActivo, alSeleccionarModulo, usuarioActual, alCerrarSesion }) => {
  // ============================================================================
  // LÓGICA DE MENÚ COLAPSABLE Y ROLES
  // ============================================================================
  // El menú puede ocultarse por completo (manejado desde App.tsx mediante sidebarColapsado)
  // para permitir que la vista de mostrador (POS) ocupe el 100% de la pantalla.
  // Además, se han ocultado los módulos de "Preventa Móvil" y "Base de Datos & Sync"
  // ----------------------------------------------------------------------------
  // ROLES: 
  // 'ADMIN' tiene acceso a todo.
  // 'VENDEDOR' tiene acceso a POS y Clientes, se le ocultan Reportes, Caja, Empleados y Config.
  // ----------------------------------------------------------------------------

  const itemsMenu: {
    id: ModuloActivo;
    etiqueta: string;
    subtitulo: string;
    icono: React.ElementType;
    badge?: string;
    rolesPermitidos: RolUsuario[];
  }[] = [
      {
        id: 'pos',
        etiqueta: 'Punto de Venta',
        subtitulo: 'Caja Mostrador & Escáner',
        icono: Store,
        badge: 'F1',
        rolesPermitidos: ['ADMIN', 'VENDEDOR', 'VENTA_LOGISTICA']
      },
      {
        id: 'ventas',
        etiqueta: 'Ventas y Cierre',
        subtitulo: 'Historial y Arqueo de Caja',
        icono: Wallet,
        badge: 'F2',
        rolesPermitidos: ['ADMIN', 'CAJERO']
      },
      {
        id: 'clientes',
        etiqueta: 'Clientes & Cuentas',
        subtitulo: 'Cuentas Corrientes & Crédito',
        icono: Users,
        badge: 'F4',
        rolesPermitidos: ['ADMIN', 'VENDEDOR', 'VENTA_LOGISTICA']
      },
      {
        id: 'productos',
        etiqueta: 'Catálogo & Stock',
        subtitulo: 'Precios Duales & EAN-13',
        icono: Package,
        badge: 'F3',
        rolesPermitidos: ['ADMIN', 'VENTA_LOGISTICA']
      },
      {
        id: 'reportes',
        etiqueta: 'Dashboard',
        subtitulo: 'Métricas y Ganancias',
        icono: BarChart,
        badge: 'F5',
        rolesPermitidos: ['ADMIN']
      },
      {
        id: 'caja',
        etiqueta: 'Control de Caja',
        subtitulo: 'Apertura, Cierres y Turnos',
        icono: Banknote,
        badge: 'F6',
        rolesPermitidos: ['ADMIN', 'VENDEDOR', 'VENTA_LOGISTICA']
      },
      {
        id: 'empleados',
        etiqueta: 'Personal & Roles',
        subtitulo: 'Seguridad y Accesos',
        icono: UsersRound,
        rolesPermitidos: ['ADMIN']
      },
      {
        id: 'configuracion',
        etiqueta: 'Configuración',
        subtitulo: 'Ajustes y Sistema',
        icono: Settings,
        rolesPermitidos: ['ADMIN']
      }
    ];

  // Filtramos los ítems del menú según el rol del usuario actual
  const itemsVisibles = itemsMenu.filter(item => item.rolesPermitidos.includes(usuarioActual.rol as any));

  return (
    <aside
      id="sidebar-principal"
      className="print:hidden w-72 bg-white text-slate-700 flex flex-col h-screen shrink-0 border-r border-slate-200/80 select-none shadow-sm shadow-slate-200/50 z-30"
    >
      {/* =====================================================================
          CABECERA OFICIAL: TOKO ERP (BRANDING MODERN SAAS)
          ===================================================================== */}
      <div className="flex flex-col items-center justify-center py-6 border-b border-gray-200 relative bg-white">
        {/* Logo TOKO */}
        <img src={logoToko} alt="TOKO" className="h-24 w-auto object-contain mb-2" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Retail & Preventa Offline
        </span>

        {/* Indicador de sistema activo */}
        <div className="absolute top-4 right-4 flex items-center" title="Sistema Operativo Normal">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </div>
      </div>

      {/* =====================================================================
          MÓDULOS DEL SISTEMA: TECLADO RÁPIDO Y BOTONES TÁCTILES
          ===================================================================== */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-600">
          <span>Menú de Operaciones</span>
          <span className="text-teal-700 font-mono text-[10px] bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100 font-bold">
            v3.0 PRO
          </span>
        </div>

        {itemsVisibles.map((item) => {
          const Icono = item.icono;
          const esActivo = moduloActivo === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => alSeleccionarModulo(item.id)}
              className={`w-full group relative flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer border ${esActivo
                  ? 'bg-gradient-to-r from-teal-50/90 to-emerald-50/80 text-teal-950 font-bold border-teal-200/90 shadow-sm shadow-teal-900/5 ring-1 ring-teal-500/15 translate-x-0.5'
                  : 'bg-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-transparent hover:-translate-y-0.5'
                }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`p-2.5 rounded-xl transition-all duration-200 ${esActivo
                    ? 'bg-gradient-to-br from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-600/25'
                    : 'bg-slate-100/90 text-slate-500 group-hover:bg-teal-50 group-hover:text-teal-600'
                  }`}>
                  <Icono className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className={`text-xs font-bold leading-tight truncate tracking-tight ${esActivo ? 'text-teal-950' : 'text-slate-800 group-hover:text-slate-950'
                    }`}>
                    {item.etiqueta}
                  </div>
                  <div className={`text-[11px] truncate mt-0.5 font-medium ${esActivo ? 'text-teal-700' : 'text-slate-500 group-hover:text-slate-600'
                    }`}>
                    {item.subtitulo}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-1.5">
                {item.badge && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${esActivo
                      ? 'bg-white text-teal-700 border-teal-200 shadow-2xs'
                      : 'bg-slate-100 text-slate-500 border-slate-200/80 group-hover:border-slate-300'
                    }`}>
                    {item.badge}
                  </span>
                )}
                <ChevronRight className={`h-4 w-4 transition-all duration-200 ${esActivo ? 'text-teal-600 translate-x-0.5 opacity-100' : 'text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
                  }`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          PIE DEL MENÚ: INFORMACIÓN DE CAJA & HARDWARE LOCAL
          ===================================================================== */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/70 text-xs">
        <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm shadow-slate-200/40 space-y-2.5">
          {/* Info de sucursal */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-800 truncate">
              <div className="p-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
              </div>
              <span className="truncate">Sucursal Central #01</span>
            </div>
            <span className="font-mono text-[10px] text-teal-800 font-extrabold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/80">
              POS-01
            </span>
          </div>

          {/* Info del usuario logueado + botón cerrar sesión */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="p-1 rounded-lg bg-slate-100 text-slate-500">
                <UsersRound className="h-3 w-3 shrink-0" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-700 truncate">{usuarioActual.nombre}</p>
                <p className="text-[9px] text-slate-400 uppercase tracking-wide">{usuarioActual.rol}</p>
              </div>
            </div>
            <button
              onClick={alCerrarSesion}
              title="Cerrar sesión"
              className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200"
            >
              <LogOut className="h-3 w-3 shrink-0" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
