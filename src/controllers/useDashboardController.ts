import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { VentaRealizada, Producto } from '../models';

export type FiltroFecha = 'HOY' | 'ULTIMOS_7_DIAS' | 'ESTE_MES' | 'RANGO_PERSONALIZADO';

export interface ProductoRanking {
  producto: Producto;
  cantidadVendida: number;
  ingresoGenerado: number;
}

/**
 * ============================================================================
 * CONTROLADOR: DASHBOARD Y REPORTES (MVC)
 * ============================================================================
 * Consulta las tablas locales y calcula las métricas financieras en tiempo real.
 */
export const useDashboardController = () => {
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>('HOY');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');

  // Traer todas las ventas y productos de la base de datos local
  const ventas = useLiveQuery(() => db.ventas.toArray(), []) || [];
  const productos = useLiveQuery(() => db.productos.toArray(), []) || [];

  // 1. Filtrar ventas según el rango de fecha seleccionado
  const ventasFiltradas = useMemo(() => {
    const ahora = new Date();
    let fechaInicio = new Date();
    fechaInicio.setHours(0, 0, 0, 0);

    if (filtroFecha === 'ULTIMOS_7_DIAS') {
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

    return ventas.filter(v => {
      const fechaVenta = new Date(v.fechaHora);
      return fechaVenta >= fechaInicio && fechaVenta <= fechaFin;
    });
  }, [ventas, filtroFecha, fechaDesde, fechaHasta]);

  // 2. Calcular KPIs (Indicadores Clave de Rendimiento)
  const kpis = useMemo(() => {
    let ingresosBrutos = 0;
    let costoTotal = 0;
    let ticketsEmitidos = ventasFiltradas.length;

    ventasFiltradas.forEach(venta => {
      ingresosBrutos += venta.total;

      // Calcular el costo total sumando el costo de cada ítem
      venta.items.forEach(item => {
        // Buscar el producto original para obtener su precio de costo actual
        const prodDb = productos.find(p => p.id === item.producto.id);
        const costoUnitario = prodDb ? prodDb.precioCosto : (item.producto as any).precioCosto || 0;
        costoTotal += costoUnitario * item.cantidad;
      });
    });

    const gananciaNeta = ingresosBrutos - costoTotal;

    return {
      ingresosBrutos,
      gananciaNeta,
      ticketsEmitidos
    };
  }, [ventasFiltradas, productos]);

  // 3. Generar Ranking (Top 5 Productos más vendidos)
  const rankingProductos = useMemo(() => {
    const mapaVentas = new Map<string, ProductoRanking>();

    ventasFiltradas.forEach(venta => {
      venta.items.forEach(item => {
        const prodId = item.producto.id;
        const existente = mapaVentas.get(prodId);

        if (existente) {
          existente.cantidadVendida += item.cantidad;
          existente.ingresoGenerado += item.subtotal;
        } else {
          // Buscamos el producto actualizado, si no existe usamos el del historial
          const prodDb = productos.find(p => p.id === prodId) || item.producto;
          mapaVentas.set(prodId, {
            producto: prodDb,
            cantidadVendida: item.cantidad,
            ingresoGenerado: item.subtotal
          });
        }
      });
    });

    return Array.from(mapaVentas.values())
      .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
      .slice(0, 5);
  }, [ventasFiltradas, productos]);

  return {
    filtroFecha,
    setFiltroFecha,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    kpis,
    rankingProductos
  };
};
