/**
 * ============================================================================
 * SERVICIO DE SINCRONIZACIÓN DE CAJA (SincronizacionCajaService.ts)
 * ============================================================================
 * Clase pura de TypeScript encargada exclusivamente de la capa de red y 
 * persistencia local (IndexedDB / Dexie) para sincronizar turnos de caja
 * cerrados hacia el backend Spring Boot.
 * No contiene dependencias de React, JSX ni lógica de UI.
 */

import { db } from '../db/database';
import { TurnoCaja } from '../models';

export class SincronizacionCajaService {
  
  /**
   * Busca en Dexie los cierres de caja locales que aún no han sido enviados al servidor
   * y procede a sincronizarlos individualmente mediante HTTP POST.
   */
  public static async sincronizarCierresPendientesConServidor(): Promise<void> {
    try {
      // 1. Obtener los turnos no sincronizados de la base de datos local (Dexie)
      const turnosPendientes = await this.obtenerTurnosNoSincronizados();

      // 2. Si no hay turnos pendientes, se detiene la ejecución para no saturar la red
      if (turnosPendientes.length === 0) {
        console.log('SincronizacionCajaService.ts -> sincronizarCierresPendientesConServidor: No hay cierres pendientes de sincronizar.');
        return;
      }

      console.log(`SincronizacionCajaService.ts -> sincronizarCierresPendientesConServidor: Se detectaron ${turnosPendientes.length} cierres pendientes.`);

      // 3. Iterar cada turno pendiente para enviarlo al servidor central
      for (const turno of turnosPendientes) {
        // Ejecución de red con el fetch nativo hacia el backend Spring Boot
        const respuesta = await fetch('http://localhost:8080/api/caja/sincronizar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // Convertimos el objeto turno a formato JSON para el payload de la petición
          body: JSON.stringify(turno)
        });

        // 4. Evaluar la respuesta del servidor
        if (respuesta.ok) {
          // Si el backend responde 200 OK, actualizamos el registro en Dexie marcándolo como sincronizado
          await db.turnos_caja.update(turno.id, { sincronizado: true });
          console.log(`SincronizacionCajaService.ts -> sincronizarCierresPendientesConServidor: Turno ${turno.id} sincronizado exitosamente.`);
        } else {
          // Si el servidor responde con un error de lógica de negocio o caída, reportamos en consola
          console.error(`Error en SincronizacionCajaService.ts -> sincronizarCierresPendientesConServidor: El servidor rechazó la sincronización del turno ${turno.id}. Estado HTTP: ${respuesta.status}`);
        }
      }

    } catch (error) {
      // TRAZABILIDAD DE ERRORES: Captura global de fallos de red (ej. servidor apagado o sin internet) o de base de datos local
      const mensajeFallo = error instanceof Error ? error.message : String(error);
      console.error(`Error en SincronizacionCajaService.ts -> sincronizarCierresPendientesConServidor: [${mensajeFallo}]`);
    }
  }

  /**
   * Consulta internamente a Dexie (IndexedDB) para extraer exclusivamente los turnos 
   * de caja cuyo estado de sincronización sea falso o nulo.
   * 
   * @returns Una promesa que resuelve a un arreglo estructurado de TurnoCaja.
   */
  private static async obtenerTurnosNoSincronizados(): Promise<TurnoCaja[]> {
    try {
      // Acceso directo a la colección 'turnos_caja' en Dexie.
      // Se filtran en memoria local todos aquellos registros que cumplan con la condición de no sincronización.
      const turnosFiltrados = await db.turnos_caja
        .filter(turno => turno.sincronizado === false || turno.sincronizado == null)
        .toArray();
        
      return turnosFiltrados;
    } catch (error) {
      // Reporte de error en consola en caso de fallo al intentar leer IndexedDB
      const mensajeFallo = error instanceof Error ? error.message : String(error);
      console.error(`Error en SincronizacionCajaService.ts -> obtenerTurnosNoSincronizados: [Fallo de lectura en Dexie: ${mensajeFallo}]`);
      
      // Relanzamos la excepción para que sea tratada por la función principal invocadora
      throw error;
    }
  }
}
