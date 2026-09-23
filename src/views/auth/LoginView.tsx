/**
 * ============================================================================
 * VISTA: LOGIN / AUTENTICACIÓN (LoginView.tsx)
 * ============================================================================
 * TOKO ERP — Pantalla de ingreso al sistema.
 * Diseño Modern SaaS: fondo limpio, tarjeta con sombra suave, acentos Teal/Emerald.
 *
 * VALIDACIÓN ESTÁTICA (desarrollo):
 * Usuario: admin | Contraseña: admin
 * Reemplazar por integración JWT/backend cuando esté disponible.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import logoToko from "../../assets/logo-toko.png";

import { db } from '../../db';
import { Empleado } from '../../models';

// ─── Props ────────────────────────────────────────────────────────────────────

interface LoginViewProps {
  /** Callback que se invoca cuando las credenciales son válidas */
  alIniciarSesion: (empleado: Empleado) => void;
}

// ─── Configuraciones ──────────────────────────────────────────────────────────
const DELAY_SIMULACION = 800; // ms para simular latencia de red

// ─── Componente ───────────────────────────────────────────────────────────────

export const LoginView: React.FC<LoginViewProps> = ({ alIniciarSesion }) => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [intentoFallido, setIntentoFallido] = useState(false);

  const inputUsuarioRef = useRef<HTMLInputElement>(null);

  // Focus automático al montar la vista
  useEffect(() => {
    inputUsuarioRef.current?.focus();
  }, []);

  /**
   * Maneja el envío del formulario de login.
   * Simula una llamada asíncrona para imitar el comportamiento
   * que tendrá cuando se integre con el backend real.
   */
  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cargando) return;

    setErrorMsg('');
    setIntentoFallido(false);
    setCargando(true);

    // Simular latencia de red
    await new Promise(resolve => setTimeout(resolve, DELAY_SIMULACION));

    try {
      const empleadoEncontrado = await db.empleados
        .where('usuario').equals(usuario.trim())
        .first();

      if (empleadoEncontrado && empleadoEncontrado.pinOContrasena === password) {
        alIniciarSesion(empleadoEncontrado);
      } else {
        setErrorMsg('Usuario o contraseña incorrectos. Verificá tus credenciales.');
        setIntentoFallido(true);
        setPassword('');
      }
    } catch (error) {
      setErrorMsg('Error interno al consultar la base de datos de empleados.');
      setIntentoFallido(true);
      setPassword('');
    } finally {
      setCargando(false);
      // Shake animation: se limpia automáticamente
      if (intentoFallido) {
        setTimeout(() => setIntentoFallido(false), 600);
      }
    }
  };

  return (
    <div
      id="vista-login"
      className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4"
      style={{
        backgroundImage: `
          radial-gradient(ellipse 80% 50% at 50% -20%, rgba(20,184,166,0.12) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 100%, rgba(16,185,129,0.08) 0%, transparent 50%)
        `
      }}
    >
      {/* Tarjeta principal */}
      <div
        className={`
          w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/60
          p-8 space-y-7 transition-transform duration-150
          ${intentoFallido ? 'animate-[shake_0.35s_ease-in-out]' : ''}
        `}
        style={{
          // Shake keyframe inline para no depender de configuración Tailwind extra
          animation: intentoFallido
            ? 'tokoShake 0.35s ease-in-out'
            : undefined,
        }}
      >

        {/* ── Cabecera / Logotipo ─────────────────────────────────────────── */}
        <div className="text-center space-y-3">
          {/* Logotipo de marca */}
          <div className="flex items-center justify-center mb-4">
            <img src={logoToko} alt="TOKO ERP" className="h-48 w-auto object-contain mb-4" />
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900">
              Iniciar sesión
            </h1>
            <p className="text-sm text-slate-500">
              Ingresá tus credenciales para acceder al sistema.
            </p>
          </div>
        </div>

        {/* ── Formulario ──────────────────────────────────────────────────── */}
        <form
          id="form-login"
          onSubmit={manejarSubmit}
          className="space-y-4"
          noValidate
        >

          {/* Campo: Usuario */}
          <div className="space-y-1.5">
            <label
              htmlFor="input-usuario"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wide"
            >
              Usuario
            </label>
            <input
              id="input-usuario"
              ref={inputUsuarioRef}
              type="text"
              autoComplete="username"
              value={usuario}
              onChange={e => { setUsuario(e.target.value); setErrorMsg(''); }}
              placeholder="Ingresá tu usuario"
              disabled={cargando}
              className={`
                w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-900
                bg-slate-50 border transition-all outline-none
                placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed
                focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500
                ${errorMsg ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'}
              `}
            />
          </div>

          {/* Campo: Contraseña */}
          <div className="space-y-1.5">
            <label
              htmlFor="input-password"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wide"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="input-password"
                type={mostrarPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => { setPassword(e.target.value); setErrorMsg(''); }}
                placeholder="••••••••"
                disabled={cargando}
                className={`
                  w-full pl-3.5 pr-10 py-2.5 rounded-xl text-sm text-slate-900
                  bg-slate-50 border transition-all outline-none
                  placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed
                  focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500
                  ${errorMsg ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'}
                `}
              />
              {/* Toggle visibilidad contraseña */}
              <button
                type="button"
                onClick={() => setMostrarPassword(prev => !prev)}
                disabled={cargando}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors disabled:pointer-events-none"
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {mostrarPassword
                  ? <EyeOff className="h-4 w-4" />
                  : <Eye className="h-4 w-4" />
                }
              </button>
            </div>
          </div>

          {/* Mensaje de error */}
          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3.5 py-2.5 text-xs"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Botón de ingreso */}
          <button
            id="btn-ingresar"
            type="submit"
            disabled={cargando || !usuario.trim() || !password}
            className="
              w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white
              bg-gradient-to-r from-teal-600 to-emerald-600
              hover:from-teal-500 hover:to-emerald-500
              shadow-md shadow-teal-600/25
              hover:-translate-y-0.5 active:scale-[0.98]
              transition-all duration-150 flex items-center justify-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none
            "
          >
            {cargando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verificando...</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Ingresar al Sistema</span>
              </>
            )}
          </button>
        </form>

        {/* ── Pie de la tarjeta ────────────────────────────────────────────── */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            TOKO ERP · Sistema Offline-First para Distribuidoras
          </p>
          <p className="text-[10px] text-slate-300 mt-0.5">
            {/* Indicador de credenciales de prueba — remover en producción */}
            Demo: <span className="font-mono">admin / admin</span>
          </p>
        </div>
      </div>

      {/* Keyframe de shake para intento fallido */}
      <style>{`
        @keyframes tokoShake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-5px); }
          80%      { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
};
