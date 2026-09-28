/**
 * ============================================================================
 * SERVICIO: AuthService.ts
 * RESPONSABILIDAD: Maneja la autenticación y validación de terminales POS
 * offline, aplicando seguridad multi-tenant estricta.
 * ============================================================================
 */

import { db } from '../db/database';
import { Empleado, EMPLEADOS_MOCK } from '../models/empleado.model';

export class AuthService {
    
    /**
     * ============================================================================
     * MÉTODO: verificarTerminalEnrolada
     * ============================================================================
     * Verifica que la terminal física actual esté enrolada a una empresa
     * específica leyendo el almacenamiento local seguro.
     * ============================================================================
     */
    public verificarTerminalEnrolada(): string {
        try {
            // RUTA DE LÓGICA 1: Extracción del identificador de empresa enrolado
            const identificadorEmpresaTerminal = localStorage.getItem('toko_empresa_id');

            if (!identificadorEmpresaTerminal) {
                throw new Error("La terminal no está enrolada. Falta toko_empresa_id en la configuración local.");
            }

            return identificadorEmpresaTerminal;

        } catch (error) {
            // RUTA DE LÓGICA 2: Trazabilidad de Errores de Arquitectura
            const descripcionDelFallo = error instanceof Error ? error.message : String(error);
            console.error(`Error en AuthService.ts -> verificarTerminalEnrolada: ${descripcionDelFallo}`);
            throw error;
        }
    }

    /**
     * ============================================================================
     * MÉTODO: iniciarSesionLocal
     * ============================================================================
     * Valida las credenciales offline contra la base de datos Dexie, garantizando
     * aislamiento estricto multi-tenant (el empleado debe pertenecer a la empresa
     * configurada en la terminal actual).
     * ============================================================================
     */
    public async iniciarSesionLocal(credencialDeUsuario: string, pinDeAcceso: string): Promise<Empleado | null> {
        try {
            // RUTA DE LÓGICA 1: Validación previa de la terminal
            const identificadorDeEmpresaRequerido = this.verificarTerminalEnrolada();

            // AUTO-SEED PARA DESARROLLO
            const cantidadEmpleados = await db.empleados.count();
            if (cantidadEmpleados === 0) {
                console.log("Base de datos vacía: Inyectando empleados mock...");
                await db.empleados.bulkAdd(EMPLEADOS_MOCK);
            }

            // RUTA DE LÓGICA 2: Búsqueda del empleado en el almacenamiento offline Dexie
            // Comparamos el usuario y delegamos la extracción
            const empleadoEncontrado = await db.empleados
                .where('usuario')
                .equals(credencialDeUsuario)
                .first();

            console.log("Empleado encontrado:", empleadoEncontrado);

            if (!empleadoEncontrado) {
                throw new Error("El usuario no existe en la base de datos local.");
            }

            // Validamos que el PIN proporcionado coincida con el PIN guardado
            const pinEsValido = empleadoEncontrado.pin_acceso === pinDeAcceso || empleadoEncontrado.pinOContrasena === pinDeAcceso;
            if (!pinEsValido) {
                throw new Error("Credenciales inválidas. El PIN proporcionado es incorrecto.");
            }

            // Validamos seguridad Multi-Tenant absoluta (Aislamiento de Empresa)
            const perteneceALaEmpresaCorrecta = String(empleadoEncontrado.empresa_id) === String(identificadorDeEmpresaRequerido);
            if (!perteneceALaEmpresaCorrecta) {
                throw new Error("Violación de seguridad: El empleado pertenece a otra empresa y no puede operar esta terminal.");
            }

            // Retornamos la instancia de empleado validada
            return empleadoEncontrado;

        } catch (error) {
            // RUTA DE LÓGICA 3: Trazabilidad de Errores
            const descripcionDelFallo = error instanceof Error ? error.message : String(error);
            console.error(`Error en AuthService.ts -> iniciarSesionLocal: Fallo de autenticación. Detalle: ${descripcionDelFallo}`);
            return null;
        }
    }
}
