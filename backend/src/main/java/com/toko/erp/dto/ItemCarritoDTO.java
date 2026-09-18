package com.toko.erp.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/**
 * ============================================================================
 * DTO: ÍTEM DE CARRITO (Línea del ticket)
 * ============================================================================
 * Mapea la interfaz ItemCarrito del frontend (src/models/venta.model.ts).
 * Cada ítem referencia el producto por su UUID (generado en el cliente)
 * y registra cantidad, precio unitario y subtotal calculados offline.
 */
public record ItemCarritoDTO(

    /** UUID del ítem de carrito, generado en el cliente. */
    @NotBlank(message = "El ID del ítem es obligatorio")
    String id,

    /**
     * UUID del producto vendido.
     * El servidor resuelve la entidad Producto por este ID.
     * Si no lo encuentra, la venta es marcada como REJECTED.
     */
    @NotBlank(message = "El ID del producto es obligatorio")
    String productoId,

    /** Nombre del producto (snapshot al momento de la venta, para logs). */
    String productoNombre,

    /** Cantidad vendida de este producto. Mínimo 1 unidad. */
    @NotNull
    @Min(value = 1, message = "La cantidad debe ser mayor a 0")
    Integer cantidad,

    /**
     * Precio unitario aplicado en el momento de la venta.
     * Se preserva para auditoría histórica aunque el catálogo cambie.
     */
    @NotNull @DecimalMin("0.00")
    BigDecimal precioUnitario,

    /** Subtotal de la línea: cantidad × precioUnitario. */
    @NotNull @DecimalMin("0.00")
    BigDecimal subtotal
) {}
