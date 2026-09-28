import { useState, useEffect, useCallback } from 'react';
import { db } from '../db';
import { Categoria } from '../models/categoria.model';

/**
 * ============================================================================
 * CONTROLADOR: Gestión de Categorías (Rubros)
 * ============================================================================
 * Maneja el estado y las operaciones CRUD de categorías con Dexie.js
 * implementando seguridad Multi-tenant.
 */
export const useCategoriasController = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarCategorias = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const empresaIdStr = localStorage.getItem('toko_empresa_id');
      if (!empresaIdStr) {
        throw new Error('Terminal no enrolada: No se encontró el ID de empresa.');
      }
      
      // Dexie index needs exact type match if we used numbers or strings. 
      // We'll search by the stored type, often string from localStorage.
      // To be safe, we can fetch all and filter or query directly.
      const resultados = await db.categorias
        .where('empresa_id')
        .equals(empresaIdStr)
        .toArray();

      // Fallback: if empty, maybe it's stored as a number
      if (resultados.length === 0) {
         const numericId = parseInt(empresaIdStr, 10);
         const resNum = await db.categorias.where('empresa_id').equals(numericId).toArray();
         setCategorias(resNum);
      } else {
         setCategorias(resultados);
      }
      
      console.log('[CategoriasController] Categorías cargadas exitosamente.');
    } catch (e) {
      console.error('[CategoriasController] Error al cargar categorías:', e);
      setError('Ocurrió un error al intentar cargar los rubros.');
    } finally {
      setCargando(false);
    }
  }, []);

  const agregarCategoria = async (nombre: string) => {
    try {
      const empresaIdStr = localStorage.getItem('toko_empresa_id');
      if (!empresaIdStr) {
        throw new Error('Terminal no enrolada.');
      }
      const empresaId = parseInt(empresaIdStr, 10) || empresaIdStr;

      const nuevaCategoria: Categoria = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        nombre,
        empresa_id: empresaId,
        estado: 'ACTIVO'
      };

      await db.categorias.add(nuevaCategoria);
      console.log('[CategoriasController] Categoría agregada:', nombre);
      await cargarCategorias();
    } catch (e) {
      console.error('[CategoriasController] Error al agregar categoría:', e);
      setError('No se pudo guardar el nuevo rubro.');
      throw e;
    }
  };

  const eliminarCategoria = async (id: string) => {
    try {
      await db.categorias.delete(id);
      console.log('[CategoriasController] Categoría eliminada:', id);
      await cargarCategorias();
    } catch (e) {
      console.error('[CategoriasController] Error al eliminar categoría:', e);
      setError('No se pudo eliminar el rubro.');
      throw e;
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  return {
    categorias,
    cargando,
    error,
    cargarCategorias,
    agregarCategoria,
    eliminarCategoria
  };
};
