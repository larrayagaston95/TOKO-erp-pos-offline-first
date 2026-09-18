/**
 * ============================================================================
 * VISTA PRINCIPAL: APP SHELL & ORQUESTADOR MVC (App.tsx)
 * ============================================================================
 * TOKO ERP - Plataforma SaaS Offline-First para Supermercados, Kioscos y
 * Distribuidoras Mayoristas.
 * 
 * Orquesta la arquitectura MVC conectando:
 * - Los Controladores: 'useRedController', 'usePosController', 'usePreventaController'.
 * - Las Vistas: 'Sidebar', 'Topbar', 'PosView', 'PreventaMovilView', 'ClientesView', 'ProductosView' y 'ConfiguracionView'.
 * - Los Modelos: Datos persistentes de productos, clientes y ventas.
 */

import React, { useState } from 'react';
import { Sidebar, ModuloActivo } from './views/layout/Sidebar';
import { Topbar } from './views/layout/Topbar';
import { PosView } from './views/pos/PosView';
import { PreventaMovilView } from './views/preventa/PreventaMovilView';
import { ClientesView } from './views/clientes/ClientesView';
import { ProductosView } from './views/productos/ProductosView';
import { VentasView } from './views/ventas/VentasView';
import { ConfiguracionView } from './views/configuracion/ConfiguracionView';
import { LoginView } from './views/auth/LoginView';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Importación de Controladores de Lógica de Negocio
import { useRedController } from './controllers/useRedController';
import { usePosController } from './controllers/usePosController';
import { usePreventaController } from './controllers/usePreventaController';

export default function App() {
  /**
   * Estado de autenticación del operador.
   * false → muestra LoginView (acceso bloqueado al sistema).
   * true  → muestra el sistema ERP completo (Sidebar + Topbar + Vistas).
   *
   * TODO: Persistir con localStorage o token JWT cuando se integre
   *       la autenticación real con el backend Spring Boot.
   */
  const [estaAutenticado, setEstaAutenticado] = useState<boolean>(false);

  // Módulo actualmente activo en el menú lateral
  const [moduloActivo, setModuloActivo] = useState<ModuloActivo>('pos');

  /**
   * Estado para controlar la visibilidad del menú lateral (Sidebar).
   * Al colapsar, permite que la interfaz de caja ocupe el 100% del ancho.
   */
  const [sidebarColapsado, setSidebarColapsado] = useState<boolean>(false);

  /** Callback que recibe LoginView al validar las credenciales correctamente. */
  const manejarLoginExitoso = () => {
    setEstaAutenticado(true);
  };

  // 1. Controlador de Red (Supervisa conectividad real online/offline y cola de sincronización)
  const redController = useRedController();

  // 2. Controlador de Punto de Venta para mostrador de escritorio
  const posController = usePosController(
    redController.estaOnline,
    redController.registrarOperacionOffline
  );

  // 3. Controlador de Preventa Móvil para vendedores en la calle
  const preventaController = usePreventaController(
    redController.estaOnline,
    redController.registrarOperacionOffline
  );

  /**
   * Obtiene el título legible del módulo activo para la Topbar.
   */
  const obtenerTituloModulo = (): string => {
    switch (moduloActivo) {
      case 'pos':
        return 'Punto de Venta Mostrador (POS)';
      case 'ventas':
        return 'Historial de Ventas y Cierre de Caja';
      case 'preventa':
        return 'Preventa Móvil en Ruta';
      case 'clientes':
        return 'Cartera de Clientes & Cuentas Corrientes';
      case 'productos':
        return 'Catálogo de Artículos & Inventario';
      case 'configuracion':
        return 'Base de Datos Local & Sincronización';
      default:
        return 'TOKO ERP';
    }
  };

  // ── Guard de autenticación ──────────────────────────────────────────────
  // Si el operador no está autenticado, renderizar EXCLUSIVAMENTE el login.
  // Ningún controlador ni vista del ERP se monta hasta que la sesión sea válida.
  if (!estaAutenticado) {
    return <LoginView alIniciarSesion={manejarLoginExitoso} />;
  }

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans antialiased selection:bg-teal-500 selection:text-white">
      {/* 1. Menú Lateral (Sidebar) */}
      {!sidebarColapsado && (
        <Sidebar 
          moduloActivo={moduloActivo} 
          alSeleccionarModulo={setModuloActivo} 
        />
      )}

      {/* Botón flotante para colapsar/desplegar el menú lateral (UX) */}
      <button
        onClick={() => setSidebarColapsado(!sidebarColapsado)}
        className={`absolute top-1/2 -translate-y-1/2 z-40 flex items-center justify-center h-8 w-8 rounded-full bg-white border border-slate-200 shadow-md text-slate-500 hover:text-teal-600 transition-all cursor-pointer ${
          sidebarColapsado ? 'left-0 rounded-l-none' : 'left-72 -translate-x-1/2'
        }`}
        title={sidebarColapsado ? 'Desplegar menú lateral' : 'Colapsar menú lateral'}
      >
        {sidebarColapsado ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* 2. Área Central de Trabajo */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/60">
        {/* Barra Superior (Topbar) con Monitor de Red Online/Offline */}
        <Topbar
          estaOnline={redController.estaOnline}
          modoOfflineForzado={redController.modoOfflineForzado}
          operacionesPendientes={redController.operacionesPendientes}
          alAlternarModoOffline={redController.toggleSimulacionDesconexion}
          tituloModulo={obtenerTituloModulo()}
        />

        {/* 3. Contenedor de Vistas (Renderizado según módulo seleccionado) */}
        <main className="flex-1 flex overflow-hidden bg-slate-50/60">
          {moduloActivo === 'pos' && (
            <PosView 
              controlador={posController} 
              estaOnline={redController.estaOnline} 
            />
          )}

          {moduloActivo === 'ventas' && (
            <VentasView />
          )}

          {moduloActivo === 'preventa' && (
            <PreventaMovilView 
              controlador={preventaController} 
              estaOnline={redController.estaOnline} 
            />
          )}

          {moduloActivo === 'clientes' && (
            <ClientesView />
          )}

          {moduloActivo === 'productos' && (
            <ProductosView />
          )}

          {moduloActivo === 'configuracion' && (
            <ConfiguracionView 
              estaOnline={redController.estaOnline} 
              operacionesPendientes={redController.operacionesPendientes} 
              alReiniciarColaSync={redController.reiniciarColaSync} 
            />
          )}
        </main>
      </div>
    </div>
  );
}
