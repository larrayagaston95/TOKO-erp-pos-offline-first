import React, { useEffect, useState } from 'react';
import { TenantInfo, EstadoSuscripcion } from '../../models';
import { suscripcionService } from '../../services/suscripcion.service';
import { Building, DollarSign, Activity, Ban, CheckCircle } from 'lucide-react';

export const AdminLicenciasView: React.FC = () => {
  const [tenants, setTenants] = useState<TenantInfo[]>([]);

  const cargarTenants = () => {
    suscripcionService.getAllTenants().then(setTenants);
  };

  useEffect(() => {
    cargarTenants();
  }, []);

  const mrr = tenants.filter(t => t.suscripcion.estado === 'ACTIVA').reduce((acc, t) => acc + t.suscripcion.precioMensual, 0);
  const activos = tenants.filter(t => t.suscripcion.estado === 'ACTIVA').length;

  const handleCambiarEstado = async (tenantId: string, estado: EstadoSuscripcion) => {
    await suscripcionService.cambiarEstadoSuscripcion(tenantId, estado);
    cargarTenants();
  };

  return (
    <div className="p-8 w-full max-w-6xl mx-auto space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Panel SuperAdmin - Licencias</h2>
          <p className="text-slate-500 text-sm">Gestión global de inquilinos y facturación SaaS</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign className="w-6 h-6" /></div>
          <div>
            <p className="text-slate-500 text-sm font-medium">MRR (Ingreso Recurrente)</p>
            <p className="text-2xl font-bold text-slate-800">${mrr}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl"><Activity className="w-6 h-6" /></div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Comercios Activos</p>
            <p className="text-2xl font-bold text-slate-800">{activos}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Building className="w-6 h-6" /></div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Total Comercios</p>
            <p className="text-2xl font-bold text-slate-800">{tenants.length}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Comercio</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Vencimiento</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenants.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{t.nombreLegal}</div>
                    <div className="text-xs text-slate-500">{t.rut}</div>
                  </td>
                  <td className="px-6 py-4 font-mono font-medium">{t.suscripcion.plan}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                      t.suscripcion.estado === 'ACTIVA' ? 'bg-emerald-50 text-emerald-700' : 
                      t.suscripcion.estado === 'VENCIDA' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {t.suscripcion.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4">{new Date(t.suscripcion.fechaVencimiento).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {t.suscripcion.estado !== 'ACTIVA' && (
                      <button onClick={() => handleCambiarEstado(t.id, 'ACTIVA')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Activar/Extender">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {t.suscripcion.estado === 'ACTIVA' && (
                      <button onClick={() => handleCambiarEstado(t.id, 'SUSPENDIDA')} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Suspender">
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
