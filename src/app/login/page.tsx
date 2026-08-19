'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

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
