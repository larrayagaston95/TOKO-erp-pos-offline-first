/**
 * ============================================================================
 * CONTROLADOR: ABM DE PRODUCTOS (useProductosController.ts)
 * ============================================================================
 * Maneja la lógica de negocio y persistencia en IndexedDB (Dexie) para el
 * catálogo de productos, separando estrictamente la vista de los datos.
 */

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Producto, PRODUCTOS_MOCK } from '../models';

export function useProductosController() {
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  // Consulta reactiva a la base de datos local
  const productosDb = useLiveQuery(() => db.productos.toArray(), []);
  
  // Si la base de datos está vacía en la inicialización, muestra los mocks
  const productos = productosDb && productosDb.length > 0 ? productosDb : PRODUCTOS_MOCK;

  const [mensajeNotificacion, setMensajeNotificacion] = useState<string | null>(null);

  const mostrarMensaje = (mensaje: string) => {
    setMensajeNotificacion(mensaje);
    setTimeout(() => {
      setMensajeNotificacion(null);
    }, 3200);
  };

  /**
   * Guarda o actualiza un producto en la base de datos local (Dexie).
   * @param producto Objeto Producto completo a persistir.
   */
  const guardarProducto = async (producto: Producto) => {
    setGuardando(true);
    setError(null);
    try {
      // Utilizamos put() que actualiza si existe el ID o inserta si es nuevo
      await db.productos.put(producto);
      mostrarMensaje('Producto guardado correctamente.');
    } catch (e) {
      console.error('[ABM Productos] Error al guardar:', e);
      setError('Error al guardar el producto en la base de datos local.');
      throw e;
    } finally {
      setGuardando(false);
    }
  };

  /**
   * Elimina un producto de la base de datos local.
   * @param id Identificador único del producto.
   */
  const eliminarProducto = async (id: string) => {
    setEliminando(true);
    setError(null);
    try {
      await db.productos.delete(id);
    } catch (e) {
      console.error('[ABM Productos] Error al eliminar:', e);
      setError('Error al eliminar el producto de la base de datos local.');
      throw e;
    } finally {
      setEliminando(false);
    }
  };

  return {
    productos,
    guardarProducto,
    eliminarProducto,
    guardando,
    eliminando,
    error,
    setError,
    mensajeNotificacion
  };
}
