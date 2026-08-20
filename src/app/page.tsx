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
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-green flex items-center justify-center glow-cyan">
              <span className="text-bg-primary font-black text-sm sm:text-lg">GC</span>
            </div>
            <h1 className="font-display text-base sm:text-xl font-bold tracking-wide text-text-primary">GESTOR CANCHAS</h1>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Link
              href="/login"
              className="border border-border-dim text-text-secondary px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg hover:border-accent-cyan/40 hover:text-text-primary font-medium text-xs sm:text-sm transition-all"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/registro"
              className="btn-primary text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-12 sm:py-20 px-3 sm:px-4 text-center relative">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[400px] bg-accent-cyan/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-accent-gold/20 bg-accent-gold/5">
          <span className="text-accent-gold text-xs font-semibold tracking-widest uppercase font-display">Mundial 2026</span>
        </div>

        <h2 className="text-4xl sm:text-5xl md:text-7xl font-black mb-4 sm:mb-6 leading-tight">
          <span className="text-text-primary">Reservá tu </span>
          <span className="text-gradient-cyan">cancha</span>
          <br />
          <span className="text-text-primary">deportiva</span>
        </h2>

        <p className="text-base sm:text-lg text-text-secondary mb-8 sm:mb-12 max-w-xl mx-auto leading-relaxed px-2">
          Encontrá las mejores canchas disponibles, elegí el horario que mejor se adapte a vos y reservá al instante.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link
            href="/registro"
            className="btn-primary text-white px-6 sm:px-10 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-bold tracking-wide"
          >
            Crear Cuenta
          </Link>
          <Link
            href="/login"
            className="border-2 border-accent-cyan/30 text-accent-cyan px-6 sm:px-10 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-bold tracking-wide hover:bg-accent-cyan/5 transition-all"
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
