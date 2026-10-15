/**
 * ============================================================================
 * SERVICIO: NUMERACIÓN CORRELATIVA DE TICKETS (NumeracionService)
 * ============================================================================
 * Genera números de comprobante con formato {prefijo}{terminal}-{secuencia}.
 * Ejemplo: T3FA2-00000001
 *
 * - La terminal se identifica con 4 caracteres hexadecimales en mayúscula,
 *   generados una única vez y persistidos en localStorage.
 * - Cada prefijo ('T' mostrador, 'PV' preventa) mantiene su propio contador
 *   persistido en localStorage, que se incrementa en cada llamada.
 */

export type PrefijoTicket = 'T' | 'PV';

const CLAVE_TERMINAL = 'toko_terminal_codigo';
const CLAVE_SECUENCIA_PREFIJO = 'toko_secuencia_';

/**
 * Obtiene el código de terminal (4 hex en mayúscula); lo genera y guarda si no existe.
 */
function obtenerCodigoTerminal(): string {
  const existente = localStorage.getItem(CLAVE_TERMINAL);
  if (existente) return existente;

  const nuevo = Math.floor(Math.random() * 0x10000)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
  localStorage.setItem(CLAVE_TERMINAL, nuevo);
  return nuevo;
}

/**
 * Devuelve el siguiente número de ticket correlativo para el prefijo indicado.
 */
export function siguienteNumeroTicket(prefijo: PrefijoTicket): string {
  const terminal = obtenerCodigoTerminal();
  const clave = `${CLAVE_SECUENCIA_PREFIJO}${prefijo}`;

  const actual = parseInt(localStorage.getItem(clave) || '0', 10);
  const siguiente = (Number.isFinite(actual) && actual > 0 ? actual : 0) + 1;
  localStorage.setItem(clave, String(siguiente));

  return `${prefijo}${terminal}-${String(siguiente).padStart(8, '0')}`;
}
