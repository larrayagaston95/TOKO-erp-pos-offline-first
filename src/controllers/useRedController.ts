/**
 * ============================================================================
 * CONTROLADOR: ESTADO DE RED Y CONECTIVIDAD (useRedController)
 * ============================================================================
 * Este hook/controlador supervisa el estado de conexión a internet real del
 * navegador mediante la API 'navigator.onLine' y escucha los eventos nativos
 * 'online' y 'offline'.
 *
 * También incluye la capacidad de alternar una simulación manual para que el
 * usuario pueda probar el comportamiento offline en cualquier momento.
 *
 * SINCRONIZACIÓN OFFLINE-FIRST:
 * La función sincronizarColaOffline envía el lote de ventas pendientes al
 * backend Spring Boot (POST /api/v1/sync/push) y procesa los resultados
 * para actualizar el estado local en Dexie/IndexedDB.
 */

import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

// ─── Tipos para la respuesta del backend ──────────────────────────────────────

/**
 * Estado de resolución retornado por el backend para cada venta del lote.
 * Definido en SyncPushResponseDTO.ResultadoVentaDTO (Spring Boot).
 */
type EstadoResultadoBackend =
  | 'ACCEPTED'               // Stock suficiente, procesada con normalidad
  | 'ACCEPTED_WITH_BACKORDER' // Stock insuficiente, inventario en negativo — alertar reposición
  | 'ALREADY_PROCESSED'      // UUID ya existía en la BD (reintento idempotente)
  | 'REJECTED';              // Error crítico, venta no procesada

interface ResultadoVentaBackend {
  ventaId:               string;
  estadoResultado:       EstadoResultadoBackend;
  mensaje:               string;
  productosConBackorder: string[] | null;
}

interface SyncPushResponse {
  procesadas: number;
  resultados: ResultadoVentaBackend[];
}

