package com.toko.erp.dto;

import java.util.List;

/**
 * ============================================================================
 * DTO: RESPUESTA DE SINCRONIZACIÓN (Response Body de POST /api/v1/sync/push)
 * ============================================================================
 * El servidor retorna un resultado por cada venta procesada en el lote.
 * El frontend actualiza el estado de cada ítem en la tabla sync_outbox de
 * Dexie.js según el estadoResultado recibido.
 *
 * EJEMPLO DE RESPUESTA:
 * {
 *   "procesadas": 2,
 *   "resultados": [
 *     {
 *       "ventaId": "uuid-1",
 *       "estadoResultado": "ACCEPTED",
 *       "mensaje": "Venta procesada correctamente."
 *     },
 *     {
 *       "ventaId": "uuid-2",
 *       "estadoResultado": "ACCEPTED_WITH_BACKORDER",
 *       "mensaje": "Stock insuficiente para 'Coca Cola 2.25L'. Inventario ajustado con backorder.",
 *       "productosConBackorder": ["prod-uuid-456"]
 *     }
 *   ]
 * }
 */
public record SyncPushResponseDTO(

    /** Total de ventas procesadas en este lote (incluyendo con backorder). */
    int procesadas,

    /** Resultado individual de cada venta enviada en el batch. */
    List<ResultadoVentaDTO> resultados
) {

    /**
     * DTO anidado: resultado de una venta individual dentro del lote.
     */
    public record ResultadoVentaDTO(

        /** UUID de la venta, para que el frontend identifique qué ítem actualizar. */
        String ventaId,

        /**
         * Estado de resolución:
         * - ACCEPTED            → OK, stock descontado normalmente.
         * - ACCEPTED_WITH_BACKORDER → Stock insuficiente, inventario en negativo.
         *                             Requiere reposición urgente.
         * - REJECTED            → Error crítico, venta no procesada.
         *                         Ver 'mensaje' para detalles.
         * - ALREADY_PROCESSED   → El UUID ya existía en BD (reintento idempotente).
         */
        String estadoResultado,

        /** Mensaje descriptivo del resultado para mostrar al operador o en logs. */
        String mensaje,

        /**
         * Lista de UUIDs de productos que generaron backorder (stock negativo).
         * Null o vacío si no hubo backorder. El frontend puede alertar al
         * encargado de depósito sobre qué productos reponer urgentemente.
         */
        List<String> productosConBackorder
    ) {}
}
