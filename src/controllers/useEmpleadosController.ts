// Archivo: src/controllers/useEmpleadosController.ts
import { useState, useCallback } from 'react';
import { db } from '../db/database';
import { Empleado } from '../models/empleado.model';

export const useEmpleadosController = () => {
  const [empleados, asignarEmpleados] = useState<Empleado[]>([]);
  const [cargando, asignarCargando] = useState<boolean>(false);

  // Helper local para extraer seguridad
  const obtenerIdentificadorEmpresa = () => localStorage.getItem('toko_empresa_id') || '';

  const cargarEmpleados = useCallback(async () => {
    asignarCargando(true);
    try {
      const idEmpresaActual = obtenerIdentificadorEmpresa();
      if (!idEmpresaActual) {
        throw new Error('No hay empresa vinculada en esta terminal.');
      }

      // Filtro Multi-tenant estricto
      const listaEmpleados = await db.empleados
        .filter((emp: Empleado) => String(emp.empresa_id) === String(idEmpresaActual))
        .toArray();

      asignarEmpleados(listaEmpleados);
      console.log('[useEmpleadosController] Empleados cargados correctamente.');
    } catch (error) {
      console.error('[useEmpleadosController] Fallo al cargar empleados:', error);
    } finally {
      asignarCargando(false);
    }
  }, []);

  const guardarEmpleado = async (empleadoData: any) => {
    try {
      // 1. Validar enrolamiento
      const idEmpresaActual = obtenerIdentificadorEmpresa();
      if (!idEmpresaActual) {
        throw new Error('Operación denegada. La terminal no está enrolada a ninguna empresa.');
      }

      // 2. Generar clave primaria si es un empleado nuevo
      const idFinal = empleadoData.id || 
        (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString());

      // 3 y 4. Inyección de dependencias estables (Multi-tenant y Seguridad)
      const empleadoParaGuardar = {
        ...empleadoData,
        id: idFinal,
        empresa_id: idEmpresaActual, // 3. Inyección estricta de empresa
        pin_acceso: empleadoData.pin_acceso || empleadoData.pinOContrasena // 4. Inyección del PIN
      };

      // 5. Escritura segura (Upsert)
      await db.empleados.put(empleadoParaGuardar as Empleado);
      console.log(`[useEmpleadosController] Empleado [${idFinal}] procesado y guardado en la base de datos local.`);

      // 6. Refrescar estado
      await cargarEmpleados();
      return true;
    } catch (error) {
      console.error('[useEmpleadosController] Error crítico al guardar empleado en Dexie:', error);
      return false;
    }
  };

  const eliminarEmpleado = async (idEmpleado: string) => {
    try {
      await db.empleados.delete(idEmpleado);
      console.log(`[useEmpleadosController] Empleado ID ${idEmpleado} eliminado.`);
      await cargarEmpleados();
      return true;
    } catch (error) {
      console.error('[useEmpleadosController] Fallo crítico al eliminar:', error);
      return false;
    }
  };

  return {
    empleados,
    cargando,
    cargarEmpleados,
    guardarEmpleado,
    eliminarEmpleado
  };
};
