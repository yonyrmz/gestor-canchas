'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import DueñoCanchas from '@/components/dono/DueñoCanchas';
import DueñoHorarios from '@/components/dono/DueñoHorarios';
import DueñoTurnos from '@/components/dono/DueñoTurnos';
import DueñoPerfil from '@/components/dono/DueñoPerfil';

export default function DonoPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.rol !== 'dono')) {
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
              <h1 className="text-lg font-black tracking-wide text-text-primary font-display">MI PANEL</h1>
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
        <section className="card-glass rounded-2xl glow-gold">
          <DueñoPerfil userId={user.id} />
        </section>
        <section className="card-glass rounded-2xl glow-cyan">
          <DueñoCanchas userId={user.id} />
        </section>
        <section className="card-glass rounded-2xl glow-gold">
          <DueñoHorarios userId={user.id} />
        </section>
        <section className="card-glass rounded-2xl glow-cyan">
          <DueñoTurnos userId={user.id} />
        </section>
      </main>
    </div>
  );
}
