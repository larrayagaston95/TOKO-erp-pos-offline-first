export type PlanSuscripcion = 'FREE' | 'PRO' | 'ENTERPRISE';
export type EstadoSuscripcion = 'ACTIVA' | 'SUSPENDIDA' | 'VENCIDA' | 'CANCELADA';

export interface MetricasConsumo {
  productosActuales: number;
  productosLimite: number;
  cajasActuales: number;
  cajasLimite: number;
  usuariosActuales: number;
  usuariosLimite: number;
}

export interface Suscripcion {
  id: string;
  tenantId: string;
  plan: PlanSuscripcion;
  estado: EstadoSuscripcion;
  fechaVencimiento: string;
  fechaUltimoPago: string;
  precioMensual: number;
  metricas: MetricasConsumo;
}

export interface TenantInfo {
  id: string;
  nombreLegal: string;
  rut: string;
  emailContacto: string;
  suscripcion: Suscripcion;
  createdAt: string;
}
