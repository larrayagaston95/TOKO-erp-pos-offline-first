import React, { useEffect, useState } from 'react';
import { Suscripcion } from '../../models';
import { suscripcionService } from '../../services/suscripcion.service';
import { CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';

export const SuscripcionView: React.FC = () => {
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  
  useEffect(() => {
    suscripcionService.getSuscripcionActual().then(setSuscripcion);
  }, []);

  if (!suscripcion) return <div className="p-8 text-center text-slate-500">Cargando datos del plan...</div>;

  const { metricas } = suscripcion;
  const pProductos = (metricas.productosActuales / metricas.productosLimite) * 100;
  const pCajas = (metricas.cajasActuales / metricas.cajasLimite) * 100;

  return (
    <div className="p-8 w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Mi Plan y Facturación</h2>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${suscripcion.estado === 'ACTIVA' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
          {suscripcion.estado}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-700">Plan Actual: {suscripcion.plan}</h3>
          <p className="text-3xl font-bold text-slate-900">${suscripcion.precioMensual}<span className="text-sm font-normal text-slate-500"> /mes</span></p>
          <div className="text-sm text-slate-600 space-y-2">
            <p><strong>Próximo vencimiento:</strong> {new Date(suscripcion.fechaVencimiento).toLocaleDateString()}</p>
            <p><strong>Último pago:</strong> {new Date(suscripcion.fechaUltimoPago).toLocaleDateString()}</p>
          </div>
          <button className="w-full flex items-center justify-center gap-2 bg-[#009EE3] hover:bg-[#0089C7] text-white py-2.5 rounded-xl font-semibold transition-colors">
            <CreditCard className="w-5 h-5" />
            Pagar con Mercado Pago
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <h3 className="font-bold text-slate-700">Consumo de Recursos</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Productos ({metricas.productosActuales}/{metricas.productosLimite})</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${pProductos > 90 ? 'bg-rose-500' : 'bg-teal-500'}`} style={{ width: `${pProductos}%` }}></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Cajas Registradoras ({metricas.cajasActuales}/{metricas.cajasLimite})</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${pCajas > 90 ? 'bg-rose-500' : 'bg-teal-500'}`} style={{ width: `${pCajas}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
