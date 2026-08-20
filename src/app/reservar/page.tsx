'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Cancha, Horario, Turno, Notificacion } from '@/lib/db/schema';
import CanchasAgrupadas from '@/components/client/CanchasAgrupadas';
import FormularioReserva from '@/components/client/FormularioReserva';
import ClienteHistorial from '@/components/client/ClienteHistorial';

interface CanchaConHorarios extends Cancha {
  horarios: Horario[];
  propietario_nombre: string;
}

export default function ReservarPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [canchaSeleccionada, setCanchaSeleccionada] = useState<CanchaConHorarios | null>(null);
  const [showing, setShowing] = useState<'reservas' | 'historial' | null>(null);

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const [turnosConfirmados, setTurnosConfirmados] = useState<Turno[]>([]);

  useEffect(() => {
    if (!loading && (!user || user.rol !== 'cliente')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/notificaciones?usuario_id=${user.id}`)
      .then((r) => r.json())
      .then((d) => {
        setNotificaciones(d.notificaciones || []);
        setNoLeidas(d.noLeidas || 0);
      })
      .catch(() => {});

    fetch(`/api/turnos?usuario_id=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        const confirmados = Array.isArray(data) ? data.filter((t: Turno) => t.estado === 'confirmado') : [];
        setTurnosConfirmados(confirmados);
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = async () => {
    if (!user) return;
    await fetch('/api/notificaciones', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: user.id, marcarTodas: true }),
    });
    setNoLeidas(0);
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  };

  const markOneRead = async (id: string) => {
    await fetch('/api/notificaciones', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setNotificaciones((prev) => prev.map((n) => n.id === id ? { ...n, leida: true } : n));
    setNoLeidas((prev) => Math.max(0, prev - 1));
  };

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
              <h1 className="text-lg font-black tracking-wide text-text-primary font-display">RESERVAS</h1>
              <p className="text-xs text-text-muted">{user.nombre}</p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => setShowing((prev) => prev === 'historial' ? null : 'historial')}
              className={`text-xs uppercase tracking-wider font-medium transition-all px-3 py-1.5 rounded-lg border ${
                showing === 'historial'
                  ? 'text-accent-cyan border-accent-cyan/30 bg-accent-cyan/10'
                  : 'text-text-muted border-border-dim hover:border-accent-cyan/30 hover:text-text-secondary'
              }`}
            >
              Mis Reservas
            </button>
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setShowNotifDropdown((p) => !p)}
                className="relative p-2 text-accent-cyan hover:text-accent-cyan/80 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {noLeidas > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent-magenta text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center min-w-[18px]">
                    {noLeidas > 9 ? '9+' : noLeidas}
                  </span>
                )}
              </button>
              {showNotifDropdown && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-bg-secondary border border-border-dim rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="flex justify-between items-center px-4 py-3 border-b border-border-dim">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Notificaciones</span>
                    {noLeidas > 0 && (
                      <button onClick={markAllRead} className="text-[10px] text-accent-cyan hover:text-accent-cyan/80 font-medium transition-colors uppercase tracking-wider">
                        Marcar todas leído
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notificaciones.length === 0 ? (
                      <p className="text-text-muted text-xs text-center py-6">Sin notificaciones</p>
                    ) : (
                      notificaciones.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 border-b border-border-dim last:border-0 ${!n.leida ? 'bg-accent-cyan/5' : ''}`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-text-primary truncate">{n.titulo}</p>
                              <p className="text-[11px] text-text-muted mt-0.5 line-clamp-2">{n.mensaje}</p>
                            </div>
                            {!n.leida && (
                              <button
                                onClick={() => markOneRead(n.id)}
                                className="text-[10px] text-accent-cyan hover:text-accent-cyan/80 font-medium whitespace-nowrap transition-colors"
                              >
                                Leído
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
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
      <main className="max-w-4xl mx-auto py-6 px-4">
        {turnosConfirmados.length > 0 && showing === null && (
          <div className="space-y-3 mb-6">
            <h2 className="text-xs font-bold text-accent-green uppercase tracking-widest font-display">Tus reservas confirmadas</h2>
            {turnosConfirmados.map((t) => (
              <div key={t.id} className="card-glass rounded-2xl border border-accent-green/30 bg-accent-green/5 glow-green p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-text-primary text-sm">Turno #{t.id}</p>
                    <p className="text-xs text-text-muted mt-0.5">{t.fecha} · {t.hora_inicio} - {t.hora_fin}</p>
                  </div>
                  <span className="text-xs font-bold text-accent-green border border-accent-green/30 bg-accent-green/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Confirmado
                  </span>
                </div>
                <p className="text-gradient-gold font-black text-lg mt-2">${t.tarifa}</p>
              </div>
            ))}
          </div>
        )}

        <div className="card-glass rounded-2xl">
          {showing === 'historial' ? (
            <ClienteHistorial userId={user.id} />
          ) : canchaSeleccionada ? (
            <FormularioReserva
              cancha={canchaSeleccionada}
              onVolver={() => setCanchaSeleccionada(null)}
            />
          ) : (
            <CanchasAgrupadas onSelectCancha={setCanchaSeleccionada} />
          )}
        </div>
      </main>
    </div>
  );
}
