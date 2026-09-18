package com.toko.erp.service;

import com.toko.erp.dto.*;
import com.toko.erp.dto.SyncPushResponseDTO.ResultadoVentaDTO;
import com.toko.erp.entity.Cliente;
import com.toko.erp.entity.Producto;
import com.toko.erp.entity.Venta;
import com.toko.erp.entity.VentaItem;
import com.toko.erp.repository.ClienteRepository;
import com.toko.erp.repository.ProductoRepository;
import com.toko.erp.repository.VentaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * ============================================================================
 * SERVICIO: SINCRONIZACIÓN DE VENTAS OFFLINE
 * ============================================================================
 * Procesa el lote de ventas de la cola Outbox enviado por el frontend.
 *
 * FLUJO POR CADA VENTA DEL LOTE:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ 1. IDEMPOTENCIA: ¿Ya existe el UUID en ventas?                         │
 * │       Sí → retorna ALREADY_PROCESSED (no duplica la venta)             │
 * │       No → continúa                                                    │
 * │                                                                        │
 * │ 2. RESOLUCIÓN DE CLIENTE: Busca por UUID en clientes                   │
 * │       No encontrado → retorna REJECTED                                 │
 * │                                                                        │
 * │ 3. PROCESAMIENTO DE ÍTEMS (por cada ítem del ticket):                  │
 * │    a. Buscar Producto con SELECT FOR UPDATE (lock pesimista)            │
 * │    b. Si no existe → REJECTED (producto desconocido)                   │
 * │    c. stockResultante = stockActual - cantidad                         │
 * │    d. Descontar siempre (permite negativos — regla BACKORDER)          │
 * │    e. Si stockResultante < 0 → marcar venta como BACKORDER             │
 * │                                                                        │
 * │ 4. PERSISTENCIA: Guardar Venta + VentaItems en una @Transactional      │
 * │                                                                        │
 * │ 5. CUENTA CORRIENTE: Si metodoPago = CUENTA_CORRIENTE, acumular deuda  │
 * │                                                                        │
 * │ 6. RETORNO: ResultadoVentaDTO con estado y productos en backorder       │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SincronizacionService {

    private final VentaRepository     ventaRepository;
    private final ClienteRepository   clienteRepository;
    private final ProductoRepository  productoRepository;

    // Estados de resultado para el DTO de respuesta
    private static final String ESTADO_ACCEPTED             = "ACCEPTED";
    private static final String ESTADO_BACKORDER            = "ACCEPTED_WITH_BACKORDER";
    private static final String ESTADO_REJECTED             = "REJECTED";
    private static final String ESTADO_ALREADY_PROCESSED    = "ALREADY_PROCESSED";

    /**
     * Procesa un lote de ventas offline enviadas por el frontend.
     * Cada venta se procesa en su propia transacción para garantizar que
     * un fallo en una venta no revierta las demás del lote.
     *
     * @param ventas Lista de ventas del payload enviado por Dexie.js
     * @return SyncPushResponseDTO con el resultado individual de cada venta
     */
    public SyncPushResponseDTO procesarLote(List<VentaPayloadDTO> ventas) {
        log.info("[Sync] Recibiendo lote de {} venta(s) para procesar.", ventas.size());

        List<ResultadoVentaDTO> resultados = new ArrayList<>();

        for (VentaPayloadDTO ventaDto : ventas) {
            ResultadoVentaDTO resultado = procesarVentaIndividual(ventaDto);
            resultados.add(resultado);
        }

        long aceptadas = resultados.stream()
                .filter(r -> r.estadoResultado().startsWith("ACCEPTED"))
                .count();

        log.info("[Sync] Lote procesado: {}/{} ventas aceptadas.", aceptadas, ventas.size());

        return new SyncPushResponseDTO((int) aceptadas, resultados);
    }

    /**
     * Procesa una venta individual dentro de una transacción propia.
     *
     * La anotación @Transactional aquí garantiza que el descuento de stock
     * y la persistencia de la venta sean atómicos. Si falla la persistencia,
     * el stock no queda decrementado.
     *
     * @param dto Datos de la venta enviada por el frontend
     * @return Resultado del procesamiento para este UUID
     */
    @Transactional
    public ResultadoVentaDTO procesarVentaIndividual(VentaPayloadDTO dto) {
        UUID ventaId = UUID.fromString(dto.id());

        // ── 1. IDEMPOTENCIA: verificar si ya fue procesada ────────────────────
        if (ventaRepository.existsById(ventaId)) {
            log.warn("[Sync] Venta {} ya existe en BD (reintento idempotente).", dto.id());
            return new ResultadoVentaDTO(
                dto.id(),
                ESTADO_ALREADY_PROCESSED,
                "La venta ya fue procesada anteriormente. No se duplicó.",
                null
            );
        }

        // ── 2. RESOLVER CLIENTE ───────────────────────────────────────────────
        UUID clienteId = UUID.fromString(dto.cliente().id());
        Optional<Cliente> clienteOpt = clienteRepository.findById(clienteId);

        if (clienteOpt.isEmpty()) {
            log.error("[Sync] Cliente {} no encontrado en BD para venta {}.",
                      dto.cliente().id(), dto.id());
            return new ResultadoVentaDTO(
                dto.id(),
                ESTADO_REJECTED,
                "Cliente con ID '" + dto.cliente().id() + "' no encontrado en el sistema.",
                null
            );
        }

        Cliente cliente = clienteOpt.get();

        // ── 3. PROCESAR ÍTEMS Y APLICAR REGLA DE BACKORDER ───────────────────
        List<VentaItem> itemsEntity      = new ArrayList<>();
        List<String>   productosBackorder = new ArrayList<>();
        boolean        hayBackorder       = false;

        for (ItemCarritoDTO itemDto : dto.items()) {
            UUID productoId = UUID.fromString(itemDto.productoId());

            // SELECT FOR UPDATE: bloqueo pesimista para evitar condición de carrera
            Optional<Producto> productoOpt = productoRepository.findByIdForUpdate(productoId);

            if (productoOpt.isEmpty()) {
                log.error("[Sync] Producto {} no encontrado. Venta {} RECHAZADA.",
                          itemDto.productoId(), dto.id());
                return new ResultadoVentaDTO(
                    dto.id(),
                    ESTADO_REJECTED,
                    "Producto '" + itemDto.productoNombre() + "' (ID: " +
                    itemDto.productoId() + ") no existe en el catálogo.",
                    null
                );
            }

            Producto producto = productoOpt.get();

            // ── REGLA CENTRAL DE BACKORDER ────────────────────────────────────
            // Se descuenta SIEMPRE, incluso si el resultado es negativo.
            // Esto prioriza la continuidad operativa del vendedor sobre la
            // exactitud del inventario en tiempo real. El encargado de depósito
            // recibe la alerta de reposición a través del campo productosBackorder.
            int stockAnterior  = producto.getStockActual();
            int stockResultante = stockAnterior - itemDto.cantidad();

            producto.setStockActual(stockResultante);
            productoRepository.save(producto);

            log.debug("[Sync] Producto '{}': stock {} → {} (backorder: {}).",
                      producto.getNombre(), stockAnterior, stockResultante,
                      stockResultante < 0 ? "SÍ" : "NO");

            if (stockResultante < 0) {
                hayBackorder = true;
                productosBackorder.add(producto.getId().toString());
                log.warn("[Sync] BACKORDER: '{}' quedó con stock {}.",
                         producto.getNombre(), stockResultante);
            }

            // Construir entidad VentaItem (sin venta aún, se asigna más adelante)
            VentaItem item = VentaItem.builder()
                .id(UUID.fromString(itemDto.id()))
                .producto(producto)
                .cantidad(itemDto.cantidad())
                .precioUnitario(itemDto.precioUnitario())
                .subtotal(itemDto.subtotal())
                .build();

            itemsEntity.add(item);
        }

        // ── 4. CONSTRUIR Y PERSISTIR LA VENTA ────────────────────────────────
        String estadoFinal = hayBackorder ? ESTADO_BACKORDER : ESTADO_ACCEPTED;

        Venta venta = Venta.builder()
            .id(ventaId)
            .numeroTicket(dto.numeroTicket())
            .fechaHora(OffsetDateTime.parse(dto.fechaHora()))
            .tipoOperacion(dto.tipoOperacion())
            .cliente(cliente)
            .subtotal(dto.subtotal())
            .descuentoPorcentaje(dto.descuentoPorcentaje())
            .total(dto.total())
            .metodoPago(dto.metodoPago())
            .vendedor(dto.vendedor())
            .estadoSync(estadoFinal)
            .build();

        // Asignar la referencia bidireccional venta ↔ items
        itemsEntity.forEach(item -> item.setVenta(venta));
        venta.getItems().addAll(itemsEntity);

        ventaRepository.save(venta);

        // ── 5. CUENTA CORRIENTE ───────────────────────────────────────────────
        // Si el pago fue a cuenta corriente, acumular la deuda en el saldo del cliente.
        // Saldo negativo = deuda del cliente (convención del modelo de datos).
        if ("CUENTA_CORRIENTE".equals(dto.metodoPago())) {
            cliente.setSaldoCuentaCorriente(
                cliente.getSaldoCuentaCorriente().subtract(dto.total())
            );
            clienteRepository.save(cliente);
            log.info("[Sync] Cuenta corriente de '{}' actualizada. Nuevo saldo: {}.",
                     cliente.getNombre(), cliente.getSaldoCuentaCorriente());
        }

        // ── 6. RETORNAR RESULTADO ─────────────────────────────────────────────
        String mensaje = hayBackorder
            ? String.format(
                "Venta registrada con BACKORDER. %d producto(s) quedaron con stock negativo. " +
                "Se requiere reposición urgente.",
                productosBackorder.size())
            : "Venta procesada y stock descontado correctamente.";

        log.info("[Sync] Venta {} → {}.", dto.id(), estadoFinal);

        return new ResultadoVentaDTO(
            dto.id(),
            estadoFinal,
            mensaje,
            hayBackorder ? productosBackorder : null
        );
    }
}
