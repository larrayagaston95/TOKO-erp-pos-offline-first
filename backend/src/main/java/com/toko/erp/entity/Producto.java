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
 * ENTIDAD: PRODUCTO
 * ============================================================================
 * Representa un artículo del catálogo comercial en PostgreSQL.
 *
 * DISEÑO OFFLINE-FIRST:
 * El ID es un UUID generado por el cliente (frontend Dexie.js) antes de
 * sincronizar. Esto evita conflictos de PK y permite operar sin conexión.
 * Se usa 'updatable = false' para proteger la clave primaria una vez persistida.
 */
@Entity
@Table(name = "productos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Producto {

    /**
     * Clave primaria: UUID nativo de PostgreSQL, generado en el cliente.
     * columnDefinition = "uuid" activa el tipo UUID real de PostgreSQL (no varchar).
     */
    @Id
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    /** Código EAN-13 para pistola láser. Debe ser único en el sistema. */
    @Column(name = "codigo_barra", unique = true, nullable = false, length = 20)
    private String codigoBarra;

    /** Nombre comercial descriptivo del artículo. */
    @Column(nullable = false, length = 200)
    private String nombre;

    /**
     * Categoría de agrupamiento para filtrado rápido.
     * Almacenada como texto para facilidad de consultas ad-hoc.
     */
    @Column(nullable = false, length = 50)
    private String categoria;

    /** Precio de venta en mostrador al consumidor final. */
    @Column(name = "precio_mostrador", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioMostrador;

    /** Precio especial para canales de distribución y preventistas. */
    @Column(name = "precio_mayorista", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioMayorista;

    /**
     * Stock físico disponible en depósito central.
     * PUEDE SER NEGATIVO: la regla de Backorder lo permite para no bloquear
     * al vendedor en campo cuando hay desfasaje de inventario.
     */
    @Column(name = "stock_actual", nullable = false)
    private Integer stockActual;

    /** Umbral de advertencia de reposición. */
    @Column(name = "stock_minimo", nullable = false)
    private Integer stockMinimo;

    /** Unidad de comercialización: UNIDAD, KG o PACK. */
    @Column(name = "unidad_medida", nullable = false, length = 10)
    private String unidadMedida;
}
