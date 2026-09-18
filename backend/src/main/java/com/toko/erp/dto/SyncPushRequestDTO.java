package com.toko.erp.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * ============================================================================
 * DTO: SOLICITUD DE SINCRONIZACIÓN (Request Body de POST /api/v1/sync/push)
 * ============================================================================
 * El frontend envía un lote (batch) de ventas de la cola Outbox de Dexie.js.
 * Enviar en lotes reduce el número de roundtrips HTTP y mejora la resiliencia
 * ante conexiones de baja calidad (4G rural, WiFi inestable).
 *
 * EJEMPLO DE PAYLOAD:
 * {
 *   "ventas": [
 *     { "id": "uuid-1", "numeroTicket": "T0001-000123", ... },
 *     { "id": "uuid-2", "numeroTicket": "T0001-000124", ... }
 *   ]
 * }
 */
public record SyncPushRequestDTO(

    /**
     * Lote de ventas a sincronizar.
     * Mínimo 1 elemento, máximo determinado por configuración de servidor.
     * Cada elemento es validado individualmente con @Valid.
     */
    @NotEmpty(message = "El lote de ventas no puede estar vacío")
    @Valid
    List<VentaPayloadDTO> ventas
) {}
