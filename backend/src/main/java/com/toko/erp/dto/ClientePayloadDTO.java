package com.toko.erp.dto;

/**
 * ============================================================================
 * DTO: DATOS DEL CLIENTE DENTRO DEL PAYLOAD DE VENTA
 * ============================================================================
 * El frontend envía el objeto Cliente completo embebido en cada venta.
 * Esto garantiza que el servidor pueda procesar la transacción incluso si
 * el cliente aún no fue sincronizado de forma independiente (tolerancia a fallos).
 */
public record ClientePayloadDTO(

    /** UUID del cliente, generado en el cliente offline. */
    String id,

    /** Código comercial visible (ej: CLI-0042). */
    String codigo,

    /** Nombre o Razón Social. */
    String nombre,

    /** CUIT, CUIL o DNI. */
    String documento,

    /** Tipo: CONSUMIDOR_FINAL | COMERCIO_MINORISTA | DISTRIBUIDOR */
    String tipo
) {}
