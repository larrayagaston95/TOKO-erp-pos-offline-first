/**
 * ============================================================================
 * MODELO: CLIENTE Y CUENTA CORRIENTE
 * ============================================================================
 * Representa la cartera de clientes, tanto para la venta en mostrador
 * (consumidor final) como para los clientes de ruta asignados a los
 * preventistas con cuenta corriente y listas de precios preferenciales.
 */

export interface Cliente {
  id: string;                      // Identificador único del cliente
  codigo: string;                  // Código comercial o número de cuenta
  nombre: string;                  // Nombre o Razón Social
  documento: string;               // CUIT / CUIL / DNI
  tipo: 'CONSUMIDOR_FINAL' | 'COMERCIO_MINORISTA' | 'DISTRIBUIDOR';
  telefono: string;                // Teléfono de contacto
  direccion: string;               // Dirección física o local del cliente
  zonaRuta: string;                // Zona de entrega para preventistas (ej: Zona Norte)
  listaPrecioPorDefecto: 'MOSTRADOR' | 'MAYORISTA';
  saldoCuentaCorriente: number;    // Saldo adeudado (negativo = deuda)
  limiteCredito: number;           // Límite máximo autorizado para compras a plazo
}

/**
 * Representa un pago o abono realizado por un cliente a su cuenta corriente.
 */
export interface PagoCuentaCorriente {
  id: string;
  clienteId: string;
  fechaHora: string;
  monto: number;
  metodoPago: 'EFECTIVO' | 'DEBITO' | 'TRANSFERENCIA_QR';
  observaciones: string;
  estadoSync: 'PENDIENTE_SYNC' | 'SINCRONIZADO';
}

/**
 * UUID fijo del cliente "Consumidor Final" (venta anónima de mostrador).
 * Debe coincidir con el registro cargado en el backend.
 */
export const CONSUMIDOR_FINAL_ID = 'c1000000-0000-4000-8000-000000000001';

/**
 * Clientes de prueba para el funcionamiento inicial del sistema.
 */
export const CLIENTES_MOCK: Cliente[] = [
  {
    id: CONSUMIDOR_FINAL_ID,
    codigo: 'CLI-0001',
    nombre: 'Consumidor Final Mostrador',
    documento: '00-00000000-0',
    tipo: 'CONSUMIDOR_FINAL',
    telefono: '-',
    direccion: 'Venta de salón / Mostrador',
    zonaRuta: 'Local Central',
    listaPrecioPorDefecto: 'MOSTRADOR',
    saldoCuentaCorriente: 0,
    limiteCredito: 0
  },
  {
    id: 'c1000000-0000-4000-8000-000000000002',
    codigo: 'CLI-0042',
    nombre: 'Almacén Don Mario',
    documento: '20-28491029-4',
    tipo: 'COMERCIO_MINORISTA',
    telefono: '+54 9 11 4829-1029',
    direccion: 'Av. San Martín 1420',
    zonaRuta: 'Zona Norte - Ruta 1',
    listaPrecioPorDefecto: 'MAYORISTA',
    saldoCuentaCorriente: -15400.00,
    limiteCredito: 100000.00
  },
  {
    id: 'c1000000-0000-4000-8000-000000000003',
    codigo: 'CLI-0089',
    nombre: 'Kiosco 24hs La Esquina',
    documento: '27-33104928-1',
    tipo: 'COMERCIO_MINORISTA',
    telefono: '+54 9 11 5592-3341',
    direccion: 'Calle Belgrano 402',
    zonaRuta: 'Zona Centro - Ruta 2',
    listaPrecioPorDefecto: 'MAYORISTA',
    saldoCuentaCorriente: 0.00,
    limiteCredito: 80000.00
  },
  {
    id: 'c1000000-0000-4000-8000-000000000004',
    codigo: 'CLI-0105',
    nombre: 'Supermercado Los Hermanos',
    documento: '30-71092841-8',
    tipo: 'DISTRIBUIDOR',
    telefono: '+54 9 11 6012-9988',
    direccion: 'Ruta 8 Km 54',
    zonaRuta: 'Zona Oeste - Ruta 3',
    listaPrecioPorDefecto: 'MAYORISTA',
    saldoCuentaCorriente: -68000.00,
    limiteCredito: 350000.00
  }
];
