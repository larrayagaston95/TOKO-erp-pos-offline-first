/**
 * ============================================================================
 * VISTA: PREVENTA MÓVIL EN RUTA - DISEÑO MODERN SAAS (PreventaMovilView.tsx)
 * ============================================================================
 * TOKO ERP - Interfaz Mobile-First de alta ergonomía para preventistas en calle:
 * - Estética SaaS luminosa: fondos blancos puros (bg-white) y grises suaves (bg-slate-50).
 * - Acentos vibrantes Teal, Emerald y Cyan para máxima claridad a plena luz del sol.
 * - Botones táctiles de gran tamaño (mínimo 48px a 52px) optimizados para uso con pulgar.
 * - Tarjetas de artículos fluidas con sombras difusas (shadow-lg shadow-teal-900/5) y rounded-2xl.
 * - Selector prioritario de "Cliente en Ruta" con control de saldo deudor y límite crediticio.
 * - Barra fija inferior flotante de confirmación rápida en 1 toque.
 */

import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  MapPin, 
  CheckCircle2, 
  X, 
  Smartphone, 
  Send, 
  ChevronRight, 
  Battery, 
  Receipt,
  Sparkles,
  Zap,
  RotateCcw,
  Check
} from 'lucide-react';
import { usePreventaController } from '../../controllers/usePreventaController';
import { CategoriaProducto } from '../../models';

interface PreventaMovilViewProps {
  controlador: ReturnType<typeof usePreventaController>;
  estaOnline: boolean;
}

