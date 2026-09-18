package com.toko.erp.repository;

import com.toko.erp.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * ============================================================================
 * REPOSITORIO: CLIENTE
 * ============================================================================
 * Acceso a datos de la cartera de clientes en PostgreSQL.
 */
@Repository
public interface ClienteRepository extends JpaRepository<Cliente, UUID> {

    /**
     * Busca un cliente por su código comercial visible (ej: CLI-0042).
     * Útil para búsquedas de preventistas desde la app móvil.
     *
     * @param codigo Código comercial del cliente
     * @return Optional con el Cliente encontrado
     */
    Optional<Cliente> findByCodigo(String codigo);

    /**
     * Verifica si existe un cliente con el documento dado.
     * Usado para validar duplicados en el alta de nuevos clientes.
     *
     * @param documento CUIT/CUIL/DNI a verificar
     * @return true si ya existe un cliente con ese documento
     */
    boolean existsByDocumento(String documento);
}
