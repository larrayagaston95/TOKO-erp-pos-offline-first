import { useState, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { Cliente, PagoCuentaCorriente, VentaRealizada } from '../models';
import { v4 as uuidv4 } from 'uuid';

export type ClienteConSaldo = Cliente & { saldoCalculado: number };

// ============================================================================
// CONFIGURACIONES GLOBALES DE MORA (mock — futura pantalla de Ajustes)
// ============================================================================
/** Modo de actualización de deuda: 'INTERES_DIARIO' | 'REPOSICION' */
const getModoMora = (): 'INTERES_DIARIO' | 'REPOSICION' =>
  (localStorage.getItem('toko_modo_mora') as 'INTERES_DIARIO' | 'REPOSICION') || 'INTERES_DIARIO';

/** Tasa mensual de interés en % (por defecto 10%) */
const getTasaMensual = (): number =>
  Number(localStorage.getItem('toko_tasa_mensual')) || 10;

// Tipo enriquecido que incluye los campos de mora calculados
export type MovimientoHistorial = {
  id: string;
  fechaHora: string;
  tipo: 'COMPRA' | 'PAGO';
  descripcion: string;
  monto: number;
  metodoPago?: string;
  montoAbonado?: number;
  vuelto?: number;
  saldoAfectadoCC?: number;
  items?: any[];
  // Campos de mora calculados asincrónicamente
  saldoActualizado: number;      // Monto con recargo aplicado (igual a monto si no hay recargo)
  fueActualizado: boolean;       // true si se aplicó algún recargo
  metodoActualizacion: string;   // Descripción del método y porcentaje
  diasTranscurridos: number;     // Días desde la venta
  porcentajeAplicado: number;    // % de recargo aplicado (0 si no aplica)
};

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

  /**
   * Versión síncrona del historial (datos crudos desde useLiveQuery).
   * Se mantiene para compatibilidad con otros consumidores.
   */
  const cargarHistorialCliente = (clienteId: string) => {
    const compras = ventas
      .filter(v => v.cliente?.id === clienteId)
      .map(v => ({
        id: v.id,
        fechaHora: v.fechaHora,
        tipo: 'COMPRA' as const,
        descripcion: `Ticket #${v.numeroTicket}`,
        monto: v.metodoPago === 'CUENTA_CORRIENTE' || v.total > 0 ? v.total : 0,
        metodoPago: v.metodoPago,
        montoAbonado: v.montoAbonado,
        vuelto: v.vuelto,
        saldoAfectadoCC: v.saldoAfectadoCC,
        items: v.items,
        // Defaults para los campos de mora (se recalculan en calcularHistorialConMora)
        saldoActualizado: v.total ?? 0,
        fueActualizado: false,
        metodoActualizacion: '',
        diasTranscurridos: 0,
        porcentajeAplicado: 0,
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
        items: [],
        saldoActualizado: p.monto,
        fueActualizado: false,
        metodoActualizacion: '',
        diasTranscurridos: 0,
        porcentajeAplicado: 0,
      }));

    return [...compras, ...pagosRealizados].sort((a, b) =>
      new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()
    );
  };

  /**
   * Motor Dual de Actualización de Deudas (Asíncrono).
   * Calcula mora con dos modalidades configurables desde localStorage:
   *   - INTERES_DIARIO: aplica tasa proporcional al tiempo transcurrido
   *   - REPOSICION: recalcula precio con valores actuales del catálogo en Dexie
   *
   * Solo aplica recargos a ventas con saldo pendiente a Cuenta Corriente (saldoAfectadoCC > 0).
   */
  const calcularHistorialConMora = useCallback(async (clienteId: string): Promise<MovimientoHistorial[]> => {
    const modoMora = getModoMora();
    const tasaMensual = getTasaMensual();
    const ahora = new Date();

    const historialBase = cargarHistorialCliente(clienteId);

    const historialEnriquecido = await Promise.all(
      historialBase.map(async (mov): Promise<MovimientoHistorial> => {
        // Solo los CARGOS (ventas) aplican mora
        if (mov.tipo !== 'COMPRA') {
          return { ...mov } as MovimientoHistorial;
        }

        const fechaMov = new Date(mov.fechaHora);
        const diffMs = ahora.getTime() - fechaMov.getTime();
        const diasTranscurridos = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        const tieneSaldoCC = (mov.saldoAfectadoCC ?? 0) > 0;
        if (!tieneSaldoCC || (modoMora === 'INTERES_DIARIO' && diasTranscurridos <= 30)) {
          return {
            ...mov,
            saldoActualizado: mov.monto,
            fueActualizado: false,
            metodoActualizacion: '',
            diasTranscurridos,
            porcentajeAplicado: 0,
          } as MovimientoHistorial;
        }

        // ── MODO INTERÉS DIARIO ────────────────────────────────────────────
        if (modoMora === 'INTERES_DIARIO') {
          const porcentaje = (diasTranscurridos / 30) * tasaMensual;
          
          // La mora se aplica SOBRE LO QUE SE FIÓ, no sobre el ticket entero si hubo pago parcial
          const saldoAfectadoCCOriginal = mov.saldoAfectadoCC ?? mov.monto;
          const incrementoMora = saldoAfectadoCCOriginal * (porcentaje / 100);
          const saldoActualizado = mov.monto + incrementoMora;

          return {
            ...mov,
            saldoActualizado,
            fueActualizado: true,
            metodoActualizacion: `Mora: ${porcentaje.toFixed(1)}% (Interés Diario)`,
            diasTranscurridos,
            porcentajeAplicado: porcentaje,
          } as MovimientoHistorial;
        }

        // ── MODO REPOSICIÓN (precio actual del catálogo) ──────────────────
        if (modoMora === 'REPOSICION' && mov.items && mov.items.length > 0) {
          console.group(`DEBUG CÁLCULO REPOSICIÓN - TICKET: ${mov.id}`);
          console.log('1. Valores Originales -> Total Ticket:', mov.monto, '| Saldo Enviado a CC:', mov.saldoAfectadoCC);

          // Consultamos precio actual de cada producto en Dexie en paralelo
          const subtotalesActualizados = await Promise.all(
            mov.items.map(async (item: any) => {
              try {
                const prodActual = await db.productos.get(item.producto.id);
                console.log(`   -> Item: ${item.producto.nombre} (ID: ${item.producto.id})`);
                console.log(`      Cant: ${item.cantidad} | Precio Histórico: $${item.precioUnitario} | Precio Actual BD: $${prodActual ? prodActual.precioVenta : 'NO ENCONTRADO'}`);
                if (prodActual) {
                  return item.cantidad * prodActual.precioVenta;
                }
              } catch (err) {
                console.error('Error buscando producto en reposición:', err);
              }
              // Fallback estricto al precio original si se eliminó el producto
              return item.cantidad * (item.precioUnitario || (item.subtotal / item.cantidad));
            })
          );

          const nuevoTotalMora = subtotalesActualizados.reduce((acc, s) => acc + s, 0);
          console.log('2. Sumatoria Final Recalculada:', nuevoTotalMora);
          
          // CRÍTICO: Proporcionalidad para pagos parciales
          const factorAumento = mov.monto > 0 ? (nuevoTotalMora / mov.monto) : 1;
          const saldoAfectadoCCOriginal = mov.saldoAfectadoCC ?? mov.monto;
          const nuevoSaldoAfectadoCC = saldoAfectadoCCOriginal * factorAumento;
          
          console.log('3. Saldo Afectado Original vs Nuevo Total:', saldoAfectadoCCOriginal, 'vs', nuevoSaldoAfectadoCC);
          console.groupEnd();

          // El incremento real de la deuda es solo lo que subió la parte fiada
          const incrementoDeuda = nuevoSaldoAfectadoCC - saldoAfectadoCCOriginal;
          const saldoActualizado = mov.monto + incrementoDeuda;
          
          const porcentajeEquivalente = mov.monto > 0 ? (incrementoDeuda / mov.monto) * 100 : 0;

          return {
            ...mov,
            saldoActualizado,
            fueActualizado: saldoActualizado !== mov.monto,
            metodoActualizacion: 'Valores actualizados a precio actual de catálogo',
            diasTranscurridos,
            porcentajeAplicado: porcentajeEquivalente,
          } as MovimientoHistorial;
        }

        // Fallback: sin recargo
        return {
          ...mov,
          saldoActualizado: mov.monto,
          fueActualizado: false,
          metodoActualizacion: '',
          diasTranscurridos,
          porcentajeAplicado: 0,
        } as MovimientoHistorial;
      })
    );

    return historialEnriquecido;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ventas, pagos]);

  return {
    clientes: clientesConSaldo,
    cargando,
    error,
    guardarCliente,
    eliminarCliente,
    registrarPago,
    cargarHistorialCliente,
    calcularHistorialConMora,
  };
};
