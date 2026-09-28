import { useState, useEffect, useCallback } from 'react';
import { db } from '../db';
import { Proveedor } from '../models/proveedor.model';

export const useProveedoresController = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarProveedores = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const empresaIdStr = localStorage.getItem('toko_empresa_id');
      if (!empresaIdStr) {
        throw new Error('Terminal no enrolada: Falta ID de empresa.');
      }
      
      const resultados = await db.proveedores
        .where('empresa_id')
        .equals(empresaIdStr)
        .toArray();

      if (resultados.length === 0) {
         const numericId = parseInt(empresaIdStr, 10);
         const resNum = await db.proveedores.where('empresa_id').equals(numericId).toArray();
         setProveedores(resNum);
      } else {
         setProveedores(resultados);
      }
      console.log('[ProveedoresController] Proveedores cargados exitosamente.');
    } catch (e) {
      console.error('[ProveedoresController] Error al cargar:', e);
      setError('Ocurrió un error al intentar cargar los proveedores.');
    } finally {
      setCargando(false);
    }
  }, []);

  const guardarProveedor = async (data: Omit<Proveedor, 'id' | 'empresa_id'> & { id?: string }) => {
    try {
      const empresaIdStr = localStorage.getItem('toko_empresa_id');
      if (!empresaIdStr) throw new Error('Terminal no enrolada.');
      const empresaId = parseInt(empresaIdStr, 10) || empresaIdStr;

      const payload: Proveedor = {
        ...data,
        id: data.id || (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()),
        empresa_id: empresaId
      };

      await db.proveedores.put(payload);
      console.log('[ProveedoresController] Proveedor guardado:', payload.razon_social);
      await cargarProveedores();
    } catch (e) {
      console.error('[ProveedoresController] Error al guardar:', e);
      setError('No se pudo guardar el proveedor.');
      throw e;
    }
  };

  const eliminarProveedor = async (id: string) => {
    try {
      await db.proveedores.delete(id);
      console.log('[ProveedoresController] Proveedor eliminado:', id);
      await cargarProveedores();
    } catch (e) {
      console.error('[ProveedoresController] Error al eliminar:', e);
      setError('No se pudo eliminar el proveedor.');
      throw e;
    }
  };

  useEffect(() => {
    cargarProveedores();
  }, [cargarProveedores]);

  return { proveedores, cargando, error, cargarProveedores, guardarProveedor, eliminarProveedor };
};
