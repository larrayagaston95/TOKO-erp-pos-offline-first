package com.toko.erp.repository;

import com.toko.erp.entity.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * ============================================================================
 * REPOSITORIO: VENTA
 * ============================================================================
 * Acceso a datos del historial de transacciones comerciales en PostgreSQL.
 *
 * IDEMPOTENCIA DE SINCRONIZACIÓN:
 * El método existsById (heredado de JpaRepository) es clave para la
 * lógica de reintentos del frontend: si el UUID ya existe en la BD,
 * SincronizacionService omite el reprocesamiento y retorna el resultado
 * previo, evitando ventas duplicadas en caso de timeout de red.
 */
@Repository
public interface VentaRepository extends JpaRepository<Venta, UUID> {

    /**
     * Verifica si un número de ticket ya fue registrado en el sistema.
     * Útil para detectar colisiones de numeración entre terminales.
     *
     * @param numeroTicket Número de ticket a verificar
     * @return true si el ticket ya existe en la base de datos
     */
    boolean existsByNumeroTicket(String numeroTicket);
}
