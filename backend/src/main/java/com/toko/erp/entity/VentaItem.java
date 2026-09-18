package com.toko.erp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * ============================================================================
 * ENTIDAD: VENTA ITEM (Línea del ticket)
 * ============================================================================
 * Representa una línea de detalle dentro de un ticket de venta.
 * Cada VentaItem registra qué producto, en qué cantidad y a qué precio
 * fue vendido en esa transacción particular.
 *
 * DISEÑO:
 * El ID también es un UUID generado en el cliente (campo 'id' de ItemCarrito
 * en el modelo TypeScript). Esto garantiza idempotencia en reintentos de sync.
 *
 * RELACIÓN:
 * - ManyToOne con Venta (cabecera del ticket)
 * - ManyToOne con Producto (referencia al catálogo, lazy para eficiencia)
 */
@Entity
@Table(name = "venta_items", indexes = {
    @Index(name = "idx_venta_items_venta_id",    columnList = "venta_id"),
    @Index(name = "idx_venta_items_producto_id", columnList = "producto_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VentaItem {

    /** UUID del ítem de carrito, generado en el cliente antes de sincronizar. */
    @Id
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    /**
     * Venta cabecera a la que pertenece este ítem.
     * La FK se resuelve por el campo 'venta_id' en la tabla venta_items.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "venta_id", nullable = false,
                columnDefinition = "uuid",
                foreignKey = @ForeignKey(name = "fk_venta_items_venta"))
    private Venta venta;

    /**
     * Producto vendido. Referencia al catálogo centralizado.
     * Si un producto fue eliminado después de la venta, el ítem histórico
     * lo conserva para trazabilidad.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "producto_id", nullable = false,
                columnDefinition = "uuid",
                foreignKey = @ForeignKey(name = "fk_venta_items_producto"))
    private Producto producto;

    /** Unidades vendidas del producto en esta línea. */
    @Column(nullable = false)
    private Integer cantidad;

    /**
     * Precio unitario aplicado en el momento de la venta.
     * Se guarda para preservar el precio histórico, incluso si el catálogo
     * cambia posteriormente.
     */
    @Column(name = "precio_unitario", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioUnitario;

    /** Subtotal de la línea: cantidad × precioUnitario. */
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal subtotal;
}
