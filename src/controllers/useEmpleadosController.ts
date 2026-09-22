import { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Empleado, RolSeguridad } from '../models';
import { v4 as uuidv4 } from 'uuid';

/**
 * ============================================================================
 * CONTROLADOR: EMPLEADOS Y ROLES (useEmpleadosController.ts)
 * ============================================================================
 * Lógica para la gestión (CRUD) del personal del negocio.
 * Exclusivo para administradores.
 */
export const useEmpleadosController = () => {
  // Suscripción reactiva a la tabla de empleados
  const empleados = useLiveQuery(() => db.empleados.toArray(), []) || [];

  // Estado para la búsqueda
  const [busqueda, setBusqueda] = useState('');

  // Filrado de empleados en memoria
  const empleadosFiltrados = empleados.filter(e => 
    e.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    e.usuario.toLowerCase().includes(busqueda.toLowerCase())
  );

  /**
   * Crea un nuevo empleado.
   */
  const crearEmpleado = useCallback(async (
    nombre: string,
    usuario: string,
    pinOContrasena: string,
    rol: RolSeguridad
  ): Promise<boolean> => {
    try {
      // Verificar unicidad de usuario
      const existe = await db.empleados.where('usuario').equals(usuario).first();
      if (existe) {
        console.warn('El nombre de usuario ya está en uso.');
        return false;
      }

      const nuevoEmpleado: Empleado = {
        id: uuidv4(),
        nombre,
        usuario,
        pinOContrasena,
        rol
      };

      await db.empleados.add(nuevoEmpleado);
      return true;
    } catch (error) {
      console.error('Error al crear empleado:', error);
      return false;
    }
  }, []);

  /**
   * Edita un empleado existente.
   */
  const editarEmpleado = useCallback(async (
    id: string,
    datosParciales: Partial<Empleado>
  ): Promise<boolean> => {
    try {
      await db.empleados.update(id, datosParciales);
      return true;
    } catch (error) {
      console.error('Error al editar empleado:', error);
      return false;
    }
  }, []);

  /**
   * Elimina un empleado.
   * IMPORTANTE: No se debería eliminar si tiene ventas asociadas,
   * aunque a nivel lógico en este sistema offline el UUID de ventas
   * persiste como string. Por precaución se permite borrar (baja lógica/física).
   */
  const eliminarEmpleado = useCallback(async (id: string): Promise<boolean> => {
    try {
      await db.empleados.delete(id);
      return true;
    } catch (error) {
      console.error('Error al eliminar empleado:', error);
      return false;
    }
  }, []);

  return {
    empleados: empleadosFiltrados,
    busqueda,
    setBusqueda,
    crearEmpleado,
    editarEmpleado,
    eliminarEmpleado
  };
};
