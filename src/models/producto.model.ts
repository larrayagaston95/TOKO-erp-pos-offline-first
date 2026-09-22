/**
 * ============================================================================
 * MODELO: PRODUCTO Y CATEGORÍA
 * ============================================================================
 * Este archivo define los tipos de datos y la colección inicial de prueba (mocks).
 * En la siguiente etapa, esta estructura se conectará directamente con la
 * base de datos local IndexedDB y la API REST de Spring Boot.
 */

/**
 * Categorías principales para la clasificación del catálogo comercial.
 */
export type CategoriaProducto = 
  | 'Almacén' 
  | 'Bebidas' 
  | 'Lácteos' 
  | 'Golosinas' 
  | 'Limpieza' 
  | 'Fiambres y Quesos';

/**
 * Estructura de datos principal para un artículo del catálogo.
 */
export interface Producto {
  id: string;                      // Identificador único universal (UUID)
  codigoBarras: string;            // Código EAN-13 para lectura con pistola láser
  nombre: string;                 // Nombre comercial descriptivo
  categoria: CategoriaProducto;   // Categoría para filtrado rápido
  precioVenta: number;        // Precio de venta al público general en mostrador
  precioMayorista: number;        // Precio especial para preventistas / distribuidora
  precioCosto?: number;           // Costo de compra o producción para cálculo de rentabilidad
  stock: number;            // Stock físico disponible en depósito central
  stockMinimo: number;            // Umbral de advertencia para compras
  imagenUrl: string;              // Fotografía optimizada para la vista móvil
  unidadMedida: 'UNIDAD' | 'KG' | 'PACK'; // Unidad de venta
  // ─── Campos extendidos de categorización ──────────────────────────────
  proveedor?: string;             // Proveedor o distribuidor (ej: "Arcor", "Unilever")
  marca?: string;                 // Marca comercial del producto (ej: "Coca-Cola")
  rubro?: string;                 // Rubro para agrupaciones internas (ej: "Lácteos Frescos")
  subCategoria?: string;          // Sub-clasificación dentro de la categoría
}

/**
 * Datos estáticos de prueba (Mock Data) con artículos típicos de supermercados y distribuidoras.
 */
export const PRODUCTOS_MOCK: Producto[] = [
  {
    id: 'prod-001',
    codigoBarras: '7790070411802',
    nombre: 'Aceite de Girasol Natura 900ml',
    categoria: 'Almacén',
    precioVenta: 1850.00,
    precioMayorista: 1450.00,
    precioCosto: 1200.00,
    stock: 38,
    stockMinimo: 10,
    imagenUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
    unidadMedida: 'UNIDAD'
  },
  {
    id: 'prod-002',
    codigoBarras: '7791234567890',
    nombre: 'Gaseosa Coca Cola Sabor Original 2.25L',
    categoria: 'Bebidas',
    precioVenta: 3100.00,
    precioMayorista: 2650.00,
    precioCosto: 2100.00,
    stock: 84,
    stockMinimo: 24,
    imagenUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
    unidadMedida: 'UNIDAD'
  },
  {
    id: 'prod-003',
    codigoBarras: '7790895000451',
    nombre: 'Leche Entera La Serenísima 1L Tetrapak',
    categoria: 'Lácteos',
    precioVenta: 1250.00,
    precioMayorista: 1020.00,
    precioCosto: 850.00,
    stock: 45,
    stockMinimo: 15,
    imagenUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
    unidadMedida: 'UNIDAD'
  },
  {
    id: 'prod-004',
    codigoBarras: '7790040112345',
    nombre: 'Galletitas Chocolinas Bagley 250g',
    categoria: 'Golosinas',
    precioVenta: 1100.00,
    precioMayorista: 890.00,
    precioCosto: 750.00,
    stock: 62,
    stockMinimo: 20,
    imagenUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80',
    unidadMedida: 'UNIDAD'
  },
  {
    id: 'prod-005',
    codigoBarras: '7790010001010',
    nombre: 'Harina de Trigo 000 Pureza 1kg',
    categoria: 'Almacén',
    precioVenta: 950.00,
    precioMayorista: 780.00,
    precioCosto: 600.00,
    stock: 110,
    stockMinimo: 30,
    imagenUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
    unidadMedida: 'UNIDAD'
  },
  {
    id: 'prod-006',
    codigoBarras: '7790310234567',
    nombre: 'Detergente Lavavajillas Magistral 500ml',
    categoria: 'Limpieza',
    precioVenta: 2150.00,
    precioMayorista: 1780.00,
    precioCosto: 1400.00,
    stock: 29,
    stockMinimo: 10,
    imagenUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=400&q=80',
    unidadMedida: 'UNIDAD'
  },
  {
    id: 'prod-007',
    codigoBarras: '7790080123456',
    nombre: 'Agua Mineral Villavicencio Sin Gas 1.5L',
    categoria: 'Bebidas',
    precioVenta: 980.00,
    precioMayorista: 790.00,
    precioCosto: 500.00,
    stock: 95,
    stockMinimo: 24,
    imagenUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80',
    unidadMedida: 'UNIDAD'
  },
  {
    id: 'prod-008',
    codigoBarras: '7790020456789',
    nombre: 'Queso Cremoso La Paulina (por kg)',
    categoria: 'Fiambres y Quesos',
    precioVenta: 7800.00,
    precioMayorista: 6400.00,
    precioCosto: 4500.00,
    stock: 18,
    stockMinimo: 5,
    imagenUrl: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=400&q=80',
    unidadMedida: 'KG'
  },
  {
    id: 'prod-009',
    codigoBarras: '7790060987654',
    nombre: 'Yerba Mate Playadito con Palo 1kg',
    categoria: 'Almacén',
    precioVenta: 3950.00,
    precioMayorista: 3200.00,
    precioCosto: 2600.00,
    stock: 50,
    stockMinimo: 15,
    imagenUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
    unidadMedida: 'UNIDAD'
  }
];
