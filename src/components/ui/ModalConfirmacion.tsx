import React from 'react';
import { AlertTriangle, CheckCircle, Info, Trash2 } from 'lucide-react';

interface ModalConfirmacionProps {
  estaAbierto: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  textoCancelar: string;
  alConfirmar: () => void;
  alCancelar: () => void;
  tipoAccion: 'peligro' | 'advertencia' | 'exito' | 'info';
}

/**
 * ============================================================================
 * COMPONENTE UNIVERSAL: Escudo de Seguridad (Confirmaciones)
 * ============================================================================
 * Intercepta acciones críticas (eliminar, guardar) con un modal reutilizable.
 */
export const ModalConfirmacion: React.FC<ModalConfirmacionProps> = ({
  estaAbierto,
  titulo,
  mensaje,
  textoConfirmar,
  textoCancelar,
  alConfirmar,
  alCancelar,
  tipoAccion,
}) => {
  if (!estaAbierto) return null;

  // Diccionario de estilos y configuraciones según el nivel de alerta
  const configuracionVisual = {
    peligro: {
      icono: <Trash2 className="h-6 w-6 text-rose-600" />,
      bgIcono: 'bg-rose-100',
      botonConfirmar: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500',
    },
    advertencia: {
      icono: <AlertTriangle className="h-6 w-6 text-amber-600" />,
      bgIcono: 'bg-amber-100',
      botonConfirmar: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
    },
    exito: {
      icono: <CheckCircle className="h-6 w-6 text-emerald-600" />,
      bgIcono: 'bg-emerald-100',
      botonConfirmar: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
    },
    info: {
      icono: <Info className="h-6 w-6 text-blue-600" />,
      bgIcono: 'bg-blue-100',
      botonConfirmar: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    },
  };

  const configActiva = configuracionVisual[tipoAccion] || configuracionVisual.info;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
        
        {/* Cabecera y Contenido */}
        <div className="flex flex-col items-center text-center">
          <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${configActiva.bgIcono}`}>
            {configActiva.icono}
          </div>
          <h3 className="mb-2 text-xl font-bold text-slate-800">{titulo}</h3>
          <p className="mb-6 text-sm font-medium text-slate-500 leading-relaxed">{mensaje}</p>
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={alCancelar}
            className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-200 active:scale-95"
          >
            {textoCancelar}
          </button>
          <button
            onClick={alConfirmar}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 ${configActiva.botonConfirmar}`}
          >
            {textoConfirmar}
          </button>
        </div>
        
      </div>
    </div>
  );
};
