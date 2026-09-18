/**
 * ============================================================================
 * CONTROLADOR: PREVENTA MÓVIL EN LA CALLE (usePreventaController)
 * ============================================================================
 * Administra la lógica de negocio para los vendedores en ruta:
 * - Selección de cliente según itinerario / ruta del día.
 * - Aplicación automática de listas de precio mayoristas / distribuidor.
 * - Filtro dinámico de productos por categoría y búsqueda textual.
 * - Gestión de cantidades solicitadas en el pedido móvil.
 * - Control de límite de crédito y saldo de cuenta corriente del cliente.
 * - Cierre y confirmación de pedidos con persistencia offline en el celular.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Producto, 
  PRODUCTOS_MOCK, 
  Cliente, 
  CLIENTES_MOCK, 
  ItemCarrito, 
  CategoriaProducto, 
  VentaRealizada 
} from '../models';
import { db } from '../db';

export function usePreventaController(estaOnline: boolean, alRegistrarPedidoOffline?: () => void) {
  // Catálogo reactivo desde IndexedDB
  const productosDb = useLiveQuery(() => db.productos.toArray(), []);
  const clientesDb = useLiveQuery(() => db.clientes.toArray(), []);

  // Fallbacks con mocks para carga inicial
  const productos = productosDb && productosDb.length > 0 ? productosDb : PRODUCTOS_MOCK;
  const clientes = clientesDb && clientesDb.length > 0 ? clientesDb : CLIENTES_MOCK;

  // Clientes asignados a la ruta comercial (excluye consumidor final)
  const clientesRuta = useMemo(() => {
    const filtrados = clientes.filter(c => c.tipo !== 'CONSUMIDOR_FINAL');
    return filtrados.length > 0 ? filtrados : CLIENTES_MOCK.filter(c => c.tipo !== 'CONSUMIDOR_FINAL');
  }, [clientes]);
  
  // Cliente actual que está siendo visitado en el local
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente>(
    clientesRuta[0] || CLIENTES_MOCK[1]
  );

  // Mantener sincronizado el cliente seleccionado cuando se actualiza la cartera en IndexedDB
  useEffect(() => {
    if (clientesRuta.length > 0) {
      setClienteSeleccionado(prev => {
        const encontrado = clientesRuta.find(c => c.id === prev.id);
        return encontrado || clientesRuta[0];
      });
    }
  }, [clientesRuta]);

  // Filtro de categoría activa
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaProducto | 'TODAS'>('TODAS');

  // Filtro por texto de búsqueda
  const [busquedaTexto, setBusquedaTexto] = useState<string>('');

  // Carrito de preventa en curso
  const [carritoPreventa, setCarritoPreventa] = useState<ItemCarrito[]>([]);

  // Control visual del panel/modal del carrito en el móvil
  const [mostrarModalCarrito, setMostrarModalCarrito] = useState<boolean>(false);

  // Comprobante de pedido emitido para confirmación
  const [pedidoConfirmado, setPedidoConfirmado] = useState<VentaRealizada | null>(null);

  // Mensajes de feedback rápido al preventista
  const [notificacion, setNotificacion] = useState<string | null>(null);

  /**
   * Muestra una notificación visual en el celular.
   */
  const mostrarNotificacion = useCallback((mensaje: string) => {
    setNotificacion(mensaje);
    setTimeout(() => {
      setNotificacion(null);
    }, 2800);
  }, []);

  /**
   * Filtra los productos según la categoría seleccionada y el texto de búsqueda.
   */
  const productosFiltrados = useMemo(() => {
    return productos.filter(producto => {
      const coincideCategoria = categoriaSeleccionada === 'TODAS' || producto.categoria === categoriaSeleccionada;
      const coincideTexto = busquedaTexto === '' || 
        producto.nombre.toLowerCase().includes(busquedaTexto.toLowerCase()) ||
        producto.codigoBarras.includes(busquedaTexto);
      return coincideCategoria && coincideTexto;
    });
  }, [productos, categoriaSeleccionada, busquedaTexto]);

  /**
   * Agrega una unidad de un producto al carrito móvil usando precio mayorista.
   */
  const agregarAlCarrito = useCallback((producto: Producto) => {
    setCarritoPreventa(actual => {
      const indice = actual.findIndex(item => item.producto.id === producto.id);
      const precioUnitario = producto.precioMayorista; // Precio preferencial para calle

      if (indice >= 0) {
        const itemActual = actual[indice];
        const nuevaCantidad = itemActual.cantidad + 1;
        const actualizados = [...actual];
        actualizados[indice] = {
          ...itemActual,
          cantidad: nuevaCantidad,
          subtotal: nuevaCantidad * precioUnitario
        };
        return actualizados;
      } else {
        const nuevo: ItemCarrito = {
          id: `item-movil-${Date.now()}-${producto.id}`,
          producto,
          cantidad: 1,
          precioUnitario,
          subtotal: precioUnitario
        };
        return [...actual, nuevo];
      }
    });

    mostrarNotificacion(`+1 ${producto.nombre}`);
  }, [mostrarNotificacion]);

  /**
   * Modifica la cantidad de un producto (+1 o -1). Si llega a 0, se remueve.
   */
  const modificarCantidad = useCallback((productoId: string, delta: number) => {
    setCarritoPreventa(actual => {
      return actual
        .map(item => {
          if (item.producto.id === productoId) {
            const nuevaCantidad = item.cantidad + delta;
            return {
              ...item,
              cantidad: nuevaCantidad,
              subtotal: nuevaCantidad * item.precioUnitario
            };
          }
          return item;
        })
        .filter(item => item.cantidad > 0);
    });
  }, []);

  /**
   * Elimina completamente un producto del carrito móvil.
   */
  const removerDelCarrito = useCallback((productoId: string) => {
    setCarritoPreventa(actual => actual.filter(i => i.producto.id !== productoId));
  }, []);

  /**
   * Vacía el carrito del preventista.
   */
  const vaciarCarrito = useCallback(() => {
    setCarritoPreventa([]);
  }, []);

  /**
   * Cálculos de totales del pedido del vendedor.
   */
  const totales = useMemo(() => {
    const subtotal = carritoPreventa.reduce((acc, item) => acc + item.subtotal, 0);
    const totalUnidades = carritoPreventa.reduce((acc, item) => acc + item.cantidad, 0);
    const itemsDiferentes = carritoPreventa.length;
    
    // Verificamos si supera el límite de crédito del cliente
    const creditoDisponible = clienteSeleccionado.limiteCredito - Math.abs(clienteSeleccionado.saldoCuentaCorriente);
    const excedeCredito = subtotal > creditoDisponible && clienteSeleccionado.limiteCredito > 0;

    return {
      subtotal,
      total: subtotal,
      totalUnidades,
      itemsDiferentes,
      creditoDisponible,
      excedeCredito
    };
  }, [carritoPreventa, clienteSeleccionado]);

  /**
   * Confirma y emite el pedido en el dispositivo del preventista, guardándolo en IndexedDB.
   * Si está offline, lo encola en sync_outbox con estado PENDIENTE.
   */
  const cerrarYConfirmarPedido = useCallback(async () => {
    if (carritoPreventa.length === 0) {
      mostrarNotificacion('El carrito está vacío. Agregue artículos antes de enviar.');
      return;
    }

    const numeroComprobante = Math.floor(10000 + Math.random() * 90000);
    const nuevoPedido: VentaRealizada = {
      id: `pedido-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      numeroTicket: `PV-${numeroComprobante}`,
      fechaHora: new Date().toISOString(),
      tipoOperacion: 'PREVENTA_CALLE',
      tipoComprobante: 'TICKET_X',
      cliente: clienteSeleccionado,
      items: [...carritoPreventa],
      subtotal: totales.subtotal,
      descuentoPorcentaje: 0,
      total: totales.total,
      metodoPago: 'CUENTA_CORRIENTE',
      estadoSync: estaOnline ? 'SINCRONIZADO' : 'PENDIENTE_SYNC',
      vendedor: 'Preventista en Ruta 01'
    };

    try {
      // Guardar en base de datos local Dexie
      await db.transaction('rw', db.ventas, db.sync_outbox, async () => {
        // Guardamos la transacción en 'ventas'
        await db.ventas.put(nuevoPedido);

        // Si opera offline, registramos en sync_outbox con estado PENDIENTE
        if (!estaOnline) {
          await db.sync_outbox.put({
            id: `outbox-${Date.now()}-${nuevoPedido.id}`,
            tipoOperacion: 'PEDIDO_PREVENTA',
            referenciaId: nuevoPedido.id,
            payload: nuevoPedido,
            estado: 'PENDIENTE',
            fechaCreacion: new Date().toISOString(),
            intentos: 0
          });
        }
      });

      if (!estaOnline && alRegistrarPedidoOffline) {
        alRegistrarPedidoOffline();
      }

      setPedidoConfirmado(nuevoPedido);
      setMostrarModalCarrito(false);
      vaciarCarrito();

      mostrarNotificacion(
        estaOnline 
          ? '✓ Pedido de preventa enviado y guardado en IndexedDB.' 
          : '✓ Pedido guardado en IndexedDB y encolado en sync_outbox (Modo Offline).'
      );
    } catch (error) {
      console.error('[Preventa] Error al guardar pedido en IndexedDB:', error);
      mostrarNotificacion('❌ Error al guardar el pedido en la base local.');
    }
  }, [
    carritoPreventa, 
    clienteSeleccionado, 
    totales, 
    estaOnline, 
    alRegistrarPedidoOffline, 
    vaciarCarrito, 
    mostrarNotificacion
  ]);

  /**
   * Cierra el comprobante de pedido.
   */
  const cerrarModalConfirmacion = useCallback(() => {
    setPedidoConfirmado(null);
  }, []);

  return {
    // Catálogo y filtros
    productos: productosFiltrados,
    categoriaSeleccionada,
    setCategoriaSeleccionada,
    busquedaTexto,
    setBusquedaTexto,

    // Cliente en visita
    clientesRuta,
    clienteSeleccionado,
    setClienteSeleccionado,

    // Carrito de preventa
    carritoPreventa,
    agregarAlCarrito,
    modificarCantidad,
    removerDelCarrito,
    vaciarCarrito,
    totales,

    // Modales y control de UI
    mostrarModalCarrito,
    setMostrarModalCarrito,
    cerrarYConfirmarPedido,
    pedidoConfirmado,
    cerrarModalConfirmacion,
    notificacion
  };
}
