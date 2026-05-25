'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (isRegistering) {
      // Registro
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/signals`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('¡Registro exitoso! Por favor, verifica tu correo para confirmar tu cuenta.');
        setEmail('');
        setPassword('');
      }
    } else {
      // Inicio de sesión
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg('Credenciales inválidas. Por favor intenta de nuevo.');
      } else {
        router.push('/signals');
      }
    }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    setErrorMsg('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/signals`,
      },
    });
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md p-2">
      {/* Decorative ambient glows inside login area */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Glass card container */}
      <div className="bg-slate-950/60 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-8">
        
        {/* Title / Logo block */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 items-center justify-center shadow-lg shadow-teal-500/20 mb-2">
            <svg className="w-6 h-6 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.011 19.851c-1.394 1.157-3.155 1.854-5.077 1.854-4.385 0-7.94-3.555-7.94-7.94 0-1.922.697-3.683 1.854-5.077M20.303 14.545c.677-1.423 1.061-3.02 1.061-4.707 0-6.075-4.925-11-11-11-1.687 0-3.284.384-4.707 1.061m14.551 14.551a9.76 9.76 0 0 1-5.696 2.24m5.696-2.24c1.55-1.55 2.502-3.693 2.502-6.06 0-2.368-.952-4.51-2.502-6.06m-2.24 12.12a9.76 9.76 0 0 1-2.24 5.696m2.24-5.696V12m-6.06-6.06a9.76 9.76 0 0 1 6.06-2.24m-6.06 2.24c-1.55 1.55-2.502 3.693-2.502 6.06 0 2.368.952 4.51 2.502 6.06m-3.82-12.12a9.76 9.76 0 0 1 2.24-5.696m-2.24 5.696v2.24" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Signal Hunter
          </h1>
          <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">
            {isRegistering ? 'Crear nueva cuenta' : 'Acceso al Radar de Señales'}
          </p>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl p-3 text-center font-semibold leading-relaxed">
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl p-3 text-center font-semibold leading-relaxed">
            {successMsg}
          </div>
        )}

        {/* Email Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Correo Electrónico</label>
            <input
              type="email"
              required
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-700 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contraseña</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-700 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-extrabold text-sm py-3.5 rounded-xl shadow-lg shadow-teal-500/10 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-slate-950/25 border-t-slate-950 rounded-full animate-spin" />
            ) : isRegistering ? (
              'Registrarse'
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-900" />
          <span className="flex-shrink mx-4 text-slate-600 text-[10px] uppercase font-bold tracking-wider select-none">o continuar con</span>
          <div className="flex-grow border-t border-slate-900" />
        </div>

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full border border-slate-800 hover:bg-slate-900/60 text-slate-200 font-bold text-sm py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Iniciar sesión con Google
        </button>

        {/* Toggle Mode Footer */}
        <div className="text-center">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            disabled={loading}
            className="text-xs text-teal-400 hover:text-teal-300 font-bold transition-colors select-none"
          >
            {isRegistering
              ? '¿Ya tienes una cuenta? Inicia Sesión'
              : '¿No tienes cuenta? Regístrate aquí'}
          </button>
        </div>

      </div>
    </div>
  );
}
