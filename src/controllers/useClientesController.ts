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

  // 2. OBTENER SALDOS
  const clientesConSaldo = useMemo<ClienteConSaldo[]>(() => {
    return clientes.map(cliente => {
      // El POS guarda deuda como saldo negativo. Convertimos a valor absoluto para mostrar deuda > 0.
      const deudaActual = cliente.saldoCuentaCorriente < 0 ? Math.abs(cliente.saldoCuentaCorriente) : 0;

      return {
        ...cliente,
        saldoCalculado: deudaActual
      };
    });
  }, [clientes]);

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
      const empresaIdStr = localStorage.getItem('toko_empresa_id') || '1';

      const nuevoPago: PagoCuentaCorriente & { empresa_id?: string | number } = {
        id: uuidv4(),
        empresa_id: parseInt(empresaIdStr, 10) || empresaIdStr,
        clienteId,
        fechaHora: new Date().toISOString(),
        monto,
        metodoPago,
        observaciones,
        estadoSync: 'PENDIENTE_SYNC'
      };

      await db.transaction('rw', db.pagos_cc, db.movimientos_caja, db.clientes, async () => {
        // Registrar el pago
        await db.pagos_cc.add(nuevoPago as any);

        // Actualizar saldoCuentaCorriente del cliente (Sumar el pago al saldo negativo)
        const cliDb = await db.clientes.get(clienteId);
        if (cliDb) {
          const saldoAnterior = cliDb.saldoCuentaCorriente || 0;
          await db.clientes.update(clienteId, { saldoCuentaCorriente: saldoAnterior + monto });
        }

        // Ingresar el movimiento en la caja registradora
        const clienteNombre = clientes.find(c => c.id === clienteId)?.nombre || 'Desconocido';
        await db.movimientos_caja.add({
          id: uuidv4(),
          fechaHora: new Date().toISOString(),
          tipo: 'INGRESO',
          monto: monto,
          concepto: `Pago Cta. Cte. - ${clienteNombre}`,
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

  const cargarHistorialCliente = (clienteId: string) => {
    // Buscamos ventas del cliente. Pueden ser financiadas o totales.
    // El POS ya guarda el objeto VentaRealizada.
    const compras = ventas
      .filter(v => v.cliente?.id === clienteId)
      .map(v => ({
        id: v.id,
        fechaHora: v.fechaHora,
        tipo: 'COMPRA' as const,
        descripcion: `Ticket #${v.numeroTicket}`,
        monto: v.metodoPago === 'CUENTA_CORRIENTE' || v.total > 0 ? v.total : 0, 
        metodoPago: v.metodoPago,
        items: v.items
      }));

    const pagosRealizados = pagos
      .filter(p => p.clienteId === clienteId)
      .map(p => ({
        id: p.id,
        fechaHora: p.fechaHora,
        tipo: 'PAGO' as const,
        descripcion: `Pago en ${p.metodoPago}`,
        monto: p.monto,
        metodoPago: p.metodoPago,
        items: []
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
    cargarHistorialCliente
  };
};
