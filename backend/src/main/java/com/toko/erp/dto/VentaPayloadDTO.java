package com.toko.erp.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * ============================================================================
 * DTO: PAYLOAD DE VENTA INDIVIDUAL
 * ============================================================================
 * Mapea exactamente la interfaz VentaRealizada del modelo TypeScript del
 * frontend (src/models/venta.model.ts). Los nombres de campo deben coincidir
 * con las claves del JSON serializado por Dexie.js.
 *
 * CONVENCIÓN: Se usa camelCase para compatibilidad directa con JSON del frontend.
 */
public record VentaPayloadDTO(

    /** UUID generado por el cliente (campo 'id' de VentaRealizada). */
    @NotBlank(message = "El ID de la venta es obligatorio")
    String id,

    /** Número de ticket correlativo (ej: T0001-000123). */
    @NotBlank(message = "El número de ticket es obligatorio")
    @Size(max = 30)
    String numeroTicket,

    /**
     * Fecha y hora en formato ISO 8601 con zona horaria.
     * Ejemplo: "2024-03-15T10:30:00-03:00"
     */
    @NotBlank(message = "La fecha y hora son obligatorias")
    String fechaHora,

    /**
     * Canal de origen de la venta.
     * Valores aceptados: POS_MOSTRADOR | PREVENTA_CALLE
     */
    @NotBlank(message = "El tipo de operación es obligatorio")
    String tipoOperacion,

    /**
     * Datos del cliente receptor.
     * Se envía el objeto completo para resolución tolerante a fallos:
     * si el cliente no existe en PostgreSQL, el servicio puede crearlo o
     * vincularlo por ID sin requerir una segunda consulta.
     */
    @NotNull(message = "Los datos del cliente son obligatorios")
    ClientePayloadDTO cliente,

    /** Lista de ítems del ticket. Debe tener al menos un artículo. */
    @NotEmpty(message = "El ticket debe contener al menos un ítem")
    @Valid
    List<ItemCarritoDTO> items,

    /** Sumatoria de subtotales antes de descuento. */
    @NotNull @DecimalMin("0.00")
    BigDecimal subtotal,

    /** Porcentaje de descuento aplicado (0.00 - 100.00). */
    @NotNull @DecimalMin("0.00") @DecimalMax("100.00")
    BigDecimal descuentoPorcentaje,

    /** Total definitivo de la transacción. */
    @NotNull @DecimalMin("0.00")
    BigDecimal total,

    /**
     * Método de pago utilizado.
     * EFECTIVO | DEBITO | CREDITO | TRANSFERENCIA_QR | CUENTA_CORRIENTE
     */
    @NotBlank(message = "El método de pago es obligatorio")
    String metodoPago,

    /** Nombre del cajero o preventista responsable. */
    @NotBlank(message = "El nombre del vendedor es obligatorio")
    @Size(max = 100)
    String vendedor
) {}
