// Archivo: src/views/auth/SetupTerminalView.tsx
import React, { useState } from 'react';

// ============================================================================
// INTERFACES
// ============================================================================
interface PropiedadesSetupTerminal {
  /** Callback que notifica al sistema padre la vinculación exitosa */
  onSetupCompleto: () => void;
}

// ============================================================================
// VISTA Y CONTROLADOR
// ============================================================================
export const SetupTerminalView: React.FC<PropiedadesSetupTerminal> = ({
  onSetupCompleto,
}) => {
  // --- ESTADO LOCAL (Controlador) ---
  const [identificadorEmpresa, asignarIdentificadorEmpresa] = useState<string>('');
  const [mensajeError, asignarMensajeError] = useState<string>('');

  // --- MANEJADORES DE EVENTOS (Controlador) ---
  const manejarCambioInput = (evento: React.ChangeEvent<HTMLInputElement>) => {
    asignarIdentificadorEmpresa(evento.target.value);
    if (mensajeError) {
      asignarMensajeError(''); // Limpia el error sutilmente al escribir
    }
  };

  const manejarEnvio = (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();

    const identificadorLimpio = identificadorEmpresa.trim();

    // 1. Validación de campos vacíos
    if (!identificadorLimpio) {
      asignarMensajeError('El ID de Empresa es obligatorio para continuar.');
      return;
    }

    // 2. Persistencia segura
    try {
      localStorage.setItem('toko_empresa_id', identificadorLimpio);
      
      // 3. Comunicación externa
      onSetupCompleto();
    } catch (error) {
      asignarMensajeError('Ocurrió un error al guardar la configuración en la terminal.');
      console.error('[SetupTerminalView] Error guardando en localStorage:', error);
    }
  };

  // --- RENDERIZADO (Vista) ---
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Configuración Inicial de Terminal
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Vincula este equipo físico a la empresa correspondiente.
          </p>
        </header>

        <form onSubmit={manejarEnvio} className="flex flex-col gap-5">
          
          <div className="flex flex-col gap-1.5">
            <label 
              htmlFor="idEmpresa" 
              className="text-sm font-semibold text-gray-700"
            >
              ID de Empresa (Token)
            </label>
            <input
              id="idEmpresa"
              type="text"
              value={identificadorEmpresa}
              onChange={manejarCambioInput}
              placeholder="Ej: EMP-12345678"
              autoComplete="off"
              className={`rounded-lg border p-3.5 outline-none transition-all focus:ring-2 ${
                mensajeError 
                  ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 bg-gray-50 focus:border-blue-600 focus:bg-white focus:ring-blue-100'
              }`}
            />
            {mensajeError && (
              <span className="text-sm font-medium text-red-500">
                {mensajeError}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-3.5 font-bold text-white transition-all hover:bg-blue-700 hover:shadow-md active:bg-blue-800 active:scale-[0.98]"
          >
            Vincular Terminal
          </button>

        </form>
      </div>
    </div>
  );
};

export default SetupTerminalView;
