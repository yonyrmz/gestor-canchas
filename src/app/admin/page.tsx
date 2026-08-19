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
        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-green flex items-center justify-center glow-cyan">
                <span className="text-bg-primary font-black text-sm">GC</span>
              </div>
            </Link>
            <div>
              <h1 className="text-lg font-black tracking-wide text-text-primary font-display">SUPER ADMIN</h1>
              <p className="text-xs text-text-muted">{user.nombre}</p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <Link href="/" className="text-xs text-text-muted hover:text-text-secondary transition-colors uppercase tracking-wider font-medium">Inicio</Link>
            <button
              onClick={async () => { await logout(); router.push('/login'); }}
              className="border border-border-dim text-text-muted px-3 py-1.5 rounded-lg text-xs hover:border-accent-magenta/30 hover:text-accent-magenta transition-all font-medium uppercase tracking-wider"
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
