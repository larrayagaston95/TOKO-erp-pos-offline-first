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
 * ENTIDAD: CLIENTE
 * ============================================================================
 * Representa un cliente de la cartera comercial en PostgreSQL.
 * Incluye datos de cuentas corrientes y lista de precios asignada.
 *
 * DISEÑO OFFLINE-FIRST:
 * El ID es un UUID generado por el frontend. El campo 'codigo' es el
 * identificador alfanumérico visible para el operador (ej: CLI-0042).
 */
@Entity
@Table(name = "clientes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Cliente {

    /** Clave primaria UUID nativa de PostgreSQL, generada en el cliente offline. */
    @Id
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    /** Código comercial visible para el operador (ej: CLI-0042). Único. */
    @Column(nullable = false, unique = true, length = 20)
    private String codigo;

    /** Nombre o Razón Social del cliente. */
    @Column(nullable = false, length = 200)
    private String nombre;

    /** CUIT, CUIL o DNI del cliente. */
    @Column(nullable = false, length = 20)
    private String documento;

    /**
     * Tipo de cliente.
     * CONSUMIDOR_FINAL | COMERCIO_MINORISTA | DISTRIBUIDOR
     */
    @Column(nullable = false, length = 25)
    private String tipo;

    /** Teléfono de contacto. */
    @Column(length = 30)
    private String telefono;

    /** Dirección física o del local comercial. */
    @Column(length = 200)
    private String direccion;

    /** Zona o ruta de entrega asignada al preventista. */
    @Column(name = "zona_ruta", length = 80)
    private String zonaRuta;

    /**
     * Lista de precios por defecto asignada al cliente.
     * MOSTRADOR | MAYORISTA
     */
    @Column(name = "lista_precio_por_defecto", nullable = false, length = 12)
    private String listaPrecioPorDefecto;

    /**
     * Saldo de la cuenta corriente. Valor negativo indica deuda del cliente.
     * Se actualiza al procesar ventas con método de pago CUENTA_CORRIENTE.
     */
    @Column(name = "saldo_cuenta_corriente", nullable = false, precision = 14, scale = 2)
    private BigDecimal saldoCuentaCorriente;

    /** Límite máximo de crédito autorizado para compras a plazo. */
    @Column(name = "limite_credito", nullable = false, precision = 14, scale = 2)
    private BigDecimal limiteCredito;
}
