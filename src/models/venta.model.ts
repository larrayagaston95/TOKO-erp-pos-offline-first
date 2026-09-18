/**
 * ============================================================================
 * MODELO: VENTA, CARRITO Y TICKET
 * ============================================================================
 * Estructuras de datos para transacciones comerciales en mostrador y preventa.
 */

import { Producto } from './producto.model';
import { Cliente } from './cliente.model';

/**
 * Representa una línea o ítem dentro del carrito de compras o ticket.
 */
export interface ItemCarrito {
  id: string;               // Identificador de la línea
  producto: Producto;       // Producto seleccionado
  cantidad: number;         // Cantidad vendida
  precioUnitario: number;   // Precio aplicado según lista (mostrador o mayorista)
  subtotal: number;         // cantidad * precioUnitario
}

/**
 * Métodos de cobro soportados por el Punto de Venta.
 */
export type MetodoPago = 
  | 'EFECTIVO' 
  | 'DEBITO' 
  | 'CREDITO' 
  | 'TRANSFERENCIA_QR' 
  | 'CUENTA_CORRIENTE';

/**
 * Estado de sincronización para operaciones offline-first.
 */
export type EstadoSincronizacion = 'PENDIENTE_SYNC' | 'SINCRONIZADO';

/**
 * Tipos de comprobante soportados
 */
export type TipoComprobante = 'TICKET_X' | 'FACTURA_AFIP';

/**
 * Registro de venta completada y emitida.
 */
export interface VentaRealizada {
  id: string;                         // UUID de la transacción
  numeroTicket: string;               // Numeración correlativa (ej: T0001-000123)
  fechaHora: string;                  // Fecha y hora en formato ISO
  tipoOperacion: 'POS_MOSTRADOR' | 'PREVENTA_CALLE';
  tipoComprobante: TipoComprobante;   // TICKET_X o FACTURA_AFIP
  cliente: Cliente;                   // Cliente receptor
  items: ItemCarrito[];               // Detalle de los artículos
  subtotal: number;                   // Sumatoria antes de descuentos
  descuentoPorcentaje: number;        // Porcentaje de descuento aplicado
  total: number;                      // Total final abonado o adeudado
  metodoPago: MetodoPago;             // Medio de pago seleccionado
  estadoSync: EstadoSincronizacion;   // Estado de sincronización en cola local
  vendedor: string;                   // Nombre del cajero o preventista responsable
}

/**
 * Representa un movimiento de retiro o ingreso de efectivo en la caja.
 */
export interface MovimientoCaja {
  id: string;
  fechaHora: string;
  tipo: 'INGRESO' | 'RETIRO';
  monto: number;
  concepto: string;
  usuario: string;
}
