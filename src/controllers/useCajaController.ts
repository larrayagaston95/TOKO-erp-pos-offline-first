import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { TurnoCaja } from '../models';
import { v4 as uuidv4 } from 'uuid';

export type FiltroFechaCaja = 'HOY' | 'ULTIMOS_7_DIAS' | 'ESTE_MES' | 'RANGO_PERSONALIZADO';
export type FiltroTipoCierre = 'TODOS' | 'PARCIALES' | 'FINALES';

/**
 * ============================================================================
 * CONTROLADOR: APERTURA Y CIERRE DE CAJA (useCajaController.ts)
 * ============================================================================
 * Gestiona los turnos de caja: apertura, estado en tiempo real,
 * cierre parcial (cambio de turno) y cierre final del día.
 * Arquitectura: Offline-First con Dexie.js/IndexedDB.
 */
export const useCajaController = () => {
  const [filtroFecha, setFiltroFecha] = useState<FiltroFechaCaja>('ESTE_MES');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [filtroTipoCierre, setFiltroTipoCierre] = useState<FiltroTipoCierre>('TODOS');

  // Escucha reactiva de todos los turnos en la base de datos local
  const todos_los_turnos = useLiveQuery(() => db.turnos_caja.toArray(), []) || [];

  // Escucha reactiva de ventas y movimientos para calcular totales
  const todasVentas = useLiveQuery(() => db.ventas.toArray(), []) || [];
  const todosMovimientos = useLiveQuery(() => db.movimientos_caja.toArray(), []) || [];
  const todosPagosCC = useLiveQuery(() => db.pagos_cc.toArray(), []) || [];

  /**
   * Devuelve el turno activo (ABIERTA). Null si la caja está cerrada.
   */
  const turnoActivo: TurnoCaja | null = useMemo(() => {
    return todos_los_turnos.find(t => t.estado === 'ABIERTA') ?? null;
  }, [todos_los_turnos]);

  /**
   * Calcula el resumen económico del turno activo en tiempo real.
   * - ventasEfectivo: Total cobrado en efectivo en el turno.
   * - cobrosCC: Total cobrado por pagos de cuenta corriente.
   * - retiros: Total retirado de la caja.
   * - totalEsperado: Monto inicial + ventas efectivo + cobros CC - retiros.
   */
  const resumenTurnoActivo = useMemo(() => {
    if (!turnoActivo) {
      return { ventasEfectivo: 0, cobrosCC: 0, retiros: 0, totalEsperado: 0 };
    }

    // Ventas en efectivo pertenecientes al turno actual
    const ventasEfectivo = todasVentas
      .filter(v => (v as any).turnoId === turnoActivo.id && v.metodoPago === 'EFECTIVO')
      .reduce((sum, v) => sum + v.total, 0);

    // Cobros de cuenta corriente del turno actual
    const cobrosCC = todosPagosCC
      .filter(p => (p as any).turnoId === turnoActivo.id)
      .reduce((sum, p) => sum + p.monto, 0);

    // Retiros de caja del turno actual
    const retiros = todosMovimientos
      .filter(m => (m as any).turnoId === turnoActivo.id && m.tipo === 'RETIRO')
      .reduce((sum, m) => sum + m.monto, 0);

    const totalEsperado = turnoActivo.montoInicial + ventasEfectivo + cobrosCC - retiros;

    return { ventasEfectivo, cobrosCC, retiros, totalEsperado };
  }, [turnoActivo, todasVentas, todosMovimientos, todosPagosCC]);

  /**
   * Abre una nueva caja con el monto inicial y el nombre del cajero.
   * Falla si ya existe un turno abierto.
   */
  const abrirCaja = async (montoInicial: number, cajero: string): Promise<boolean> => {
    try {
      if (turnoActivo) {
        console.warn('[CajaController] Ya existe un turno abierto. No se puede abrir otra caja.');
        return false;
      }
      const nuevoTurno: TurnoCaja = {
        id: uuidv4(),
        fechaApertura: new Date().toISOString(),
        cajero,
        montoInicial,
        estado: 'ABIERTA',
        tipoCierre: null,
      };
      await db.turnos_caja.add(nuevoTurno);
      return true;
    } catch (error) {
      console.error('[CajaController] Error al abrir la caja:', error);
      return false;
    }
  };

  /**
   * Cierra el turno activo. Calcula diferencias y registra el tipo de cierre.
   * @param montoFisicoContado - Monto de efectivo físico contado por el cajero.
   * @param notas - Observaciones opcionales del operador.
   * @param esCierreFinal - true = cierre del día, false = cierre parcial (turno).
   */
  const cerrarCaja = async (
    montoFisicoContado: number,
    notas: string,
    esCierreFinal: boolean
  ): Promise<boolean> => {
    try {
      if (!turnoActivo) {
        console.warn('[CajaController] No hay turno abierto para cerrar.');
        return false;
      }

      const { totalEsperado } = resumenTurnoActivo;
      const diferencia = montoFisicoContado - totalEsperado;

      await db.turnos_caja.update(turnoActivo.id, {
        fechaCierre: new Date().toISOString(),
        montoFinalEsperado: totalEsperado,
        montoFinalReal: montoFisicoContado,
        diferencia,
        notas,
        estado: 'CERRADA',
        tipoCierre: esCierreFinal ? 'FINAL' : 'PARCIAL',
      });
      return true;
    } catch (error) {
      console.error('[CajaController] Error al cerrar la caja:', error);
      return false;
    }
  };

  // ==========================================================================
  // LÓGICA DE HISTORIAL Y REPORTES (Trasladada desde Dashboard)
  // ==========================================================================

  // 1. Filtrar Turnos de Caja (solo los cerrados)
  const turnosCerradosFiltrados = useMemo(() => {
    const ahora = new Date();
    let fechaInicio = new Date();
    fechaInicio.setHours(0, 0, 0, 0);

    if (filtroFecha === 'HOY') {
      // ya está en hoy
    } else if (filtroFecha === 'ULTIMOS_7_DIAS') {
      fechaInicio.setDate(ahora.getDate() - 7);
    } else if (filtroFecha === 'ESTE_MES') {
      fechaInicio.setDate(1);
    } else if (filtroFecha === 'RANGO_PERSONALIZADO' && fechaDesde) {
      fechaInicio = new Date(fechaDesde + 'T00:00:00');
    }

    let fechaFin = new Date();
    fechaFin.setHours(23, 59, 59, 999);
    if (filtroFecha === 'RANGO_PERSONALIZADO' && fechaHasta) {
      fechaFin = new Date(fechaHasta + 'T23:59:59');
    }

    return todos_los_turnos
      .filter(t => t.estado === 'CERRADA' && t.fechaCierre)
      .filter(t => {
        const fecha = new Date(t.fechaCierre!);
        return fecha >= fechaInicio && fecha <= fechaFin;
      })
      .filter(t => {
        if (filtroTipoCierre === 'PARCIALES') return t.tipoCierre === 'PARCIAL';
        if (filtroTipoCierre === 'FINALES') return t.tipoCierre === 'FINAL';
        return true;
      })
      .sort((a, b) => new Date(b.fechaCierre!).getTime() - new Date(a.fechaCierre!).getTime());
  }, [todos_los_turnos, filtroFecha, fechaDesde, fechaHasta, filtroTipoCierre]);

  // 2. Calcular KPIs de Cajas
  const kpisCajas = useMemo(() => {
    let totalEsperado = 0;
    let totalFisico = 0;
    let diferenciaTotal = 0;

    turnosCerradosFiltrados.forEach(turno => {
      totalEsperado += turno.montoFinalEsperado || 0;
      totalFisico += turno.montoFinalReal || 0;
      diferenciaTotal += (turno.montoFinalReal || 0) - (turno.montoFinalEsperado || 0);
    });

    return { totalEsperado, totalFisico, diferenciaTotal };
  }, [turnosCerradosFiltrados]);

  return {
    // Turno Actual
    turnoActivo,
    resumenTurnoActivo,
    todos_los_turnos,
    abrirCaja,
    cerrarCaja,

    // Historial y Reportes
    filtroFecha,
    setFiltroFecha,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    filtroTipoCierre,
    setFiltroTipoCierre,
    turnosCerradosFiltrados,
    kpisCajas
  };
};
