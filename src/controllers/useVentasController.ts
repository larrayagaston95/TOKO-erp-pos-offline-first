/**
 * ============================================================================
 * CONTROLADOR: VENTAS Y CIERRE DE CAJA (useVentasController.ts)
 * ============================================================================
 * Maneja la lógica de lectura y totalización del historial de ventas 
 * persistidas localmente en IndexedDB.
 */

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { MetodoPago, MovimientoCaja } from '../models';

export function useVentasController() {
  // Consulta reactiva a la base de datos local (tabla ventas)
  const ventasDb = useLiveQuery(() => db.ventas.toArray(), []);
  const movimientosDb = useLiveQuery(() => db.movimientos_caja.toArray(), []);
  
  // Arreglo de ventas siempre definido
  const historialVentas = ventasDb || [];
  const movimientosCaja = movimientosDb || [];

  /**
   * Calcula los totales financieros consolidados de la caja actual.
   * Agrupa el dinero ingresado según la forma de pago para facilitar el cierre.
   */
  const totales = useMemo(() => {
    let totalRecaudado = 0;
    const desglosePorMetodo: Record<MetodoPago, number> = {
      EFECTIVO: 0,
      DEBITO: 0,
      CREDITO: 0,
      TRANSFERENCIA_QR: 0,
      CUENTA_CORRIENTE: 0,
    };

    historialVentas.forEach(venta => {
      totalRecaudado += venta.total;
      if (desglosePorMetodo[venta.metodoPago] !== undefined) {
        desglosePorMetodo[venta.metodoPago] += venta.total;
      }
    });

    // Restar retiros
    movimientosCaja.forEach(mov => {
      if (mov.tipo === 'RETIRO') {
        totalRecaudado -= mov.monto;
        desglosePorMetodo['EFECTIVO'] -= mov.monto;
      } else if (mov.tipo === 'INGRESO') {
        totalRecaudado += mov.monto;
        desglosePorMetodo['EFECTIVO'] += mov.monto;
      }
    });

    return {
      totalRecaudado,
      desglosePorMetodo,
      cantidadTickets: historialVentas.length
    };
  }, [historialVentas, movimientosCaja]);

  const registrarRetiroEfectivo = async (monto: number, concepto: string) => {
    if (monto <= 0) return;
    const nuevoMovimiento: MovimientoCaja = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      fechaHora: new Date().toISOString(),
      tipo: 'RETIRO',
      monto,
      concepto,
      usuario: 'Cajero Central'
    };
    await db.movimientos_caja.put(nuevoMovimiento);
  };

  const convertirAFactura = async (ventaId: string, documentoCliente: string) => {
    const venta = await db.ventas.get(ventaId);
    if (venta) {
      const clienteModificado = { ...venta.cliente, nombre: documentoCliente === '00000000' ? 'Consumidor Final' : venta.cliente.nombre, documento: documentoCliente };
      await db.ventas.update(ventaId, { 
        tipoComprobante: 'FACTURA_AFIP',
        cliente: clienteModificado
      });
      
      // Actualizar también en sync_outbox si existe
      const outboxEntries = await db.sync_outbox.where('referenciaId').equals(ventaId).toArray();
      if (outboxEntries.length > 0) {
        const outboxEntry = outboxEntries[0];
        const payloadModificado = { ...outboxEntry.payload, tipoComprobante: 'FACTURA_AFIP', cliente: clienteModificado };
        await db.sync_outbox.update(outboxEntry.id, { payload: payloadModificado });
      }
    }
  };

  return {
    historialVentas,
    movimientosCaja,
    totales,
    registrarRetiroEfectivo,
    convertirAFactura
  };
}
