/**
 * ============================================================================
 * MODELO: TURNO DE CAJA
 * ============================================================================
 * Representa una sesión de apertura/cierre del cajero en el sistema.
 */

/**
 * Estado del turno de caja.
 */
export type EstadoTurno = 'ABIERTA' | 'CERRADA';

/**
 * Tipo de cierre del turno.
 */
export type TipoCierre = 'PARCIAL' | 'FINAL' | null;

/**
 * Estructura completa de un turno de caja.
 */
export interface TurnoCaja {
  id: string;                          // UUID del turno
  fechaApertura: string;               // ISO timestamp de apertura
  cajero: string;                      // Nombre o usuario del operador
  montoInicial: number;                // Cambio inicial entregado al cajero
  fechaCierre?: string;                // ISO timestamp de cierre (si aplica)
  montoFinalEsperado?: number;         // Calculado por el sistema (ventas efectivo + retiros)
  montoFinalReal?: number;             // Monto físico contado por el cajero
  diferencia?: number;                 // montoFinalReal - montoFinalEsperado (+ sobra / - falta)
  notas?: string;                      // Observaciones del cierre
  estado: EstadoTurno;                 // 'ABIERTA' o 'CERRADA'
  tipoCierre: TipoCierre;              // null = activo, 'PARCIAL' = cambio de turno, 'FINAL' = cierre del día
  sincronizado?: boolean;              // Estado de sincronización con el backend (true = sincronizado)
  detalle_billetes?: any;              // Desglose de billetes al momento del cierre
}
