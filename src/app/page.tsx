'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.rol === 'superadmin') {
        router.push('/admin');
      } else if (user.rol === 'dono') {
        router.push('/dono');
      } else {
        router.push('/reservar');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-text-muted animate-pulse font-display tracking-widest text-sm uppercase">Cargando...</div>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-bg-primary noise-bg">
      <header className="border-b border-border-dim">
        <div className="max-w-7xl mx-auto py-6 px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-green flex items-center justify-center glow-cyan">
              <span className="text-bg-primary font-black text-lg">GC</span>
            </div>
            <h1 className="font-display text-xl font-bold tracking-wide text-text-primary">GESTOR CANCHAS</h1>
          </div>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="border border-border-dim text-text-secondary px-5 py-2.5 rounded-lg hover:border-accent-cyan/40 hover:text-text-primary font-medium text-sm transition-all"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/registro"
              className="btn-primary text-white px-5 py-2.5 rounded-lg font-medium text-sm"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-20 px-4 text-center relative">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent-cyan/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-accent-gold/20 bg-accent-gold/5">
          <span className="text-accent-gold text-xs font-semibold tracking-widest uppercase font-display">Mundial 2026</span>
        </div>

        <h2 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
          <span className="text-text-primary">Reservá tu </span>
          <span className="text-gradient-cyan">cancha</span>
          <br />
          <span className="text-text-primary">deportiva</span>
        </h2>

        <p className="text-lg text-text-secondary mb-12 max-w-xl mx-auto leading-relaxed">
          Encontrá las mejores canchas disponibles, elegí el horario que mejor se adapte a vos y reservá al instante.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/registro"
            className="btn-primary text-white px-10 py-4 rounded-xl text-lg font-bold tracking-wide"
          >
            Crear Cuenta
          </Link>
          <Link
            href="/login"
            className="border-2 border-accent-cyan/30 text-accent-cyan px-10 py-4 rounded-xl text-lg font-bold tracking-wide hover:bg-accent-cyan/5 transition-all"
          >
            Ya tengo cuenta
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-8 mt-20 max-w-lg mx-auto">
          <div className="text-center">
            <div className="text-3xl font-black text-gradient-cyan">3</div>
            <div className="text-xs text-text-muted mt-1 font-medium uppercase tracking-wider">Tablas</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-gradient-gold">24/7</div>
            <div className="text-xs text-text-muted mt-1 font-medium uppercase tracking-wider">Disponible</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-accent-green">✓</div>
            <div className="text-xs text-text-muted mt-1 font-medium uppercase tracking-wider">Rápido</div>
          </div>
        </div>
      </main>
    </div>
  );
}
