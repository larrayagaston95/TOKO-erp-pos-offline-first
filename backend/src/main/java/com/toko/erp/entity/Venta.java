package com.toko.erp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * ============================================================================
 * ENTIDAD: VENTA (Cabecera del ticket)
 * ============================================================================
 * Representa el encabezado de una transacción comercial completada, ya sea
 * de mostrador (POS_MOSTRADOR) o de preventa en calle (PREVENTA_CALLE).
 *
 * DISEÑO OFFLINE-FIRST:
 * El UUID es generado por el cliente antes de sincronizar. Si el servidor
 * ya tiene ese ID (retry del frontend), devuelve la respuesta original sin
 * duplicar la venta (idempotencia por UUID).
 *
 * RELACIONES:
 * - ManyToOne con Cliente (FK no nula, la venta siempre tiene un receptor)
 * - OneToMany con VentaItem (detalle de líneas del ticket)
 */
@Entity
@Table(name = "ventas", indexes = {
    @Index(name = "idx_ventas_numero_ticket", columnList = "numero_ticket"),
    @Index(name = "idx_ventas_fecha_hora",    columnList = "fecha_hora"),
    @Index(name = "idx_ventas_estado_sync",   columnList = "estado_sync")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Venta {

    /** UUID generado por el cliente offline, clave primaria nativa en PostgreSQL. */
    @Id
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    /**
     * Número de ticket correlativo generado por el cajero/preventista.
     * Formato: T{nroTerminal}-{secuencia} — ej: T0001-000123.
     */
    @Column(name = "numero_ticket", nullable = false, unique = true, length = 30)
    private String numeroTicket;

    /** Timestamp de creación con zona horaria (generado en el cliente). */
    @Column(name = "fecha_hora", nullable = false)
    private OffsetDateTime fechaHora;

    /**
     * Canal de origen de la transacción.
     * POS_MOSTRADOR | PREVENTA_CALLE
     */
    @Column(name = "tipo_operacion", nullable = false, length = 20)
    private String tipoOperacion;

    /** Cliente receptor de la venta. Obligatorio para trazabilidad. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false,
                columnDefinition = "uuid",
                foreignKey = @ForeignKey(name = "fk_ventas_cliente"))
    private Cliente cliente;

    /** Sumatoria de subtotales antes de aplicar descuento. */
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal subtotal;

    /** Porcentaje de descuento comercial aplicado (0 - 100). */
    @Column(name = "descuento_porcentaje", nullable = false, precision = 5, scale = 2)
    private BigDecimal descuentoPorcentaje;

    /** Total definitivo abonado o adeudado por el cliente. */
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal total;

    /**
     * Método de pago utilizado.
     * EFECTIVO | DEBITO | CREDITO | TRANSFERENCIA_QR | CUENTA_CORRIENTE
     */
    @Column(name = "metodo_pago", nullable = false, length = 20)
    private String metodoPago;

    /** Nombre del cajero o preventista responsable de la operación. */
    @Column(nullable = false, length = 100)
    private String vendedor;

    /**
     * Estado de resolución de sincronización.
     * ACCEPTED            → Stock suficiente, procesada normalmente.
     * ACCEPTED_WITH_BACKORDER → Stock insuficiente, inventario en negativo.
     *                           El sistema alertará al encargado de reposición.
     * REJECTED            → Error de validación crítico (ej: producto inexistente).
     */
    @Column(name = "estado_sync", nullable = false, length = 30)
    private String estadoSync;

    /**
     * Detalle de los artículos que componen el ticket.
     * CascadeType.ALL: los VentaItem se persisten junto con la Venta.
     * orphanRemoval: si se quita un ítem de la lista, se borra de la BD.
     */
    @OneToMany(mappedBy = "venta", cascade = CascadeType.ALL,
               orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<VentaItem> items = new ArrayList<>();
}
