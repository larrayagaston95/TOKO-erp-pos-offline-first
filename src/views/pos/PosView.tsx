/**
 * ============================================================================
 * VISTA: PUNTO DE VENTA (POS MOSTRADOR) - DISEÑO MODERN SAAS (PosView.tsx)
 * ============================================================================
 * TOKO ERP - Estética SaaS de alta gama para mostrador y cajas de alta rotación:
 * - Fondos luminosos (bg-slate-50 y bg-white) con acentos vibrantes Teal & Emerald.
 * - Tarjetas con bordes suaves (rounded-2xl) y sombras difusas (shadow-lg shadow-teal-900/5).
 * - Grilla de ticket con legibilidad cristalina y selectores táctiles fluidos.
 * - Display de Total de alto contraste e impacto visual.
 * - Teclado de billetes rápidos y calculadora de vuelto instantánea.
 */

import React, { useRef, useEffect, useState } from 'react';
import { 
  Search, 
  Barcode, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  QrCode, 
  FileText, 
  CheckCircle2, 
  Printer, 
  X, 
  ShoppingCart, 
  Zap, 
  Receipt,
  CornerDownLeft,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { usePosController } from '../../controllers/usePosController';
import { MetodoPago } from '../../models';
import { FacturaLegalPdf } from './FacturaLegalPdf';
import { TicketComunPdf } from './TicketComunPdf';
import { PDFViewer } from '@react-pdf/renderer';
import { useCajaController } from '../../controllers/useCajaController';
import { Lock, DollarSign, User } from 'lucide-react';
import { Empleado } from '../../models';

interface PosViewProps {
  controlador: ReturnType<typeof usePosController>;
  estaOnline: boolean;
  usuarioAutenticado: Empleado;
}

export const PosView: React.FC<PosViewProps> = ({ controlador, estaOnline, usuarioAutenticado }) => {
  const inputBusquedaRef = useRef<HTMLInputElement>(null);
  const [imprimirComoFactura, setImprimirComoFactura] = useState(false);
  const [mostrarVisorPdf, setMostrarVisorPdf] = useState(false);
  const [modoMediaHoja, setModoMediaHoja] = useState(true);

  // --- COBRO INLINE (reemplaza ModalCobro) ---
  const [montoAbonado, setMontoAbonado] = useState<number | ''>(0);
  const [errorCobro, setErrorCobro] = useState('');

  // â”€â”€â”€ Control de Caja: Apertura y Bloqueo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const cajaController = useCajaController();
  const [nombreCajero, setNombreCajero] = useState('');
  const [montoApertura, setMontoApertura] = useState<number>(0);
  const [abriendoCaja, setAbriendoCaja] = useState(false);

  // Inyectar el empleado actual en el controlador de caja al abrirla si se quisiera (usamos el nombre del input pero podría pre-llenarse)
  useEffect(() => {
    if (usuarioAutenticado && !nombreCajero) {
      setNombreCajero(usuarioAutenticado.nombre);
    }
  }, [usuarioAutenticado, nombreCajero]);

  /** Maneja la apertura de caja desde el modal de bloqueo. */
  const manejarAperturaCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCajero.trim() || montoApertura < 0) return;
    setAbriendoCaja(true);
    await cajaController.abrirCaja(montoApertura, nombreCajero.trim());
    setAbriendoCaja(false);
  };

  // Mantener el cursor listo en el buscador para escaneo continuo
  useEffect(() => {
    inputBusquedaRef.current?.focus();
  }, [controlador.itemsCarrito.length]);

  const manejarKeyPressBusqueda = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      controlador.procesarCodigoBarra(controlador.busqueda);
    }
  };

  // â”€â”€â”€ Estados para Búsqueda Manual (Autocomplete) â”€â”€â”€
  const [busquedaManual, setBusquedaManual] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Efecto para buscar con debounce cuando se escribe en la búsqueda manual
  useEffect(() => {
    if (!busquedaManual.trim()) {
      setResultadosBusqueda([]);
      return;
    }
    const timeoutId = setTimeout(async () => {
      const res = await controlador.buscarProductosManual(busquedaManual);
      setResultadosBusqueda(res);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [busquedaManual, controlador]);

  // Manejador para cerrar el dropdown al clickear fuera
  useEffect(() => {
    const handleClickFuera = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setResultadosBusqueda([]);
      }
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  const manejarSeleccionManual = (producto: any) => {
    controlador.agregarProductoAlCarrito(producto, 1);
    setBusquedaManual('');
    setResultadosBusqueda([]);
    inputBusquedaRef.current?.focus();
  };

  return (
    <div 
      id="vista-pos-mostrador" 
      className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-slate-50/70 text-slate-800 select-none p-4 gap-4 relative"
    >
      {/* =====================================================================
          OVERLAY: CAJA CERRADA â€” BLOQUEO TOTAL DEL POS
          Cuando no hay turno activo, este overlay se superpone bloqueando
          el acceso a cualquier función del punto de venta.
          ===================================================================== */}
      {!cajaController.turnoActivo && (
        <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            {/* Cabecera */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-teal-500 blur-3xl" />
              </div>
              <div className="relative z-10">
                <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <Lock className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-black text-white mb-1">Caja Cerrada</h2>
                <p className="text-slate-400 text-sm">
                  Ingresá tus datos para abrir la caja y comenzar a operar.
                </p>
              </div>
            </div>
            {/* Formulario de Apertura */}
            <form onSubmit={manejarAperturaCaja} className="p-6 space-y-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Nombre del Cajero
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={nombreCajero}
                  onChange={e => setNombreCajero(e.target.value)}
                  placeholder="Ej: María González"
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" /> Monto Inicial / Cambio en Caja ($)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={montoApertura || ''}
                  onChange={e => setMontoApertura(Number(e.target.value))}
                  placeholder="0.00"
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={abriendoCaja || !nombreCajero.trim()}
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-60 text-white py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-600/25 transition-all active:scale-95 cursor-pointer"
              >
                <DollarSign className="h-5 w-5" />
                {abriendoCaja ? 'Abriendo Caja...' : 'âœ… Abrir Caja y Comenzar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          COLUMNA IZQUIERDA: BUSCADOR TERMINAL, PISTOLA LÃSER Y TABLA DE ITEMS
          ===================================================================== */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden min-w-0">
        
        {/* ===================================================================
            1. SCANNER & ACCESOS RÃPIDOS DE SUPERMERCADO
            =================================================================== */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-lg shadow-teal-900/5 shrink-0 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Input con icono de pistola láser */}
            <div className="relative flex-1">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-teal-600 font-mono text-xs font-bold pointer-events-none">
                <Barcode className="h-4 w-4 text-teal-600" />
                <span className="hidden sm:inline">SCAN</span>
              </div>
              <input
                ref={inputBusquedaRef}
                id="pos-input-busqueda"
                type="text"
                value={controlador.busqueda}
                onChange={(e) => controlador.setBusqueda(e.target.value)}
                onKeyDown={manejarKeyPressBusqueda}
                placeholder="Escanear código de barras o escribir nombre del artículo (Enter)..."
                className="w-full pl-18 sm:pl-20 pr-24 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl font-mono text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-hidden transition-all shadow-2xs"
              />
              <button
                type="button"
                onClick={() => controlador.procesarCodigoBarra(controlador.busqueda)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm shadow-teal-600/20 transition-all cursor-pointer hover:-translate-y-0.5 active:scale-95"
              >
                <span>AGREGAR</span>
                <CornerDownLeft className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Accesos rápidos de alta rotación */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 pb-0.5 md:pb-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                Frecuentes:
              </span>
              {[
                { codigo: '7790070411802', nombre: 'Aceite 1.5L', precio: '$1.850' },
                { codigo: '7791234567890', nombre: 'Coca 2.25L', precio: '$2.100' },
                { codigo: '7790060987654', nombre: 'Yerba 1kg', precio: '$3.200' },
                { codigo: '7790080112233', nombre: 'Galletitas', precio: '$950' }
              ].map((item) => (
                <button
                  key={item.codigo}
                  type="button"
                  onClick={() => controlador.procesarCodigoBarra(item.codigo)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-teal-50/70 hover:border-teal-300 border border-slate-200/90 text-slate-700 rounded-xl text-xs font-sans transition-all cursor-pointer whitespace-nowrap hover:-translate-y-0.5 shadow-2xs flex items-center gap-1.5"
                >
                  <Plus className="h-3 w-3 text-teal-600" />
                  <span className="font-semibold">{item.nombre}</span>
                  <span className="text-teal-700 font-bold font-mono text-[11px]">{item.precio}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Buscador Manual de Productos (Fallback sin láser) */}
          <div className="relative mt-2" ref={dropdownRef}>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center text-slate-400 pointer-events-none">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={busquedaManual}
              onChange={(e) => setBusquedaManual(e.target.value)}
              placeholder="ðŸ” Buscar producto por nombre o descripción..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-hidden transition-all shadow-2xs"
            />
            
            {/* Dropdown flotante de Resultados (Autocomplete) */}
            {resultadosBusqueda.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                <ul className="py-1">
                  {resultadosBusqueda.map((prod) => (
                    <li key={prod.id}>
                      <button
                        type="button"
                        onClick={() => manejarSeleccionManual(prod)}
                        className="w-full text-left px-4 py-2.5 hover:bg-teal-50 hover:text-teal-900 transition-colors cursor-pointer border-b border-slate-100 last:border-0 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-slate-800 truncate">{prod.nombre}</p>
                          <p className="text-[10px] text-slate-500 font-mono">EAN: {prod.codigoBarras}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-black text-teal-700 text-sm">
                            ${(prod.precioVenta ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">Stock: {prod.stock} u.</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {/* Notificación toast de producto escaneado */}
          {controlador.mensajeNotificacion && (
            <div className="text-xs text-emerald-800 font-medium bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 flex items-center justify-between shadow-2xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{controlador.mensajeNotificacion}</span>
              </div>
              <span className="text-[10px] text-emerald-700 uppercase tracking-widest font-mono font-bold">REGISTRADO</span>
            </div>
          )}
        </div>

        {/* ===================================================================
            2. TABLA CENTRAL DE DETALLE DEL TICKET (SAAS MODERNO & LUMINOSO)
            =================================================================== */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-lg shadow-teal-900/5 flex flex-col overflow-hidden min-h-0">
          {/* Barra de estado de la grilla de ticket */}
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
              <span className="font-bold text-slate-900 tracking-tight text-sm">TICKET DE VENTA EN CURSO</span>
              <span className="text-slate-300">â€¢</span>
              <span className="text-teal-700 font-bold text-xs bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">
                {controlador.itemsCarrito.length} renglones
              </span>
            </div>

            {controlador.itemsCarrito.length > 0 && (
              <button
                type="button"
                onClick={controlador.vaciarCarrito}
                className="text-rose-600 hover:text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 shadow-2xs hover:-translate-y-0.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>CANCELAR TICKET</span>
              </button>
            )}
          </div>

          {/* Grilla de artículos escaneados */}
          <div className="flex-1 overflow-y-auto">
            {controlador.itemsCarrito.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 space-y-3">
                <div className="h-16 w-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shadow-sm shadow-teal-900/5">
                  <Barcode className="h-8 w-8 text-teal-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-800">Ticket Vacío â€¢ Listo para Escanear</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">Dispare con la pistola láser sobre el código de barras o use los botones de artículos frecuentes arriba.</p>
                </div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 sticky top-0 z-10">
                    <th className="py-3 px-4 w-12 text-center font-mono">#</th>
                    <th className="py-3 px-4">Artículo / Código EAN</th>
                    <th className="py-3 px-4 text-center w-36">Cantidad</th>
                    <th className="py-3 px-4 text-right font-mono">P. Unitario</th>
                    <th className="py-3 px-4 text-right font-mono">Subtotal</th>
                    <th className="py-3 px-4 text-center w-14">Quitar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {controlador.itemsCarrito.map((item, index) => (
                    <tr 
                      key={item.producto.id} 
                      className={`hover:bg-teal-50/30 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                      }`}
                    >
                      {/* Número de renglón */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">
                        {(index + 1).toString().padStart(2, '0')}
                      </td>

                      {/* Nombre y código EAN */}
                      <td className="py-3 px-4 min-w-0">
                        <div className="font-bold text-slate-900 text-sm truncate">
                          {item.producto.nombre}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-mono">
                          <span className="text-teal-700 font-semibold">{item.producto.codigoBarra}</span>
                          <span>â€¢</span>
                          <span className="text-slate-600 font-sans">{item.producto.categoria}</span>
                          <span>â€¢</span>
                          <span className={`font-medium ${
                            item.producto.stockActual <= 10 ? 'text-amber-600 font-bold' : 'text-slate-500'
                          }`}>
                            Stock: {item.producto.stockActual} u.
                          </span>
                        </div>
                      </td>

                      {/* Selector táctil de cantidad (+ / -) con botones amplios */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => controlador.modificarCantidad(item.producto.id, -1)}
                            className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-11 text-center font-bold text-sm text-slate-900 font-mono">
                            {item.cantidad}
                          </span>
                          <button
                            type="button"
                            onClick={() => controlador.modificarCantidad(item.producto.id, 1)}
                            className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs shadow-teal-600/30"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Precio Unitario */}
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-600 text-xs">
                        ${item.precioUnitario.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Subtotal del Renglón */}
                      <td className="py-3 px-4 text-right font-mono font-black text-teal-800 text-sm">
                        ${item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Botón eliminar */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => controlador.eliminarItem(item.producto.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Eliminar artículo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================================
          COLUMNA DERECHA: LIQUIDACIÓN, TOTAL GIGANTE, MEDIOS DE PAGO Y VUELTO
          ===================================================================== */}
      <div className="w-full lg:w-[410px] flex flex-col gap-4 shrink-0 min-h-0">
        
        {/* ===================================================================
            DISPLAY HERO PRINCIPAL: TOTAL GIGANTE EN GRADIENTE SAAS MODERNO
            =================================================================== */}
        <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-5 shadow-xl shadow-teal-950/20 border border-teal-800/40 relative overflow-hidden shrink-0">
          {/* Luz difusa decorativa */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between text-teal-300 font-mono text-xs uppercase tracking-wider mb-1 font-bold">
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-teal-400" />
              TOTAL A COBRAR
            </span>
            <span className="text-teal-400/80 font-mono">ARS ($)</span>
          </div>

          <div className="font-mono text-4xl sm:text-5xl font-black text-white tracking-tight text-right drop-shadow-md py-1">
            ${(controlador.calculosFinancieros?.total ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800/90 text-xs font-mono">
            <span className="text-slate-400">Artículos: <strong className="text-white">{controlador.calculosFinancieros?.cantidadTotalArticulos ?? 0}</strong></span>
            <span className="text-teal-300/80 font-medium">IVA incluido (21%)</span>
          </div>
        </div>

        {/* Contenedor scrolleable: selector de cliente, medios de pago, vuelto y botón cobrar */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 min-h-0 pb-1">

        {/* ===================================================================
            SELECTOR DE CLIENTE & CUENTA CORRIENTE
            =================================================================== */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-lg shadow-teal-900/5 space-y-2 shrink-0">
          <label className="text-slate-700 font-sans text-xs font-bold uppercase tracking-wider block">
            Cliente / Destinatario:
          </label>
          <select
            id="pos-select-cliente"
            value={controlador.clienteSeleccionado?.id ?? ''}
            onChange={(e) => {
              const cli = controlador.clientes.find(c => c.id === e.target.value);
              if (cli) controlador.setClienteSeleccionado(cli);
            }}
            className="w-full bg-slate-50 text-slate-800 border border-slate-200/90 rounded-xl p-3 text-xs font-bold font-sans outline-hidden focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all cursor-pointer shadow-2xs"
          >
            {controlador.clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.tipo}) {c.saldoCuentaCorriente < 0 ? `â€¢ Deuda: $${Math.abs(c.saldoCuentaCorriente)}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* ===================================================================
            MEDIOS DE PAGO (BOTONES TÃCTILES RÃPIDOS)
            =================================================================== */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-lg shadow-teal-900/5 space-y-3 shrink-0">
          <span className="text-slate-700 font-sans text-xs font-bold uppercase tracking-wider block">
            Forma de Pago:
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs font-sans font-bold">
            {[
              { id: 'EFECTIVO' as MetodoPago, label: 'Efectivo', icon: Banknote },
              { id: 'DEBITO' as MetodoPago, label: 'Débito', icon: CreditCard },
              { id: 'CREDITO' as MetodoPago, label: 'Crédito', icon: CreditCard },
              { id: 'TRANSFERENCIA_QR' as MetodoPago, label: 'QR / Transf.', icon: QrCode }].map((pago) => {
              const Icono = pago.icon;
              const esSeleccionado = controlador.metodoPago === pago.id;
              return (
                <button
                  key={pago.id}
                  type="button"
                  onClick={() => controlador.setMetodoPago(pago.id)}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
                    ''
                  } ${
                    esSeleccionado
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-transparent shadow-md shadow-teal-600/25 font-black'
                      : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:border-teal-300 hover:bg-teal-50/40 hover:text-teal-900 shadow-2xs'
                  }`}
                >
                  <Icono className="h-4 w-4 shrink-0" />
                  <span className="truncate">{pago.label}</span>
                </button>
              );
            })}
          </div>

          {/* INGRESO DE MONTO DESTACADO */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <label className="text-slate-700 font-sans text-xs font-bold uppercase tracking-wider block mb-2">
              Monto que entrega el cliente ($):
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono text-xl">$</span>
              <input
                type="number"
                value={montoAbonado}
                onChange={(e) => setMontoAbonado(e.target.value ? Number(e.target.value) : '')}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-300 rounded-xl text-right font-mono font-black text-slate-900 text-2xl outline-hidden focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 shadow-inner transition-all"
              />
            </div>
          </div>
          
          {/* Feedback dinámico de Vuelto / Saldo a CC */}
          {montoAbonado !== '' && Number(montoAbonado) > 0 && (() => {
            const totalFact = controlador.calculosFinancieros?.total ?? 0;
            const abonado = Number(montoAbonado);
            if (abonado > totalFact) {
              return (
                <div className="mt-2 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Vuelto a entregar:</span>
                  <span className="font-mono font-black text-emerald-700 text-lg">${(abonado - totalFact).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
              );
            }
            if (abonado < totalFact && controlador.clienteSeleccionado?.tipo !== 'CONSUMIDOR_FINAL') {
              return (
                <div className="mt-2 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">A Cuenta Corriente:</span>
                  <span className="font-mono font-black text-blue-700 text-lg">${(totalFact - abonado).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
              );
            }
            return null;
          })()}

          {/* Mostrar error si lo hay */}
          {errorCobro && (
            <div className="mt-2 text-rose-600 text-xs font-bold text-center bg-rose-50 p-2 rounded-lg border border-rose-200">
              {errorCobro}
            </div>
          )}
        </div>

        {/* ===================================================================
            BOTÓN GIGANTE DE COBRO / EMITIR TICKET
            =================================================================== */}
        <button
          type="button"
          id="btn-cobrar-ticket"
          disabled={controlador.itemsCarrito.length === 0}
          onClick={() => {
            const totalFactura = controlador.calculosFinancieros?.total ?? 0;
            const abonado = montoAbonado === '' ? 0 : Number(montoAbonado);
            const cliente = controlador.clienteSeleccionado;
            const esConsumidorFinal = !cliente || cliente.tipo === 'CONSUMIDOR_FINAL';

            // REGLA 1: Consumidor Final no puede deber plata
            if (esConsumidorFinal && abonado < totalFactura) {
              setErrorCobro('Debe abonar el monto de la factura para poder emitir la factura.');
              return;
            }

            // REGLA 2: Cliente registrado asume deuda automáticamente si paga menos
            // La función procesarVenta ya envía los items, fecha y calcula el saldo negativo en CC.
            controlador.procesarVenta(cliente?.id ?? 'CONSUMIDOR_FINAL', abonado, totalFactura);
            setMontoAbonado('');
            setErrorCobro('');
          }}
          className="w-full min-h-[56px] bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-30 disabled:pointer-events-none text-white font-sans font-black text-base rounded-2xl flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg shadow-teal-600/25 hover:-translate-y-0.5 active:scale-98 tracking-wide shrink-0"
        >
          <Receipt className="h-5 w-5" />
          <span>COBRAR TICKET (F12)</span>
        </button>
        </div>{/* fin contenedor scrolleable */}
      </div>

      {/* =====================================================================
          MODAL EMERGENTE: COMPROBANTE TÉRMICO ESC/POS 80MM (SIMULADO)
          ===================================================================== */}
      {controlador.ticketEmitido && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="print:hidden bg-white text-slate-800 rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-sans font-black text-slate-900 text-base block">VENTA COMPLETADA</span>
                  <span className="text-[11px] text-slate-500">Ticket emitido con éxito</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => controlador.cerrarModalTicket()}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Simulación del papel térmico monocromático */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 font-mono text-xs space-y-2 text-slate-700 shadow-inner">
              <div className="text-center pb-2.5 border-b border-dashed border-slate-300 space-y-1">
                <p className="font-black text-slate-900 text-sm">TOKO SUPERMERCADOS</p>
                <p className="text-[11px] text-slate-500">CUIT: 30-71234567-8 â€¢ IVA RESP. INSCRIPTO</p>
                <p className="text-[11px] text-slate-600 font-bold">COMPROBANTE: {controlador.ticketEmitido.numeroTicket}</p>
                <p className="text-[10px] text-slate-400">{new Date(controlador.ticketEmitido.fechaHora).toLocaleString('es-AR')}</p>
              </div>

              <div className="py-2 space-y-1.5 max-h-48 overflow-y-auto">
                {controlador.ticketEmitido.items.map((i) => (
                  <div key={i.producto.id} className="flex justify-between">
                    <span className="truncate pr-2">{i.cantidad}x {i.producto.nombre}</span>
                    <span className="font-bold text-slate-900">${i.subtotal.toLocaleString('es-AR')}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2.5 border-t border-dashed border-slate-300">
                <div className="flex justify-between text-sm font-black text-teal-800 mb-2">
                  <span>TOTAL ARS:</span>
                  <span>${controlador.ticketEmitido.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-600 font-sans border-t border-slate-200 pt-2">
                  <div className="flex justify-between">
                    <span>Medio de Pago:</span>
                    <strong>{controlador.ticketEmitido.metodoPago.replace('_', ' ')}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Su Pago:</span>
                    <strong className="text-slate-800">${(controlador.ticketEmitido.montoAbonado ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  {(controlador.ticketEmitido.vuelto ?? 0) > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Su Vuelto:</span>
                      <strong>${controlador.ticketEmitido.vuelto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
                    </div>
                  )}
                  {(controlador.ticketEmitido.saldoAfectadoCC ?? 0) > 0 && (
                    <div className="flex justify-between text-blue-700 font-bold">
                      <span>A Cta. Corriente:</span>
                      <strong>${controlador.ticketEmitido.saldoAfectadoCC.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <span className="text-teal-700 font-bold">{controlador.ticketEmitido.estadoSync === 'PENDIENTE_SYNC' ? 'OFFLINE (EN COLA)' : 'SINCRONIZADO'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setImprimirComoFactura(false);
                    setMostrarVisorPdf(true);
                  }}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-sans font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all hover:-translate-y-0.5 active:scale-95"
                >
                  <Printer className="h-4 w-4 text-slate-500" />
                  <span>TICKET COMÚN</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setImprimirComoFactura(true);
                    setMostrarVisorPdf(true);
                  }}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-sans font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all hover:-translate-y-0.5 active:scale-95 border border-slate-200"
                >
                  <FileText className="h-4 w-4 text-teal-600" />
                  <span>FACTURA LEGAL</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => controlador.cerrarModalTicket()}
                className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-sans font-black text-xs cursor-pointer transition-all shadow-md shadow-teal-600/20 hover:-translate-y-0.5 active:scale-95"
              >
                NUEVA VENTA
              </button>
            </div>
          </div>
          
          {/* Se elimina la impresión térmica HTML legacy */}
        </div>
      )}

      {/* ===================================================================
          MODAL VISOR DE PDF
          =================================================================== */}
      {mostrarVisorPdf && controlador.ticketEmitido && (
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
              }}
              className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 bg-slate-100 rounded-b-2xl overflow-hidden border-x border-b border-white">
            <PDFViewer width="100%" height="100%" className="border-none">
              {imprimirComoFactura ? (
                <FacturaLegalPdf venta={{...controlador.ticketEmitido, tipoComprobante: 'FACTURA_AFIP'}} modoMediaHoja={modoMediaHoja} />
              ) : (
                <TicketComunPdf venta={controlador.ticketEmitido} />
              )}
            </PDFViewer>
          </div>
        </div>
      )}

      {/* ModalCobro eliminado: cobro ahora es inline en el panel derecho */}
    </div>
  );
};









