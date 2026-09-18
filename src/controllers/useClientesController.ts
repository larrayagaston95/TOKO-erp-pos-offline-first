import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { Cliente, PagoCuentaCorriente, VentaRealizada } from '../models';
import { v4 as uuidv4 } from 'uuid';

export type ClienteConSaldo = Cliente & { saldoCalculado: number };

/**
 * ============================================================================
 * CONTROLADOR: CLIENTES Y CUENTA CORRIENTE (MVC)
 * ============================================================================
 * Lógica de negocio para manejar ABM de clientes, historiales de deuda (fiado)
 * y registro de pagos parciales/totales.
 */
export const useClientesController = () => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. OBTENER DATOS EN TIEMPO REAL DESDE DEXIE
  const clientes = useLiveQuery(() => db.clientes.toArray(), []) || [];
  const pagos = useLiveQuery(() => db.pagos_cc.toArray(), []) || [];
  const ventas = useLiveQuery(() => db.ventas.toArray(), []) || [];

  const ventasFiadas = useMemo(() => {
    return ventas.filter(v => v.metodoPago === 'CUENTA_CORRIENTE' && v.cliente?.id);
  }, [ventas]);

  // 2. CALCULAR SALDOS DINÁMICAMENTE
  const clientesConSaldo = useMemo<ClienteConSaldo[]>(() => {
    return clientes.map(cliente => {
      const deudaVentas = ventasFiadas
        .filter(v => v.cliente.id === cliente.id)
        .reduce((sum, v) => sum + v.total, 0);
        
      const totalPagado = pagos
        .filter(p => p.clienteId === cliente.id)
        .reduce((sum, p) => sum + p.monto, 0);

      // Si el cliente en el mock/base de datos tiene saldo negativo, asumimos que es deuda histórica.
      const deudaInicial = cliente.saldoCuentaCorriente < 0 ? Math.abs(cliente.saldoCuentaCorriente) : 0;
      
      const saldoActual = deudaInicial + deudaVentas - totalPagado;

      return {
        ...cliente,
        saldoCalculado: saldoActual
      };
    });
  }, [clientes, pagos, ventasFiadas]);

  // 3. ABM DE CLIENTES
  const guardarCliente = async (cliente: Omit<Cliente, 'id'> | Cliente) => {
    setCargando(true);
    setError(null);
    try {
      const isNew = !('id' in cliente) || !cliente.id;
      const clienteGuardar = {
        ...cliente,
        id: isNew ? uuidv4() : (cliente as Cliente).id,
      } as Cliente;

      await db.clientes.put(clienteGuardar);
      return true;
    } catch (err: any) {
      console.error('Error al guardar cliente', err);
      setError('No se pudo guardar el cliente');
      return false;
    } finally {
      setCargando(false);
    }
  };

  const eliminarCliente = async (id: string) => {
    setCargando(true);
    setError(null);
    try {
      await db.clientes.delete(id);
      return true;
    } catch (err: any) {
      console.error('Error al eliminar cliente', err);
      setError('No se pudo eliminar el cliente');
      return false;
    } finally {
      setCargando(false);
    }
  };

  // 4. CUENTA CORRIENTE (PAGOS E HISTORIAL)
  const registrarPago = async (
    clienteId: string, 
    monto: number, 
    metodoPago: 'EFECTIVO' | 'DEBITO' | 'TRANSFERENCIA_QR', 
    observaciones: string = ''
  ) => {
    setCargando(true);
    setError(null);
    try {
      const nuevoPago: PagoCuentaCorriente = {
        id: uuidv4(),
        clienteId,
        fechaHora: new Date().toISOString(),
        monto,
        metodoPago,
        observaciones,
        estadoSync: 'PENDIENTE_SYNC'
      };

      await db.transaction('rw', db.pagos_cc, db.movimientos_caja, async () => {
        // Registrar el pago
        await db.pagos_cc.add(nuevoPago);

        // Ingresar el movimiento en la caja registradora (para que el efectivo cuadre)
        const clienteNombre = clientes.find(c => c.id === clienteId)?.nombre || 'Desconocido';
        await db.movimientos_caja.add({
          id: uuidv4(),
          fechaHora: new Date().toISOString(),
          tipo: 'INGRESO',
          monto: monto,
          concepto: `Pago Cuenta Corriente - ${clienteNombre}`,
          usuario: 'Cajero'
        });
      });

      return true;
    } catch (err: any) {
      console.error('Error al registrar pago', err);
      setError('No se pudo registrar el pago');
      return false;
    } finally {
      setCargando(false);
    }
  };

  const obtenerHistorialCliente = (clienteId: string) => {
    const compras = ventasFiadas
      .filter(v => v.cliente.id === clienteId)
      .map(v => ({
        id: v.id,
        fechaHora: v.fechaHora,
        tipo: 'COMPRA' as const,
        descripcion: `Ticket #${v.numeroTicket}`,
        monto: v.total
      }));

    const pagosRealizados = pagos
      .filter(p => p.clienteId === clienteId)
      .map(p => ({
        id: p.id,
        fechaHora: p.fechaHora,
        tipo: 'PAGO' as const,
        descripcion: `Pago en ${p.metodoPago}`,
        monto: p.monto
      }));

    // Ordenar de más reciente a más antiguo
    return [...compras, ...pagosRealizados].sort((a, b) => 
      new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()
    );
  };

  return {
    clientes: clientesConSaldo,
    cargando,
    error,
    guardarCliente,
    eliminarCliente,
    registrarPago,
    obtenerHistorialCliente
  };
};
