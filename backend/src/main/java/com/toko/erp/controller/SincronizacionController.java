package com.toko.erp.controller;

import com.toko.erp.dto.SyncPushRequestDTO;
import com.toko.erp.dto.SyncPushResponseDTO;
import com.toko.erp.service.SincronizacionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * ============================================================================
 * CONTROLADOR REST: SINCRONIZACIÓN OFFLINE → SERVIDOR
 * ============================================================================
 * Expone el endpoint que el frontend (React + Dexie.js) llama cuando
 * recupera conectividad para vaciar su cola Outbox de ventas pendientes.
 *
 * BASE URL: /api/v1/sync
 *
 * FLUJO DE LLAMADA DESDE EL FRONTEND:
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  Dexie sync_outbox                                                      │
 * │    → filtra items con estado = 'PENDIENTE'                              │
 * │    → agrupa en lote (batch de N ventas)                                 │
 * │    → POST /api/v1/sync/push con el JSON del lote                        │
 * │    → por cada resultado en la respuesta:                                │
 * │         ACCEPTED / BACKORDER → marca item como 'SINCRONIZADO'           │
 * │         REJECTED             → marca item como 'FALLIDO' + muestra alerta│
 * │         ALREADY_PROCESSED    → marca item como 'SINCRONIZADO' (idempotente)│
 * └──────────────────────────────────────────────────────────────────────────┘
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/sync")
@RequiredArgsConstructor
public class SincronizacionController {

    private final SincronizacionService sincronizacionService;

    /**
     * POST /api/v1/sync/push
     *
     * Recibe un lote de ventas offline del frontend y las procesa.
     * Aplica la regla de Backorder si el stock en PostgreSQL no alcanza.
     *
     * REQUEST BODY:
     * {
     *   "ventas": [
     *     {
     *       "id": "550e8400-e29b-41d4-a716-446655440000",
     *       "numeroTicket": "T0001-000123",
     *       "fechaHora": "2024-03-15T10:30:00-03:00",
     *       "tipoOperacion": "POS_MOSTRADOR",
     *       "cliente": {
     *         "id": "cli-uuid-001",
     *         "codigo": "CLI-0042",
     *         "nombre": "Almacén Don Mario",
     *         "documento": "20-28491029-4",
     *         "tipo": "COMERCIO_MINORISTA"
     *       },
     *       "items": [
     *         {
     *           "id": "item-uuid-001",
     *           "productoId": "prod-uuid-002",
     *           "productoNombre": "Coca Cola 2.25L",
     *           "cantidad": 12,
     *           "precioUnitario": 2650.00,
     *           "subtotal": 31800.00
     *         }
     *       ],
     *       "subtotal": 31800.00,
     *       "descuentoPorcentaje": 5.00,
     *       "total": 30210.00,
     *       "metodoPago": "CUENTA_CORRIENTE",
     *       "vendedor": "Juan Pérez"
     *     }
     *   ]
     * }
     *
     * RESPONSE 200 — Lote procesado (puede incluir backorders o rechazos):
     * {
     *   "procesadas": 1,
     *   "resultados": [
     *     {
     *       "ventaId": "550e8400-e29b-41d4-a716-446655440000",
     *       "estadoResultado": "ACCEPTED_WITH_BACKORDER",
     *       "mensaje": "Venta registrada con BACKORDER. 1 producto(s) con stock negativo.",
     *       "productosConBackorder": ["prod-uuid-002"]
     *     }
     *   ]
     * }
     *
     * RESPONSE 400 — Payload inválido (falla @Valid de Bean Validation)
     *
     * @param request Lote de ventas offline validado con jakarta.validation
     * @return ResponseEntity con el resultado de sincronización
     */
    @PostMapping("/push")
    public ResponseEntity<SyncPushResponseDTO> push(
            @Valid @RequestBody SyncPushRequestDTO request) {

        log.info("[Sync API] POST /api/v1/sync/push — Lote de {} venta(s) recibido.",
                 request.ventas().size());

        SyncPushResponseDTO respuesta = sincronizacionService.procesarLote(request.ventas());

        return ResponseEntity.ok(respuesta);
    }

    /**
     * GET /api/v1/sync/health
     *
     * Endpoint de verificación de disponibilidad del servicio de sincronización.
     * El frontend lo consulta antes de intentar el push para confirmar conectividad.
     *
     * @return 200 OK con mensaje de estado
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("TOKO ERP Sync API operativa. Lista para recibir ventas offline.");
    }
}
