'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function RegistroPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register({ nombre, email, password, rol: 'cliente', telefono });
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    window.location.href = '/reservar';
  };

  return (
    <div className="min-h-screen bg-bg-primary noise-bg flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-accent-gold/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[300px] h-[300px] bg-accent-cyan/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-md w-full card-glass rounded-2xl p-8 relative glow-gold">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-gold to-orange-500 flex items-center justify-center mx-auto mb-4 glow-gold">
            <span className="text-bg-primary font-black text-xl">+</span>
          </div>
          <h1 className="text-2xl font-black tracking-wide text-text-primary font-display">CREAR CUENTA</h1>
          <p className="text-text-muted text-sm mt-2">Registrate para empezar a reservar</p>
        </div>

        {error && (
          <div className="bg-accent-magenta/10 border border-accent-magenta/20 text-accent-magenta px-4 py-3 rounded-lg mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-2 text-text-secondary uppercase tracking-wider">Nombre completo</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full input-dark rounded-lg px-4 py-3 text-sm"
              placeholder="Tu nombre"
              required
            />
          </div>
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
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2 text-text-secondary uppercase tracking-wider">Teléfono (opcional)</label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full input-dark rounded-lg px-4 py-3 text-sm"
              placeholder="+54 11 1234-5678"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-gold py-3 rounded-lg font-bold tracking-wide text-sm disabled:opacity-50 mt-2"
          >
            {loading ? 'CREANDO CUENTA...' : 'CREAR CUENTA'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-text-muted">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="text-accent-cyan hover:text-accent-cyan/80 font-semibold transition-colors">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
