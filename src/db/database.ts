/**
 * ============================================================================
 * BASE DE DATOS LOCAL OFFLINE-FIRST (Dexie.js / IndexedDB)
 * ============================================================================
 * Instancia central de Dexie para almacenamiento local en el navegador del
 * cajero y preventista móvil.
 * 
 * Tablas requeridas:
 * - productos: Catálogo de artículos con precios, stock y códigos de barra.
 * - clientes: Cartera con límites crediticios y listas asignadas.
 * - ventas: Historial persistido de tickets de mostrador y pedidos en calle.
 * - sync_outbox: Cola de transacciones registradas offline (Outbox Pattern).
 */

import Dexie, { Table } from 'dexie';
import { Producto, PRODUCTOS_MOCK, Cliente, CLIENTES_MOCK, VentaRealizada, MovimientoCaja, PagoCuentaCorriente, TurnoCaja, Empleado, EMPLEADOS_MOCK } from '../models';

/**
 * Estructura de cada elemento en la cola de sincronización Outbox
 */
export interface SyncOutboxItem {
  id: string;                                          // Identificador único del mensaje
  tipoOperacion: 'VENTA' | 'PEDIDO_PREVENTA';          // Tipo de transacción
  referenciaId: string;                                // ID de la venta en la tabla 'ventas'
  payload: VentaRealizada;                             // Contenido completo para enviar al backend Spring Boot
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'SINCRONIZADO' | 'FALLIDO'; // Estado en la cola
  fechaCreacion: string;                               // ISO Timestamp de registro
  intentos: number;                                    // Contador de reintentos
  ultimoError?: string;                                // Mensaje de falla de red si la hubiere
}

/**
 * Clase principal de Dexie para OmniPOS
 */
export class OmniPosDatabase extends Dexie {
  productos!: Table<Producto, string>;
  clientes!: Table<Cliente, string>;
  ventas!: Table<VentaRealizada, string>;
  sync_outbox!: Table<SyncOutboxItem, string>;
  movimientos_caja!: Table<MovimientoCaja, string>;
  pagos_cc!: Table<PagoCuentaCorriente, string>;
  turnos_caja!: Table<TurnoCaja, string>;
  empleados!: Table<Empleado, string>;

  constructor() {
    super('OmniPosDB');
    
    // Versión 4: Schema anterior (sin turnos)
    this.version(4).stores({
      productos: 'id, codigoBarras, categoria, nombre',
      clientes: 'id, codigo, nombre, tipo, zonaRuta',
      ventas: 'id, numeroTicket, fechaHora, tipoOperacion, estadoSync, cliente.id',
      sync_outbox: 'id, tipoOperacion, referenciaId, estado, fechaCreacion',
      movimientos_caja: 'id, fechaHora, tipo',
      pagos_cc: 'id, clienteId, fechaHora, estadoSync'
    });

    // Versión 6: Agrega tabla de empleados
    this.version(6).stores({
      productos: 'id, codigoBarras, categoria, nombre',
      clientes: 'id, codigo, nombre, tipo, zonaRuta',
      ventas: 'id, numeroTicket, fechaHora, tipoOperacion, estadoSync, turnoId',
      sync_outbox: 'id, tipoOperacion, referenciaId, estado, fechaCreacion',
      movimientos_caja: 'id, fechaHora, tipo, turnoId',
      pagos_cc: 'id, clienteId, fechaHora, estadoSync',
      turnos_caja: 'id, estado, cajero, fechaApertura',
      empleados: 'id, usuario, rol'
    });

    // Seeder automático al crear la base de datos (cuando está vacía)
    this.on('populate', () => {
      this.empleados.add({
        id: 'admin-root',
        nombre: 'Administrador',
        usuario: 'admin',
        pinOContrasena: 'admin',
        rol: 'ADMIN'
      });
    });
  }
}

// Instancia singleton compartida en toda la aplicación
export const db = new OmniPosDatabase();

/**
 * Función de inicialización y carga masiva (Bootstrap)
 * Si la base de datos está vacía o si el usuario solicita forzar la descarga
 * inicial desde Spring Boot, puebla las tablas locales con los mocks iniciales.
 */
export async function poblarBaseDeDatosInicial(forzar: boolean = false): Promise<{
  productos: number;
  clientes: number;
  empleados: number;
}> {
  const conteoActual = await db.productos.count();

  if (conteoActual === 0 || forzar) {
    await db.transaction('rw', db.productos, db.clientes, db.empleados, async () => {
      // Limpiamos si es forzado para evitar duplicados o estados inconsistentes
      if (forzar) {
        await db.productos.clear();
        await db.clientes.clear();
        await db.empleados.clear();
      }
      await db.productos.bulkPut(PRODUCTOS_MOCK);
      await db.clientes.bulkPut(CLIENTES_MOCK);
      await db.empleados.bulkPut(EMPLEADOS_MOCK);
    });
  }

  const productos = await db.productos.count();
  const clientes = await db.clientes.count();
  const empleados = await db.empleados.count();

  return { productos, clientes, empleados };
}

/**
 * Autoejecución inmediata de comprobación de arranque:
 * Si la base de datos está vacía, se auto-siembra para que la aplicación
 * esté 100% operativa desde el primer segundo.
 */
poblarBaseDeDatosInicial(false).catch(err => {
  console.error('[OmniPosDB] Error al inicializar base de datos IndexedDB:', err);
});
