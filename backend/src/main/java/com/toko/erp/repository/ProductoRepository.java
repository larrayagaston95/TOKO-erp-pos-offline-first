package com.toko.erp.repository;

import com.toko.erp.entity.Producto;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * ============================================================================
 * REPOSITORIO: PRODUCTO
 * ============================================================================
 * Acceso a datos del catálogo de artículos en PostgreSQL.
 *
 * NOTA IMPORTANTE — PESSIMISTIC_WRITE:
 * El método findByIdForUpdate aplica un SELECT FOR UPDATE de PostgreSQL.
 * Esto garantiza que durante la lógica de Backorder en SincronizacionService,
 * dos transacciones concurrentes no lean el mismo stock simultáneamente y
 * generen una condición de carrera al descontar unidades.
 */
@Repository
public interface ProductoRepository extends JpaRepository<Producto, UUID> {

    /**
     * Busca un producto por su UUID y adquiere un lock pesimista de escritura.
     * Usado exclusivamente dentro de @Transactional en SincronizacionService
     * para garantizar consistencia del stock durante el procesamiento de ventas.
     *
     * @param id UUID del producto a bloquear
     * @return Optional con el Producto bloqueado, o vacío si no existe
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Producto p WHERE p.id = :id")
    Optional<Producto> findByIdForUpdate(@Param("id") UUID id);

    /**
     * Búsqueda por código de barras EAN para el flujo de venta rápida.
     *
     * @param codigoBarra Código EAN-13
     * @return Optional con el Producto encontrado
     */
    Optional<Producto> findByCodigoBarra(String codigoBarra);
}
