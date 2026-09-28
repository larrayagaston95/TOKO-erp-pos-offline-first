/**
 * ============================================================================
 * MODELO: EMPLEADO Y ROLES DE SEGURIDAD
 * ============================================================================
 * Estructuras de datos para gestionar el personal, credenciales de acceso y
 * niveles de autorización dentro del sistema.
 */

export type RolSeguridad = 'ADMIN' | 'VENDEDOR' | 'VENTA_LOGISTICA';

/**
 * Representa a un operador del sistema.
 */
export interface Empleado {
  id: string;               // UUID del empleado
  nombre: string;           // Nombre completo (ej: "Juan Pérez")
  usuario: string;          // Nombre de usuario para login (ej: "juanp")
  pinOContrasena: string;   // Contraseña o PIN de acceso
  rol: RolSeguridad;        // Nivel de acceso
  empresa_id: string | number; // Aislamiento SaaS Multi-Tenant
  sucursal_id?: string | number; // Local físico de operación
  pin_acceso?: string;      // PIN de acceso rápido para POS
}

/**
 * Mock inicial para pruebas / siembra.
 */
export const EMPLEADOS_MOCK: Empleado[] = [
  {
    id: 'admin-root',
    nombre: 'Administrador',
    usuario: 'admin',
    pinOContrasena: 'admin',
    rol: 'ADMIN',
    empresa_id: 1,
    pin_acceso: '0000'
  },
  {
    id: 'emp-vend-01',
    nombre: 'Cajero / Vendedor',
    usuario: 'vendedor',
    pinOContrasena: '1234',
    rol: 'VENDEDOR',
    empresa_id: 1,
    sucursal_id: 1,
    pin_acceso: '1234'
  }
];
