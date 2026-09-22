/**
 * ============================================================================
 * CONTROLADOR: PUNTO DE VENTA (usePosController)
 * ============================================================================
 * Contiene toda la lógica de negocio para la terminal de mostrador (Cajero):
 * - Búsqueda de productos por nombre o código de barras (con soporte de pistola láser).
 * - Manejo del carrito de compras (adición, cantidades, eliminación).
 * - Cálculo de subtotales, descuentos aplicados e importe total.
 * - Validación de stock y selección de medio de cobro.
 * - Emisión de tickets de venta con persistencia en cola local si se encuentra offline.
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
  // Catálogo local reactivo desde IndexedDB
  const productosDb = useLiveQuery(() => db.productos.toArray(), []);
  const clientesDb = useLiveQuery(() => db.clientes.toArray(), []);
  
  // Obtenemos el turno de caja para inyectarlo en las ventas
  const cajaController = useCajaController();

  // Fallback con mocks en caso de carga inicial
  const productos = productosDb && productosDb.length > 0 ? productosDb : PRODUCTOS_MOCK;
  const clientes = clientesDb && clientesDb.length > 0 ? clientesDb : CLIENTES_MOCK;
  
  // Cliente actualmente seleccionado (por defecto: Consumidor Final)
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente>(CLIENTES_MOCK[0]);

  // Actualizamos el cliente seleccionado si cambian los clientes en IndexedDB y aún tiene el mock inicial
  useEffect(() => {
    if (clientesDb && clientesDb.length > 0) {
      setClienteSeleccionado(prev => {
        const encontrado = clientesDb.find(c => c.id === prev.id);
        return encontrado || clientesDb[0];
      });
    }
  }, [clientesDb]);

  // Ítems presentes en el carrito / ticket en curso
  const [itemsCarrito, setItemsCarrito] = useState<ItemCarrito[]>([]);

  // Término de búsqueda en mostrador
  const [busqueda, setBusqueda] = useState<string>('');

  // Porcentaje de descuento opcional (0% a 100%)
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState<number>(0);

  // Medio de pago seleccionado
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');


  // Monto con el que abona el cliente para cálculo automático de vuelto
  const [montoRecibido, setMontoRecibido] = useState<number>(0);

  // Último comprobante generado para visualización e impresión
  const [ticketEmitido, setTicketEmitido] = useState<VentaRealizada | null>(null);

  // Mensaje de notificación o alerta en pantalla
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
   * Catálogo filtrado según el texto ingresado en el buscador rápido.
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
        // El producto ya está en el ticket: sumamos cantidad
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
        // Nuevo ítem en el ticket
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

    mostrarMensaje(`✓ Agregado: ${producto.nombre}`);
  }, [clienteSeleccionado, mostrarMensaje]);

  /**
   * Procesa la entrada del lector de código de barras.
   * Si coincide exactamente con un código EAN, lo agrega automáticamente y limpia el input.
   */
  const procesarCodigoBarra = useCallback((codigo: string) => {
    const codigoLimpio = codigo.trim();
    if (!codigoLimpio) return;

    const productoEncontrado = productos.find(p => p.codigoBarras === codigoLimpio);
    if (productoEncontrado) {
      agregarProductoAlCarrito(productoEncontrado, 1);
      setBusqueda('');
    } else {
      mostrarMensaje(`⚠️ Producto no encontrado para código: ${codigoLimpio}`);
    }
  }, [productos, agregarProductoAlCarrito, mostrarMensaje]);

  /**
   * Búsqueda manual de productos para cuando no se puede usar el escáner.
   * Consulta a Dexie filtrando por nombre o descripción (límite de 10).
   */
  const buscarProductosManual = useCallback(async (query: string): Promise<Producto[]> => {
    const termino = query.trim().toLowerCase();
    if (!termino) return [];
    
    // Filtrado en memoria de IndexedDB y límite de resultados
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
   * Permite escribir un valor numérico exacto en la columna de cantidad.
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
   * Elimina un ítem específico del carrito de compras.
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
   * Cálculos financieros del ticket: Subtotal, Descuento y Total a pagar.
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
   * Confirma la venta, descuenta stock del catálogo local en IndexedDB y emite el comprobante.
   * Si está offline, marca el ticket como 'PENDIENTE_SYNC' y lo encola en sync_outbox.
   */
  const cobrarYEmitirTicket = useCallback(async () => {
    if (itemsCarrito.length === 0) {
      mostrarMensaje('⚠️ El ticket está vacío. Agregue productos antes de cobrar.');
      return;
    }

    if (metodoPago === 'CUENTA_CORRIENTE' && clienteSeleccionado.tipo === 'CONSUMIDOR_FINAL') {
      mostrarMensaje('⚠️ No se puede fiar a un Consumidor Final. Seleccione un cliente registrado.');
      return;
    }

    const turnoId = cajaController.turnoActivo?.id;

    // Generación del comprobante de venta
    const numeroAleatorio = Math.floor(1000 + Math.random() * 9000);
    const nuevoTicket: VentaRealizada = {
      id: `venta-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      numeroTicket: `T0001-000${numeroAleatorio}`,
      fechaHora: new Date().toISOString(),
      tipoOperacion: 'POS_MOSTRADOR',
      cliente: clienteSeleccionado,
      items: [...itemsCarrito],
      subtotal: calculosFinancieros.subtotal,
      descuentoPorcentaje,
      total: calculosFinancieros.total,
      metodoPago,
      tipoComprobante: 'TICKET_X',
      estadoSync: estaOnline ? 'SINCRONIZADO' : 'PENDIENTE_SYNC',
      vendedor: usuarioAutenticado?.nombre || 'Cajero Desconocido',
      empleadoId: usuarioAutenticado?.id,
      turnoId
    };

    try {
      // Transacción atómica en IndexedDB: Descuento de stock + Registro de venta + Cola offline
      await db.transaction('rw', db.productos, db.ventas, db.sync_outbox, async () => {
        // Descontamos stock físico en IndexedDB para cada ítem vendido
        for (const item of itemsCarrito) {
          const prodDb = await db.productos.get(item.producto.id);
          if (prodDb) {
            const nuevoStock = Math.max(0, prodDb.stock - item.cantidad);
            await db.productos.update(prodDb.id, { stock: nuevoStock });
          }
        }

        // Persistimos la venta en la tabla 'ventas' de Dexie
        await db.ventas.put(nuevoTicket);

        // Si opera offline, registramos en sync_outbox con estado PENDIENTE
        if (!estaOnline) {
          await db.sync_outbox.put({
            id: `outbox-${Date.now()}-${nuevoTicket.id}`,
            tipoOperacion: 'VENTA',
            referenciaId: nuevoTicket.id,
            payload: nuevoTicket,
            estado: 'PENDIENTE',
            fechaCreacion: new Date().toISOString(),
            intentos: 0
          });
        }
      });

      // Si opera sin conexión, notificamos al controlador de sincronización
      if (!estaOnline && alRegistrarVentaOffline) {
        alRegistrarVentaOffline();
      }

      // Abrimos el modal con el comprobante generado
      setTicketEmitido(nuevoTicket);

      // Reiniciamos el mostrador para el siguiente cliente
      vaciarCarrito();
      mostrarMensaje(
        estaOnline 
          ? '✓ Venta procesada y sincronizada en IndexedDB exitosamente.' 
          : '✓ Venta registrada en IndexedDB y encolada en sync_outbox (Modo Offline).'
      );
    } catch (error) {
      console.error('[POS] Error al registrar venta en IndexedDB:', error);
      mostrarMensaje('❌ Error al guardar la venta en la base de datos local.');
    }
  }, [
    itemsCarrito, 
    clienteSeleccionado, 
    calculosFinancieros, 
    descuentoPorcentaje, 
    metodoPago, 
    estaOnline, 
    alRegistrarVentaOffline, 
    vaciarCarrito, 
    mostrarMensaje,
    cajaController.turnoActivo?.id,
    usuarioAutenticado
  ]);

  /**
   * Cierra el diálogo/modal del ticket impreso.
   */
  const cerrarModalTicket = useCallback(() => {
    setTicketEmitido(null);
  }, []);

  return {
    // Estado del catálogo y búsqueda
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

    // Liquidación financiera
    descuentoPorcentaje,
    setDescuentoPorcentaje,
    metodoPago,
    setMetodoPago,
    montoRecibido,
    setMontoRecibido,
    calculosFinancieros,

    // Emisión de ticket
    cobrarYEmitirTicket,
    ticketEmitido,
    cerrarModalTicket,
    mensajeNotificacion
  };
}
