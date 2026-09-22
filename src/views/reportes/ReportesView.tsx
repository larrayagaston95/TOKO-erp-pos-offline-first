import React, { useState } from 'react';
import { useDashboardController, FiltroFecha } from '../../controllers/useDashboardController';
import { BarChart, Calendar, DollarSign, Receipt, TrendingUp, Package, Trophy } from 'lucide-react';


/**
 * ============================================================================
 * VISTA: REPORTES Y ESTADÍSTICAS (DASHBOARD)
 * ============================================================================
 * Muestra el desempeño comercial (Ventas, Rentabilidad, Ranking) 
 * calculados de forma local mediante IndexedDB.
 */
export const ReportesView: React.FC = () => {
  const { filtroFecha, setFiltroFecha, kpis, rankingProductos } = useDashboardController();

  return (
    <div id="vista-reportes-modulo" className="flex-1 p-6 bg-slate-50/70 overflow-hidden flex flex-col min-h-0 gap-6">
      
      {/* ===================================================================
          CABECERA Y FILTROS
          =================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-lg shadow-teal-900/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
              <BarChart className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900">
              Dashboard de Ganancias
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Resumen financiero calculado a partir de las ventas locales.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200/80 shadow-sm">
          <Calendar className="h-4 w-4 text-slate-400 ml-2" />
          <select
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value as FiltroFecha)}
            className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none pr-4 cursor-pointer"
          >
            <option value="HOY">Hoy</option>
            <option value="ULTIMOS_7_DIAS">Últimos 7 Días</option>
            <option value="ESTE_MES">Este Mes</option>
            <option value="RANGO_PERSONALIZADO">Rango Personalizado...</option>
          </select>
        </div>
      </div>


          {/* ===================================================================
              TARJETAS KPI (Ingresos, Rentabilidad, Tickets)
              =================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Ingresos Brutos */}
        <div className="bg-white rounded-2xl p-6 shadow-lg shadow-teal-900/5 border border-slate-200/80 flex items-center gap-4">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <DollarSign className="h-7 w-7 text-blue-500" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Ventas Totales</p>
            <p className="text-3xl font-black text-slate-900">
              ${kpis.ingresosBrutos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Ganancia Neta */}
        <div className="bg-white rounded-2xl p-6 shadow-lg shadow-teal-900/5 border border-slate-200/80 flex items-center gap-4">
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <TrendingUp className="h-7 w-7 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Ganancia Neta</p>
            <p className="text-3xl font-black text-emerald-600">
              ${kpis.gananciaNeta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Tickets Emitidos */}
        <div className="bg-white rounded-2xl p-6 shadow-lg shadow-teal-900/5 border border-slate-200/80 flex items-center gap-4">
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
            <Receipt className="h-7 w-7 text-purple-500" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tickets Emitidos</p>
            <p className="text-3xl font-black text-slate-900">
              {kpis.ticketsEmitidos}
            </p>
          </div>
        </div>
      </div>

      {/* ===================================================================
          TABLA: RANKING TOP 5 PRODUCTOS
          =================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg shadow-teal-900/5 overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 shrink-0">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h3 className="font-black text-slate-800">Ranking: Top 5 Productos Más Vendidos</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-6 w-12 text-center">#</th>
              <th className="py-3 px-6">Producto</th>
              <th className="py-3 px-6 text-center">Cantidad Vendida</th>
              <th className="py-3 px-6 text-right">Ingreso Generado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {rankingProductos.map((item, index) => (
              <tr key={item.producto.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6 text-center">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-xs ${
                    index === 0 ? 'bg-amber-100 text-amber-600' :
                    index === 1 ? 'bg-slate-200 text-slate-600' :
                    index === 2 ? 'bg-orange-100 text-orange-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {index + 1}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-slate-400">
                      {item.producto.imagenUrl ? (
                        <img src={item.producto.imagenUrl} alt={item.producto.nombre} className="h-full w-full object-cover rounded-xl" />
                      ) : (
                        <Package className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">{item.producto.nombre}</span>
                      <span className="text-[10px] text-slate-500">{item.producto.categoria} • {item.producto.codigoBarras}</span>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 text-center font-mono font-bold text-slate-900">
                  {item.cantidadVendida} u.
                </td>
                <td className="py-4 px-6 text-right font-mono font-black text-emerald-600">
                  ${item.ingresoGenerado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            {rankingProductos.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-500 font-medium">
                  No hay ventas registradas en el período seleccionado.
                </td>
              </tr>
            )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
