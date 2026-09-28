// Archivo: src/views/auth/LoginPOSView.tsx
import React, { useState } from 'react';
import { Empleado } from '../../models/empleado.model';
import { AuthService } from '../../services/AuthService';

// ============================================================================
// INTERFACES
// ============================================================================
interface PropiedadesLoginPOS {
  /** Callback invocado cuando el AuthService valida correctamente al empleado */
  onLoginExitoso: (empleado: Empleado) => void;
}

// ============================================================================
// VISTA Y CONTROLADOR
// ============================================================================
export const LoginPOSView: React.FC<PropiedadesLoginPOS> = ({ onLoginExitoso }) => {
  // --- ESTADO LOCAL (Controlador) ---
  const [credencial, asignarCredencial] = useState<string>('');
  const [pinIngresado, asignarPinIngresado] = useState<string>('');
  const [mensajeError, asignarMensajeError] = useState<string>('');
  const [cargando, asignarCargando] = useState<boolean>(false);

  const LIMITE_PIN = 4; // Configurable: 4 dígitos para mayor agilidad en caja

  // --- MANEJADORES DE EVENTOS (Controlador) ---
  const manejarTecla = (numero: string) => {
    if (mensajeError) asignarMensajeError('');
    if (pinIngresado.length < LIMITE_PIN) {
      asignarPinIngresado((previo) => previo + numero);
    }
  };

  const manejarBorrado = () => {
    if (mensajeError) asignarMensajeError('');
    asignarPinIngresado((previo) => previo.slice(0, -1));
  };

  const manejarEnvio = async () => {
    // 1. Validaciones iniciales
    if (!credencial.trim()) {
      asignarMensajeError('Por favor, ingresa tu usuario.');
      return;
    }
    if (pinIngresado.length === 0) {
      asignarMensajeError('Por favor, ingresa tu PIN.');
      return;
    }

    // 2. Preparación de la petición
    asignarCargando(true);
    asignarMensajeError('');

    try {
      // 3. Invocación al servicio aislado (Capa de Negocio)
      const servicioAuth = new AuthService();
      const empleadoLogueado = await servicioAuth.iniciarSesionLocal(credencial, pinIngresado);
      
      // 4. Comunicación externa (éxito)
      onLoginExitoso(empleadoLogueado);
    } catch (error: any) {
      // 5. Manejo de error
      asignarPinIngresado(''); // Limpiamos el PIN por seguridad tras un intento fallido
      asignarMensajeError(error?.message || 'Credenciales inválidas o error de validación.');
    } finally {
      asignarCargando(false);
    }
  };

  // --- COMPONENTES AUXILIARES DE VISTA ---
  const renderizarBotonTeclado = (
    texto: string, 
    accion: () => void, 
    colorClase = 'bg-white text-gray-800 hover:bg-gray-100 active:bg-gray-200 shadow-sm border border-gray-100'
  ) => (
    <button
      key={texto}
      type="button"
      onClick={accion}
      disabled={cargando}
      className={`flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold transition-all active:scale-95 disabled:opacity-50 sm:h-24 sm:w-24 sm:text-3xl ${colorClase}`}
    >
      {texto}
    </button>
  );

  // --- RENDERIZADO PRINCIPAL (Vista) ---
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl sm:max-w-md sm:p-8">
        
        {/* ENCABEZADO */}
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-gray-800">Caja POS</h1>
          <p className="mt-1 text-sm font-medium text-gray-500">Ingresa tu credencial y PIN de acceso</p>
        </header>

        {/* ENTRADA DE USUARIO (CREDENCIAL) */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Usuario"
            value={credencial}
            onChange={(e) => {
              asignarCredencial(e.target.value);
              if (mensajeError) asignarMensajeError('');
            }}
            disabled={cargando}
            autoComplete="off"
            className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 p-4 text-center text-xl font-bold text-gray-700 outline-none transition-all placeholder:font-medium placeholder:text-gray-400 focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* DISPLAY DEL PIN (PUNTOS) Y ERRORES */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-full items-center justify-center gap-4 rounded-2xl bg-gray-50 text-4xl tracking-widest">
            {Array.from({ length: LIMITE_PIN }).map((_, index) => {
              const ingresado = index < pinIngresado.length;
              return (
                <span 
                  key={index} 
                  className={`transition-all duration-200 ${ingresado ? 'scale-110 text-blue-600' : 'text-gray-300'}`}
                >
                  {ingresado ? '•' : '○'}
                </span>
              );
            })}
          </div>
          
          <div className="mt-3 min-h-[1.5rem] text-center">
            {mensajeError && (
              <span className="text-sm font-bold text-red-500 animate-pulse">{mensajeError}</span>
            )}
          </div>
        </div>

        {/* TECLADO NUMÉRICO TÁCTIL (GRID) */}
        <div className="grid grid-cols-3 place-items-center gap-3 sm:gap-4">
          {/* Fila 1 */}
          {['1', '2', '3'].map(num => renderizarBotonTeclado(num, () => manejarTecla(num)))}
          
          {/* Fila 2 */}
          {['4', '5', '6'].map(num => renderizarBotonTeclado(num, () => manejarTecla(num)))}
          
          {/* Fila 3 */}
          {['7', '8', '9'].map(num => renderizarBotonTeclado(num, () => manejarTecla(num)))}
          
          {/* Fila 4 (Especiales) */}
          {renderizarBotonTeclado('Borrar', manejarBorrado, 'bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200 text-base sm:text-lg')}
          {renderizarBotonTeclado('0', () => manejarTecla('0'))}
          {renderizarBotonTeclado('Entrar', manejarEnvio, 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-md text-base sm:text-lg')}
        </div>

      </div>
    </div>
  );
};

export default LoginPOSView;
