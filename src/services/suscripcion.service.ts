import { Suscripcion, TenantInfo, EstadoSuscripcion } from '../models';

class SuscripcionService {
  private mockSuscripcionActual: Suscripcion = {
    id: 'sub_123',
    tenantId: 'tenant_001',
    plan: 'PRO',
    estado: 'ACTIVA',
    fechaVencimiento: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
    fechaUltimoPago: new Date().toISOString(),
    precioMensual: 4999.00,
    metricas: {
      productosActuales: 450,
      productosLimite: 1000,
      cajasActuales: 1,
      cajasLimite: 3,
      usuariosActuales: 2,
      usuariosLimite: 5
    }
  };

  private mockTenants: TenantInfo[] = [
    {
      id: 'tenant_001',
      nombreLegal: 'Supermercado Central',
      rut: '30-12345678-9',
      emailContacto: 'admin@central.com',
      createdAt: new Date().toISOString(),
      suscripcion: this.mockSuscripcionActual
    },
    {
      id: 'tenant_002',
      nombreLegal: 'Kiosco El Paso',
      rut: '20-87654321-1',
      emailContacto: 'kiosco@elpaso.com',
      createdAt: new Date().toISOString(),
      suscripcion: {
        id: 'sub_124',
        tenantId: 'tenant_002',
        plan: 'FREE',
        estado: 'VENCIDA',
        fechaVencimiento: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
        fechaUltimoPago: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString(),
        precioMensual: 0,
        metricas: {
          productosActuales: 50,
          productosLimite: 50,
          cajasActuales: 1,
          cajasLimite: 1,
          usuariosActuales: 1,
          usuariosLimite: 1
        }
      }
    }
  ];

  async getSuscripcionActual(): Promise<Suscripcion> {
    return Promise.resolve({ ...this.mockSuscripcionActual });
  }

  async getAllTenants(): Promise<TenantInfo[]> {
    return Promise.resolve([...this.mockTenants]);
  }

  async cambiarEstadoSuscripcion(tenantId: string, nuevoEstado: EstadoSuscripcion): Promise<void> {
    const tenant = this.mockTenants.find(t => t.id === tenantId);
    if (tenant) {
      tenant.suscripcion.estado = nuevoEstado;
    }
    return Promise.resolve();
  }
}

export const suscripcionService = new SuscripcionService();
