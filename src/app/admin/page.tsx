'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import UsuariosAdmin from '@/components/admin/UsuariosAdmin';
import CanchasAdmin from '@/components/admin/CanchasAdmin';
import HorariosAdmin from '@/components/admin/HorariosAdmin';
import TurnosAdmin from '@/components/admin/TurnosAdmin';
import ConfigAdmin from '@/components/admin/ConfigAdmin';

export default function AdminPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.rol !== 'superadmin')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-text-muted animate-pulse font-display tracking-widest text-sm uppercase">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary noise-bg">
      <header className="border-b border-border-dim bg-bg-secondary/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-3 sm:py-4 px-3 sm:px-4 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link href="/" className="flex-shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-green flex items-center justify-center glow-cyan">
                <span className="text-bg-primary font-black text-xs sm:text-sm">GC</span>
              </div>
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-black tracking-wide text-text-primary font-display truncate">SUPER ADMIN</h1>
              <p className="text-[10px] sm:text-xs text-text-muted truncate">{user.nombre}</p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 items-center flex-shrink-0">
            <Link href="/" className="text-[10px] sm:text-xs text-text-muted hover:text-text-secondary transition-colors uppercase tracking-wider font-medium hidden sm:block">Inicio</Link>
            <button
              onClick={async () => { await logout(); router.push('/login'); }}
              className="border border-border-dim text-text-muted px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs hover:border-accent-magenta/30 hover:text-accent-magenta transition-all font-medium uppercase tracking-wider"
            >
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 px-4 space-y-6">
        <section className="card-glass rounded-2xl glow-cyan">
          <UsuariosAdmin />
        </section>
        <section className="card-glass rounded-2xl glow-cyan">
          <CanchasAdmin />
        </section>
        <section className="card-glass rounded-2xl glow-cyan">
          <HorariosAdmin />
        </section>
        <section className="card-glass rounded-2xl glow-cyan">
          <TurnosAdmin />
        </section>
        <section className="card-glass rounded-2xl glow-gold">
          <ConfigAdmin />
        </section>
      </main>
    </div>
  );
}
