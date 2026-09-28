/**
 * ============================================================================
 * MODELO DE DATOS: CATEGORÍAS (RUBROS)
 * ============================================================================
 * Representa la clasificación de inventario con aislamiento Multi-tenant.
 */
export interface Categoria {
  id: string;
  nombre: string;
  empresa_id: string | number;
  descripcion?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
}

// Datos de semilla para desarrollo local
export const CATEGORIAS_MOCK: Categoria[] = [
  { id: 'cat-1', nombre: 'Almacén', empresa_id: 1, estado: 'ACTIVO' },
  { id: 'cat-2', nombre: 'Lácteos', empresa_id: 1, estado: 'ACTIVO' },
  { id: 'cat-3', nombre: 'Bebidas', empresa_id: 1, estado: 'ACTIVO' },
  { id: 'cat-4', nombre: 'Limpieza', empresa_id: 1, estado: 'ACTIVO' }
];