export const PreventaMovilView: React.FC<PreventaMovilViewProps> = ({ controlador, estaOnline }) => {
  const categorias: (CategoriaProducto | 'TODAS')[] = [
    'TODAS',
    'Almacén',
    'Bebidas',
    'Lácteos',
    'Golosinas',
    'Limpieza',
    'Fiambres y Quesos'
  ];

  const [mostrarMarcoCelular, setMostrarMarcoCelular] = useState<boolean>(true);

  // =========================================================================
  // CONTENIDO NATIVO MÓVIL (MODERN SAAS LIGHT CON ACENTOS TEAL/EMERALD)
  // =========================================================================
  const contenidoMovil = (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 relative overflow-hidden font-sans select-none">
      {/* =====================================================================
          1. BARRA DE ESTADO DEL DISPOSITIVO MÓVIL
          ===================================================================== */}
      <div className="h-8 bg-white text-slate-500 px-4 flex items-center justify-between text-[11px] font-mono shrink-0 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-teal-700 tracking-tight">TOKO ROUTE</span>
          <span className="text-slate-300">•</span>
          <span className="text-[10px] text-slate-400 font-sans font-medium">Vendedor #04</span>
        </div>
        <div className="flex items-center gap-2.5">
          {estaOnline ? (
            <span className="text-emerald-700 font-bold flex items-center gap-1.5 text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> 4G ONLINE
            </span>
          ) : (
            <span className="text-rose-700 font-bold flex items-center gap-1.5 text-[10px] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/80">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span> OFFLINE CALLE
            </span>
          )}
          <Battery className="h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      {/* =====================================================================
          2. CABECERA: CLIENTE EN RUTA & CUENTA CORRIENTE
          ===================================================================== */}
      <div className="bg-white p-4 shrink-0 border-b border-slate-200/80 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-teal-800 font-bold uppercase tracking-wider">
            <div className="p-1 rounded-lg bg-teal-50 text-teal-700">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
            </div>
            <span>Cliente a Visitar:</span>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            Zona: {controlador.clienteSeleccionado?.zonaRuta ?? 'General'}
          </span>
        </div>

        {/* Selector táctil con altura táctil ergonómica de al menos 48px */}
        <select
          id="preventa-select-cliente"
          value={controlador.clienteSeleccionado?.id ?? ''}
          onChange={(e) => {
            const cli = controlador.clientesRuta.find(c => c.id === e.target.value);
            if (cli) controlador.setClienteSeleccionado(cli);
          }}
          className="w-full min-h-[48px] bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm rounded-xl px-3.5 py-2.5 border border-slate-200 outline-hidden focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all cursor-pointer shadow-2xs"
        >
          {controlador.clientesRuta.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} • {c.direccion}
            </option>
          ))}
        </select>

        {/* Estado crediticio de alta visibilidad */}
        <div className="flex items-center justify-between text-xs font-sans pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px] font-medium">Deuda actual:</span>
            <span className={`font-mono font-bold text-xs ${
              (controlador.clienteSeleccionado?.saldoCuentaCorriente ?? 0) < 0 
                ? 'text-rose-600' 
                : 'text-emerald-700'
            }`}>
              ${Math.abs(controlador.clienteSeleccionado?.saldoCuentaCorriente ?? 0).toLocaleString('es-AR')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px] font-medium">Crédito disponible:</span>
            <span className="font-mono font-bold text-xs text-teal-700">
              ${(controlador.clienteSeleccionado?.limiteCredito ?? 0).toLocaleString('es-AR')}
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. BUSCADOR & FILTROS DE CATEGORÍA
          ===================================================================== */}
      <div className="p-3 bg-white border-b border-slate-200/80 space-y-2.5 shrink-0">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-600" />
          <input
            id="preventa-input-busqueda"
            type="text"
            value={controlador.busquedaTexto}
            onChange={(e) => controlador.setBusquedaTexto(e.target.value)}
            placeholder="Buscar por artículo o código de barras..."
            className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-hidden transition-all shadow-2xs"
          />
        </div>

        {/* Carrusel de categorías horizontal con botones amplios */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          {categorias.map((cat) => {
            const esActiva = controlador.categoriaSeleccionada === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => controlador.setCategoriaSeleccionada(cat)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl whitespace-nowrap font-bold transition-all cursor-pointer text-xs flex items-center gap-1 hover:-translate-y-0.5 active:scale-95 shadow-2xs ${
                  esActiva
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm shadow-teal-600/20'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          4. CATÁLOGO DE ARTÍCULOS EN RUTA (TARJETAS TÁCTILES GRANDES)
          ===================================================================== */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-28">
        {controlador.productos.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-sans text-xs">
            No se encontraron productos coincidentes en el catálogo local.
          </div>
        ) : (
          controlador.productos.map((prod) => {
            const itemEnPedido = controlador.carritoPreventa.find(i => i.producto.id === prod.id);
            const cantidad = itemEnPedido ? itemEnPedido.cantidad : 0;
            const precio = prod.precioMayorista || prod.precioMostrador || 0;

            return (
              <div
                key={prod.id}
                className={`p-3.5 rounded-2xl border transition-all shadow-sm ${
                  cantidad > 0
                    ? 'bg-teal-50/50 border-teal-300 shadow-md shadow-teal-900/5 ring-1 ring-teal-500/20'
                    : 'bg-white border-slate-200/80 hover:border-teal-200 hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 text-sm truncate">
                      {prod.nombre}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-mono">
                      <span className="text-teal-700 font-bold">{prod.codigoBarra}</span>
                      <span>•</span>
                      <span className="text-slate-600 font-sans">{prod.categoria}</span>
                      <span>•</span>
                      <span className="font-medium">Stock: {prod.stockActual} u.</span>
                    </div>
                    <div className="mt-1 font-mono font-black text-teal-800 text-base">
                      ${precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      <span className="text-[10px] text-slate-400 font-normal ml-1 font-sans">x bulto/unidad</span>
                    </div>
                  </div>

                  {/* Selector táctil masivo de AL MENOS 48PX para preventistas */}
                  <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => controlador.modificarCantidad(prod.id, -1)}
                      disabled={cantidad === 0}
                      className="min-h-[48px] min-w-[48px] rounded-xl bg-white hover:bg-slate-100 disabled:opacity-20 text-slate-700 border border-slate-200/80 flex items-center justify-center font-bold text-xl active:scale-95 cursor-pointer shadow-2xs transition-all"
                      title="Disminuir cantidad"
                    >
                      <Minus className="h-5 w-5" />
                    </button>

                    <span className="w-10 text-center font-mono font-black text-lg text-slate-900">
                      {cantidad}
                    </span>

                    <button
                      type="button"
                      onClick={() => controlador.modificarCantidad(prod.id, 1)}
                      className="min-h-[48px] min-w-[48px] rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white flex items-center justify-center font-black text-xl active:scale-95 cursor-pointer shadow-md shadow-teal-600/20 transition-all hover:-translate-y-0.5"
                      title="Aumentar cantidad"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =====================================================================
          5. BARRA FIJA INFERIOR DE DESPACHO (CHECKOUT FLOTANTE ERGONÓMICO)
          ===================================================================== */}
      <div className="absolute bottom-0 inset-x-0 p-3.5 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-xl z-20">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wider block">
              Total Pedido ({controlador.totales?.totalUnidades ?? 0} u.):
            </span>
            <span className="font-mono text-xl sm:text-2xl font-black text-teal-800">
              ${(controlador.totales?.total ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {controlador.carritoPreventa.length > 0 && (
              <button
                type="button"
                onClick={controlador.vaciarCarrito}
                className="min-h-[48px] min-w-[48px] rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100/80 border border-rose-200/80 flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-2xs"
                title="Vaciar Pedido"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}

            {/* Botón táctil principal de al menos 48px */}
            <button
              type="button"
              id="btn-confirmar-pedido-movil"
              disabled={controlador.carritoPreventa.length === 0}
              onClick={() => controlador.setMostrarModalCarrito(true)}
              className="min-h-[48px] sm:min-h-[52px] px-5 py-3 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-30 disabled:pointer-events-none text-white font-sans font-black text-xs sm:text-sm rounded-xl flex items-center gap-2.5 cursor-pointer shadow-lg shadow-teal-600/25 transition-all active:scale-95 hover:-translate-y-0.5 tracking-wide"
            >
              <Send className="h-4 w-4" />
              <span>CONFIRMAR PEDIDO</span>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          6. DRAWER / MODAL DE CONFIRMACIÓN DE PEDIDO EN RUTA
          ===================================================================== */}
      {controlador.mostrarModalCarrito && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end p-2 sm:p-4">
          <div className="bg-white text-slate-800 rounded-3xl border border-slate-200 p-5 max-h-[85vh] flex flex-col space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-sans font-black text-slate-900 text-base block">RESUMEN DEL PEDIDO</span>
                <span className="text-xs text-teal-700 font-bold">{controlador.clienteSeleccionado?.nombre}</span>
              </div>
              <button
                type="button"
                onClick={() => controlador.setMostrarModalCarrito(false)}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs">
              {controlador.carritoPreventa.map((item) => (
                <div key={item.producto.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 block">{item.producto.nombre}</span>
                    <span className="text-slate-500 text-[11px] font-mono">{item.cantidad} x ${(item.precioUnitario ?? 0).toLocaleString('es-AR')}</span>
                  </div>
                  <span className="font-mono font-black text-teal-800 text-sm">${(item.subtotal ?? 0).toLocaleString('es-AR')}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex justify-between text-base font-black text-slate-900 font-mono">
                <span>TOTAL A TRANSMITIR:</span>
                <span className="text-teal-800">${(controlador.totales?.total ?? 0).toLocaleString('es-AR')}</span>
              </div>

              <button
                type="button"
                onClick={async () => {
                  await controlador.cerrarYConfirmarPedido();
                }}
                className="w-full min-h-[50px] py-3.5 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-500 hover:to-emerald-500 text-white font-sans font-black rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 shadow-lg shadow-teal-600/20 hover:-translate-y-0.5"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span>TRANSMITIR PEDIDO A CENTRAL</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          7. MODAL DE PEDIDO CONFIRMADO
          ===================================================================== */}
      {controlador.pedidoConfirmado && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 p-6 rounded-3xl border border-slate-200 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200/80 shadow-sm">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">PEDIDO REGISTRADO</h3>
              <p className="text-xs text-slate-500 font-mono mt-1">Comprobante: {controlador.pedidoConfirmado.numeroTicket}</p>
              <p className="text-xs text-teal-700 font-bold mt-2 bg-teal-50 p-2 rounded-xl border border-teal-100">
                {controlador.pedidoConfirmado.estadoSync === 'PENDIENTE_SYNC' 
                  ? 'Guardado en cola offline local (IndexedDB) para sincronizar al volver la red' 
                  : 'Transmitido y sincronizado con el servidor central'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => controlador.cerrarModalConfirmacion()}
              className="w-full min-h-[48px] py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs sm:text-sm rounded-xl cursor-pointer shadow-md shadow-teal-600/20 hover:-translate-y-0.5 transition-all"
            >
              NUEVO PEDIDO EN RUTA
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div id="vista-preventa-modulo" className="flex-1 p-4 bg-slate-100/70 overflow-y-auto flex flex-col items-center justify-center min-h-0">
      {/* Selector de modo marco de celular para desktop */}
      <div className="mb-3 flex items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => setMostrarMarcoCelular(!mostrarMarcoCelular)}
          className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 flex items-center gap-2 cursor-pointer font-bold shadow-sm shadow-slate-200/50 transition-all hover:-translate-y-0.5"
        >
          <Smartphone className="h-4 w-4 text-teal-600" />
          <span>{mostrarMarcoCelular ? 'Ver en Pantalla Completa' : 'Ver en Marco Móvil (Smartphone)'}</span>
        </button>
      </div>

      {mostrarMarcoCelular ? (
        <div className="w-full max-w-[420px] h-[780px] max-h-[calc(100vh-8rem)] rounded-[44px] p-3 bg-slate-900 border-[6px] border-slate-800 shadow-2xl shadow-slate-400/30 relative overflow-hidden flex flex-col">
          {/* Cámara frontal simulada */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-800 rounded-full z-30" />
          <div className="flex-1 rounded-[34px] overflow-hidden flex flex-col pt-1">
            {contenidoMovil}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-2xl h-[calc(100vh-8rem)] rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col shadow-xl shadow-slate-200/50">
          {contenidoMovil}
        </div>
      )}
    </div>
  );
};
