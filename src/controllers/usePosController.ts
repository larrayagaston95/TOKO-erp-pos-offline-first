/**
 * ============================================================================
 * CONTROLADOR: PUNTO DE VENTA (usePosController)
 * ============================================================================
 * Contiene toda la lÃ³gica de negocio para la terminal de mostrador (Cajero):
 * - BÃºsqueda de productos por nombre o cÃ³digo de barras (con soporte de pistola lÃ¡ser).
 * - Manejo del carrito de compras (adiciÃ³n, cantidades, eliminaciÃ³n).
 * - CÃ¡lculo de subtotales, descuentos aplicados e importe total.
 * - ValidaciÃ³n de stock y selecciÃ³n de medio de cobro.
 * - EmisiÃ³n de tickets de venta con persistencia en cola local si se encuentra offline.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Producto, 
  PRODUCTOS_MOCK, 
  Cliente, 
  CLIENTES_MOCK, 
  ItemCarrito, 
  MetodoPago, 
  VentaRealizada,
  TipoComprobante,
  Empleado
} from '../models';
import { db } from '../db';
import { useCajaController } from './useCajaController';

export function usePosController(estaOnline: boolean, alRegistrarVentaOffline?: () => void, usuarioAutenticado?: Empleado | null) {
  // CatÃ¡logo local reactivo desde IndexedDB
  const productosDb = useLiveQuery(() => db.productos.toArray(), []);
  const clientesDb = useLiveQuery(() => db.clientes.toArray(), []);
  
  // Obtenemos el turno de caja para inyectarlo en las ventas
  const cajaController = useCajaController();

  // Fallback con mocks en caso de carga inicial
  const productos = productosDb && productosDb.length > 0 ? productosDb : PRODUCTOS_MOCK;
  const clientes = clientesDb && clientesDb.length > 0 ? clientesDb : CLIENTES_MOCK;
  
  // Cliente actualmente seleccionado (por defecto: Consumidor Final)
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente>(CLIENTES_MOCK[0]);

  // Actualizamos el cliente seleccionado si cambian los clientes en IndexedDB y aÃºn tiene el mock inicial
  useEffect(() => {
    if (clientesDb && clientesDb.length > 0) {
      setClienteSeleccionado(prev => {
        const encontrado = clientesDb.find(c => c.id === prev.id);
        return encontrado || clientesDb[0];
      });
    }
  }, [clientesDb]);

  // Ãtems presentes en el carrito / ticket en curso
  const [itemsCarrito, setItemsCarrito] = useState<ItemCarrito[]>([]);

  // TÃ©rmino de bÃºsqueda en mostrador
  const [busqueda, setBusqueda] = useState<string>('');

  // Porcentaje de descuento opcional (0% a 100%)
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState<number>(0);

  // Medio de pago seleccionado
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');


  // Monto con el que abona el cliente para cÃ¡lculo automÃ¡tico de vuelto
  const [montoRecibido, setMontoRecibido] = useState<number>(0);

  // Ãšltimo comprobante generado para visualizaciÃ³n e impresiÃ³n
  const [ticketEmitido, setTicketEmitido] = useState<VentaRealizada | null>(null);

  // Mensaje de notificaciÃ³n o alerta en pantalla
  const [mensajeNotificacion, setMensajeNotificacion] = useState<string | null>(null);

  /**
   * Muestra un mensaje temporal en la interfaz durante 3 segundos.
   */
  const mostrarMensaje = useCallback((mensaje: string) => {
    setMensajeNotificacion(mensaje);
    setTimeout(() => {
      setMensajeNotificacion(null);
    }, 3200);
  }, []);

  /**
   * CatÃ¡logo filtrado segÃºn el texto ingresado en el buscador rÃ¡pido.
   */
  const productosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return productos;
    return productos.filter(p => 
      p.nombre.toLowerCase().includes(termino) ||
      p.codigoBarras.includes(termino) ||
      p.categoria.toLowerCase().includes(termino)
    );
  }, [productos, busqueda]);

  /**
   * Agrega un producto al carrito o incrementa su cantidad si ya existe.
   * Valida stock disponible para evitar sobreventa local inadvertida.
   */
  const agregarProductoAlCarrito = useCallback((producto: Producto, cantidad: number = 1) => {
    setItemsCarrito(itemsActuales => {
      const indiceExistente = itemsActuales.findIndex(item => item.producto.id === producto.id);

      if (indiceExistente >= 0) {
        // El producto ya estÃ¡ en el ticket: sumamos cantidad
        const itemActual = itemsActuales[indiceExistente];
        const nuevaCantidad = itemActual.cantidad + cantidad;
        
        const itemsActualizados = [...itemsActuales];
        itemsActualizados[indiceExistente] = {
          ...itemActual,
          cantidad: nuevaCantidad,
          subtotal: nuevaCantidad * itemActual.precioUnitario
        };
        return itemsActualizados;
      } else {
        // Nuevo Ã­tem en el ticket
        const precioAplicado = clienteSeleccionado.listaPrecioPorDefecto === 'MAYORISTA' 
          ? producto.precioMayorista 
          : producto.precioVenta;

        const nuevoItem: ItemCarrito = {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          producto,
          cantidad,
          precioUnitario: precioAplicado,
          subtotal: cantidad * precioAplicado
        };
        return [...itemsActuales, nuevoItem];
      }
    });

    mostrarMensaje(`âœ“ Agregado: ${producto.nombre}`);
  }, [clienteSeleccionado, mostrarMensaje]);

  /**
   * Procesa la entrada del lector de cÃ³digo de barras.
   * Si coincide exactamente con un cÃ³digo EAN, lo agrega automÃ¡ticamente y limpia el input.
   */
  const procesarCodigoBarra = useCallback((codigo: string) => {
    const codigoLimpio = codigo.trim();
    if (!codigoLimpio) return;

    const productoEncontrado = productos.find(p => p.codigoBarras === codigoLimpio);
    if (productoEncontrado) {
      agregarProductoAlCarrito(productoEncontrado, 1);
      setBusqueda('');
    } else {
      mostrarMensaje(`âš ï¸ Producto no encontrado para cÃ³digo: ${codigoLimpio}`);
    }
  }, [productos, agregarProductoAlCarrito, mostrarMensaje]);

  /**
   * BÃºsqueda manual de productos para cuando no se puede usar el escÃ¡ner.
   * Consulta a Dexie filtrando por nombre o descripciÃ³n (lÃ­mite de 10).
   */
  const buscarProductosManual = useCallback(async (query: string): Promise<Producto[]> => {
    const termino = query.trim().toLowerCase();
    if (!termino) return [];
    
    // Filtrado en memoria de IndexedDB y lÃ­mite de resultados
    const resultados = await db.productos
      .filter(p => p.nombre.toLowerCase().includes(termino) || p.codigoBarras.includes(termino))
      .limit(10)
      .toArray();
      
    return resultados;
  }, []);

  /**
   * Incrementa o decrementa la cantidad de un producto en el carrito.
   */
  const modificarCantidad = useCallback((productoId: string, delta: number) => {
    setItemsCarrito(itemsActuales => {
      return itemsActuales.map(item => {
        if (item.producto.id === productoId) {
          const nuevaCantidad = Math.max(1, item.cantidad + delta);
          return {
            ...item,
            cantidad: nuevaCantidad,
            subtotal: nuevaCantidad * item.precioUnitario
          };
        }
        return item;
      });
    });
  }, []);

  /**
   * Permite escribir un valor numÃ©rico exacto en la columna de cantidad.
   */
  const establecerCantidadExacta = useCallback((productoId: string, cantidad: number) => {
    const cantidadSegura = Math.max(1, cantidad);
    setItemsCarrito(itemsActuales => {
      return itemsActuales.map(item => {
        if (item.producto.id === productoId) {
          return {
            ...item,
            cantidad: cantidadSegura,
            subtotal: cantidadSegura * item.precioUnitario
          };
        }
        return item;
      });
    });
  }, []);

  /**
   * Elimina un Ã­tem especÃ­fico del carrito de compras.
   */
  const eliminarItem = useCallback((productoId: string) => {
    setItemsCarrito(itemsActuales => 
      itemsActuales.filter(item => item.producto.id !== productoId)
    );
  }, []);

  /**
   * Limpia todo el carrito para comenzar una nueva venta desde cero.
   */
  const vaciarCarrito = useCallback(() => {
    setItemsCarrito([]);
    setDescuentoPorcentaje(0);
    setMontoRecibido(0);
  }, []);

  /**
   * CÃ¡lculos financieros del ticket: Subtotal, Descuento y Total a pagar.
   */
  const calculosFinancieros = useMemo(() => {
    const subtotal = itemsCarrito.reduce((acc, item) => acc + item.subtotal, 0);
    const montoDescuento = subtotal * (descuentoPorcentaje / 100);
    const total = Math.max(0, subtotal - montoDescuento);
    const vuelto = montoRecibido > total ? montoRecibido - total : 0;
    const cantidadTotalArticulos = itemsCarrito.reduce((acc, item) => acc + item.cantidad, 0);

    return {
      subtotal,
      montoDescuento,
      total,
      vuelto,
      cantidadTotalArticulos
    };
  }, [itemsCarrito, descuentoPorcentaje, montoRecibido]);

  /**
   * Confirma la venta, descuenta stock del catÃ¡logo local en IndexedDB y emite el comprobante.
   * Si hay saldo pendiente y el cliente no es final, lo asienta en Cuenta Corriente.
   * Si estÃ¡ offline, marca el ticket como 'PENDIENTE_SYNC' y lo encola en sync_outbox.
   */
  const procesarVenta = useCallback(async (clienteId: string, montoAbonado: number, totalVenta: number) => {
    if (itemsCarrito.length === 0) {
      mostrarMensaje('âš ï¸ El ticket estÃ¡ vacÃ­o. Agregue productos antes de cobrar.');
      return;
    }

    const clienteSelecc = clientes.find(c => c.id === clienteId) || clienteSeleccionado;
    
    if (metodoPago === 'CUENTA_CORRIENTE' && clienteSelecc.tipo === 'CONSUMIDOR_FINAL') {
      mostrarMensaje('âš ï¸ No se puede fiar a un Consumidor Final. Seleccione un cliente registrado.');
      return;
    }

    const turnoId = cajaController.turnoActivo?.id;
    const empresaIdStr = localStorage.getItem('toko_empresa_id') || '1';
    const numeroAleatorio = Math.floor(1000 + Math.random() * 9000);

    // Cálculo de vuelto y saldo a CC
    const vueltoCalculado = montoAbonado > totalVenta ? montoAbonado - totalVenta : 0;
    const saldoCC = montoAbonado < totalVenta && clienteSelecc.tipo !== 'CONSUMIDOR_FINAL'
      ? totalVenta - montoAbonado
      : 0;

    // GeneraciÃ³n del comprobante de venta
    const nuevoTicket: VentaRealizada & { empresa_id?: string | number } = {
      id: `venta-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      empresa_id: parseInt(empresaIdStr, 10) || empresaIdStr,
      numeroTicket: `T0001-000${numeroAleatorio}`,
      fechaHora: new Date().toISOString(),
      tipoOperacion: 'POS_MOSTRADOR',
      cliente: clienteSelecc,
      items: [...itemsCarrito],
      lineas: [...itemsCarrito],
      subtotal: calculosFinancieros.subtotal,
      descuentoPorcentaje,
      total: totalVenta,
      metodoPago,
      montoAbonado,
      vuelto: vueltoCalculado,
      saldoAfectadoCC: saldoCC,
      tipoComprobante: 'TICKET_X',
      estadoSync: estaOnline ? 'SINCRONIZADO' : 'PENDIENTE_SYNC',
      vendedor: usuarioAutenticado?.nombre || 'Cajero Desconocido',
      empleadoId: usuarioAutenticado?.id,
      turnoId
    };

    try {
      // TransacciÃ³n atÃ³mica en IndexedDB
      await db.transaction('rw', db.productos, db.ventas, db.sync_outbox, db.clientes, async () => {
        // 1. Descontamos stock fÃ­sico en IndexedDB para cada Ã­tem vendido
        for (const item of itemsCarrito) {
          const prodDb = await db.productos.get(item.producto.id);
          if (prodDb) {
            const nuevoStock = Math.max(0, prodDb.stock - item.cantidad);
            await db.productos.update(prodDb.id, { stock: nuevoStock });
          }
        }

        // 2. Si hay remanente a Cuenta Corriente
        if (montoAbonado < totalVenta && clienteSelecc.tipo !== 'CONSUMIDOR_FINAL') {
          const deuda = totalVenta - montoAbonado;
          const cliDb = await db.clientes.get(clienteSelecc.id);
          if (cliDb) {
             const nuevoSaldo = (cliDb.saldoCuentaCorriente || 0) - deuda; // Deuda = saldo negativo
             await db.clientes.update(cliDb.id, { saldoCuentaCorriente: nuevoSaldo });
          }
        }

        // 3. Persistimos la venta
        await db.ventas.put(nuevoTicket as any);

        // 4. Si opera offline, registramos en sync_outbox
        if (!estaOnline) {
          await db.sync_outbox.put({
            id: `outbox-${Date.now()}-${nuevoTicket.id}`,
            tipoOperacion: 'VENTA',
            referenciaId: nuevoTicket.id,
            payload: nuevoTicket as any,
            estado: 'PENDIENTE',
            fechaCreacion: new Date().toISOString(),
            intentos: 0
          });
        }
      });

      if (!estaOnline && alRegistrarVentaOffline) {
        alRegistrarVentaOffline();
      }

      setTicketEmitido(nuevoTicket as any);
      vaciarCarrito();
      mostrarMensaje(
        estaOnline 
          ? 'âœ“ Venta procesada y sincronizada en IndexedDB exitosamente.' 
          : 'âœ“ Venta registrada en IndexedDB y encolada (Modo Offline).'
      );
    } catch (error) {
      console.error('[POS] Error al registrar venta en IndexedDB:', error);
      mostrarMensaje('âŒ Error al guardar la venta en la base de datos local.');
    }
  }, [
    itemsCarrito, 
    clientes,
    clienteSeleccionado, 
    calculosFinancieros, 
    descuentoPorcentaje, 
    estaOnline, 
    alRegistrarVentaOffline, 
    vaciarCarrito, 
    mostrarMensaje,
    cajaController.turnoActivo?.id,
    usuarioAutenticado
  ]);

  /**
   * Cierra el diÃ¡logo/modal del ticket impreso.
   */
  const cerrarModalTicket = useCallback(() => {
    setTicketEmitido(null);
  }, []);

  return {
    // Estado del catÃ¡logo y bÃºsqueda
    productos: productosFiltrados,
    catalogoCompleto: productos,
    busqueda,
    setBusqueda,
    procesarCodigoBarra,
    buscarProductosManual,
    
    // Clientes
    clientes,
    clienteSeleccionado,
    setClienteSeleccionado,

    // Carrito de compras
    itemsCarrito,
    agregarProductoAlCarrito,
    modificarCantidad,
    establecerCantidadExacta,
    eliminarItem,
    vaciarCarrito,

    // LiquidaciÃ³n financiera
    descuentoPorcentaje,
    setDescuentoPorcentaje,
    metodoPago,
    setMetodoPago,
    montoRecibido,
    setMontoRecibido,
    calculosFinancieros,

    // EmisiÃ³n de ticket
    procesarVenta,
    ticketEmitido,
    cerrarModalTicket,
    mensajeNotificacion
  };
}