// ─── URL base del backend (configurable por variable de entorno Vite) ─────────
//
// Para desarrollo local: definir VITE_BACKEND_URL=http://localhost:8080 en .env
// Para producción: apuntar a la instancia Spring Boot desplegada.
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? 'http://localhost:8080';
const SYNC_ENDPOINT = `${BACKEND_URL}/api/v1/sync/push`;

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useRedController() {
  // Estado real de conectividad detectado por el navegador
  const [estaOnline, setEstaOnline] = useState<boolean>(navigator.onLine);

  // Modo de simulación manual para pruebas del operador
  const [modoOfflineForzado, setModoOfflineForzado] = useState<boolean>(false);

  // Contador en tiempo real de transacciones pendientes en la cola local de Dexie
  const operacionesPendientesDb = useLiveQuery(
    () => db.sync_outbox.where('estado').equals('PENDIENTE').count(),
    []
  );

  const operacionesPendientes = operacionesPendientesDb ?? 0;

  useEffect(() => {
    /** Manejador para el evento cuando se restablece la conexión a internet. */
    const manejarConexionOnline = () => setEstaOnline(true);

    /** Manejador para el evento cuando se pierde la conexión a internet. */
    const manejarConexionOffline = () => setEstaOnline(false);

    window.addEventListener('online', manejarConexionOnline);
    window.addEventListener('offline', manejarConexionOffline);

    // Limpieza de listeners al desmontar el controlador
    return () => {
      window.removeEventListener('online', manejarConexionOnline);
      window.removeEventListener('offline', manejarConexionOffline);
    };
  }, []);

  /**
   * Determina si el sistema opera en modo en línea efectivo.
   * Si el usuario activó la simulación forzada, responderá como desconectado.
   */
  const estadoEfectivoOnline = estaOnline && !modoOfflineForzado;

  /**
   * Permite alternar la simulación de desconexión sin necesidad de
   * desconectar el cable de red. Útil para pruebas en campo.
   */
  const toggleSimulacionDesconexion = () => {
    setModoOfflineForzado(prev => !prev);
  };

  /**
   * Compatibilidad: notificación de registro offline.
   * La reactividad de IndexedDB ya actualiza el contador automáticamente.
   */
  const registrarOperacionOffline = () => {
    // no-op: useLiveQuery maneja la reactividad
  };

  /**
   * ============================================================================
   * FUNCIÓN PRINCIPAL: SINCRONIZACIÓN OFFLINE → BACKEND SPRING BOOT
   * ============================================================================
   *
   * FLUJO PASO A PASO:
   *
   * 1. Lee db.sync_outbox donde estado = 'PENDIENTE'
   * 2. Si cola vacía → retorna 0
   * 3. Marca ítems como 'EN_PROCESO' (guard contra doble envío concurrente)
   * 4. Construye el JSON del lote alineado con SyncPushRequestDTO:
   *    - Aplana ItemCarrito.producto → productoId (string UUID)
   *    - Extrae campos mínimos del Cliente embebido
   * 5. POST ${VITE_BACKEND_URL}/api/v1/sync/push
   *
   * RESPUESTA EXITOSA (2xx):
   *    Por cada ResultadoVentaDTO del array 'resultados':
   *    · ACCEPTED / ACCEPTED_WITH_BACKORDER / ALREADY_PROCESSED
   *        → sync_outbox.estado = 'SINCRONIZADO'
   *        → ventas.estadoSync  = 'SINCRONIZADO'
   *    · REJECTED
   *        → sync_outbox.estado = 'FALLIDO'
   *        → sync_outbox.ultimoError = mensaje del servidor
   *
   * FALLO DE RED (fetch lanza o respuesta no-2xx):
   *    → Revierte 'EN_PROCESO' a 'PENDIENTE'
   *    → Registra el error en ultimoError para diagnóstico
   *    → Incrementa contador de intentos
   *    → Los ítems quedan listos para el próximo reintento automático
   *
   * @returns Número de ventas sincronizadas exitosamente en esta llamada
   */
  const sincronizarColaOffline = useCallback(async (): Promise<number> => {

    // ── 1. Leer cola de pendientes ─────────────────────────────────────────
    const pendientes = await db.sync_outbox
      .where('estado')
      .equals('PENDIENTE')
      .toArray();

    if (pendientes.length === 0) return 0;

    console.log(`[Sync] Iniciando sincronización de ${pendientes.length} operación(es) pendiente(s).`);

    // ── 2. Marcar como EN_PROCESO (guard ante doble envío) ─────────────────
    await db.sync_outbox.bulkUpdate(
      pendientes.map(item => ({
        key:     item.id,
        changes: { estado: 'EN_PROCESO' as const },
      }))
    );

    // ── 3. Construir payload alineado con SyncPushRequestDTO ───────────────
    //
    // VentaRealizada (Dexie)              SyncPushRequestDTO (Spring Boot)
    // ─────────────────────────           ────────────────────────────────
    // item.payload.id             →       ventas[].id
    // item.payload.cliente        →       ventas[].cliente { id, codigo, nombre, documento, tipo }
    // item.payload.items[].producto.id  → ventas[].items[].productoId
    // item.payload.items[].producto.nombre → ventas[].items[].productoNombre
    const ventasPayload = pendientes.map(item => {
      const v = item.payload; // VentaRealizada almacenada en IndexedDB

      return {
        id:                  v.id,
        numeroTicket:        v.numeroTicket,
        fechaHora:           v.fechaHora,
        tipoOperacion:       v.tipoOperacion,
        // ClientePayloadDTO: solo los campos que el backend necesita para resolver la FK
        cliente: {
          id:        v.cliente.id,
          codigo:    v.cliente.codigo,
          nombre:    v.cliente.nombre,
          documento: v.cliente.documento,
          tipo:      v.cliente.tipo,
        },
        // ItemCarritoDTO: aplanar objeto Producto a sus campos individuales
        items: v.items.map(i => ({
          id:             i.id,
          productoId:     i.producto.id,
          productoNombre: i.producto.nombre,
          cantidad:       i.cantidad,
          precioUnitario: i.precioUnitario,
          subtotal:       i.subtotal,
        })),
        subtotal:            v.subtotal,
        descuentoPorcentaje: v.descuentoPorcentaje,
        total:               v.total,
        metodoPago:          v.metodoPago,
        vendedor:            v.vendedor,
      };
    });

    // ── 4. Enviar lote al backend Spring Boot ──────────────────────────────
    try {
      const respuesta = await fetch(SYNC_ENDPOINT, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ventas: ventasPayload }),
      });

      // ── Respuesta no-2xx: tratar como error recuperable ──────────────────
      if (!respuesta.ok) {
        const textoError = await respuesta.text().catch(() => `HTTP ${respuesta.status}`);
        throw new Error(`Error del servidor ${respuesta.status}: ${textoError}`);
      }

      // ── 5. Parsear SyncPushResponseDTO ────────────────────────────────────
      const respuestaJson = (await respuesta.json()) as SyncPushResponse;

      // ── 6. Actualizar IndexedDB según el resultado de cada venta ──────────
      // Índice O(1): payload.id → item de outbox correspondiente
      const mapaOutbox = new Map(pendientes.map(p => [p.payload.id, p]));

      await db.transaction('rw', db.sync_outbox, db.ventas, async () => {
        for (const resultado of respuestaJson.resultados) {
          const outboxItem = mapaOutbox.get(resultado.ventaId);
          if (!outboxItem) continue; // Resultado para un ID que no enviamos (ignorar)

          const fueAceptada =
            resultado.estadoResultado === 'ACCEPTED' ||
            resultado.estadoResultado === 'ACCEPTED_WITH_BACKORDER' ||
            resultado.estadoResultado === 'ALREADY_PROCESSED';

          if (fueAceptada) {
            // Marcar la entrada de la cola como sincronizada
            await db.sync_outbox.update(outboxItem.id, {
              estado:   'SINCRONIZADO' as const,
              intentos: outboxItem.intentos + 1,
            });
            // Reflejar el nuevo estado en la tabla de ventas (visibilidad en historial)
            await db.ventas.update(outboxItem.referenciaId, {
              estadoSync: 'SINCRONIZADO' as const,
            });

            if (resultado.estadoResultado === 'ACCEPTED_WITH_BACKORDER') {
              // Aviso importante: hay productos que requieren reposición urgente
              console.warn(
                `[Sync] ⚠ BACKORDER — Venta ${resultado.ventaId}: ${resultado.mensaje}`,
                'Productos afectados:', resultado.productosConBackorder
              );
            } else {
              console.log(`[Sync] ✓ Venta ${resultado.ventaId} → ${resultado.estadoResultado}`);
            }
          } else {
            // REJECTED: error de negocio, no se reintenta automáticamente
            await db.sync_outbox.update(outboxItem.id, {
              estado:      'FALLIDO'  as const,
              intentos:    outboxItem.intentos + 1,
              ultimoError: resultado.mensaje,
            });
            console.error(
              `[Sync] ✗ Venta ${resultado.ventaId} RECHAZADA por el servidor: ${resultado.mensaje}`
            );
          }
        }
      });

      const sincronizadas = respuestaJson.resultados.filter(
        r => r.estadoResultado !== 'REJECTED'
      ).length;

      console.log(
        `[Sync] Lote completado: ${sincronizadas}/${pendientes.length} operaciones sincronizadas.`
      );
      return sincronizadas;

    } catch (errorRed) {
      // ── 7. Error de red: revertir a PENDIENTE para el próximo reintento ───
      //
      // No perdemos datos. Los ítems quedan en 'PENDIENTE' con el error
      // registrado para diagnóstico del operador o soporte técnico.
      const mensajeError =
        errorRed instanceof Error ? errorRed.message : 'Error de red desconocido';

      console.error(
        `[Sync] Error de conectividad — Reintento pendiente para el próximo ciclo.`,
        mensajeError
      );

      // Revertir todos los EN_PROCESO a PENDIENTE y registrar el error
      await db.sync_outbox.bulkUpdate(
        pendientes.map(item => ({
          key:     item.id,
          changes: {
            estado:      'PENDIENTE'  as const,
            intentos:    item.intentos + 1,
            ultimoError: mensajeError,
          },
        }))
      );

      return 0;
    }
  }, []); // Sin dependencias: usa solo db (singleton estable) y constantes de módulo

  /**
   * Alias para uso desde la vista de Configuración.
   * Dispara manualmente el ciclo de sincronización.
   */
  const reiniciarColaSync = useCallback(async () => {
    await sincronizarColaOffline();
  }, [sincronizarColaOffline]);

  return {
    estaOnline: estadoEfectivoOnline,
    estaRealmenteOnline:       estaOnline,
    modoOfflineForzado,
    operacionesPendientes,
    toggleSimulacionDesconexion,
    registrarOperacionOffline,
    reiniciarColaSync,
    sincronizarColaOffline,
  };
}
