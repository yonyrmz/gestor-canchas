'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.user?.rol === 'superadmin') {
      window.location.href = '/admin';
    } else if (data.user?.rol === 'dono') {
      window.location.href = '/dono';
    } else {
      window.location.href = '/reservar';
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    const result = await loginWithGoogle();
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.user?.rol === 'superadmin') {
      window.location.href = '/admin';
    } else if (data.user?.rol === 'dono') {
      window.location.href = '/dono';
    } else {
      window.location.href = '/reservar';
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary noise-bg flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-accent-cyan/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-accent-gold/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-md w-full card-glass rounded-2xl p-8 relative glow-cyan">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-green flex items-center justify-center mx-auto mb-4 glow-cyan">
            <span className="text-bg-primary font-black text-xl">GC</span>
          </div>
          <h1 className="text-2xl font-black tracking-wide text-text-primary font-display">INICIAR SESIÓN</h1>
          <p className="text-text-muted text-sm mt-2">Accedé a tu cuenta para reservar</p>
        </div>

        {error && (
          <div className="bg-accent-magenta/10 border border-accent-magenta/20 text-accent-magenta px-4 py-3 rounded-lg mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 py-3 rounded-lg font-bold tracking-wide text-sm disabled:opacity-50 border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {loading ? 'INGRESANDO...' : 'CONTINUAR CON GOOGLE'}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-transparent px-3 text-text-muted">o continuá con email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold mb-2 text-text-secondary uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full input-dark rounded-lg px-4 py-3 text-sm"
              placeholder="tu@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2 text-text-secondary uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full input-dark rounded-lg px-4 py-3 text-sm"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary text-white py-3 rounded-lg font-bold tracking-wide text-sm disabled:opacity-50"
          >
            {loading ? 'INGRESANDO...' : 'INGRESAR'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-text-muted">
          ¿No tenés cuenta?{' '}
          <Link href="/registro" className="text-accent-cyan hover:text-accent-cyan/80 font-semibold transition-colors">Registrate</Link>
        </p>
      </div>
    </div>
  );
}
