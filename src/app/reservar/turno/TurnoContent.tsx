'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Turno } from '@/lib/db/schema';

interface TurnoDetallado extends Turno {
  usuario_nombre: string;
  cancha_nombre: string;
  precio_por_hora: number;
}

export default function TurnoContent() {
  const searchParams = useSearchParams();
  const turnoId = searchParams.get('turno_id');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [turno, setTurno] = useState<TurnoDetallado | null>(null);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!turnoId) { setLoading(false); return; }
    Promise.all([
      fetch('/api/turnos').then((r) => r.json()),
      fetch('/api/config').then((r) => r.json()),
    ]).then(([turnos, cfg]) => {
      const t = Array.isArray(turnos) ? turnos.find((t: TurnoDetallado) => t.id === turnoId) : null;
      setTurno(t || null);
      setConfig(cfg);
      setLoading(false);
    });
  }, [turnoId]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-text-muted animate-pulse font-display tracking-widest text-sm uppercase">Cargando...</div>
      </div>
    );
  }

  if (!turno) {
    return (
      <div className="min-h-screen bg-bg-primary noise-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted mb-4">Turno no encontrado</p>
          <Link href="/reservar" className="text-accent-cyan hover:text-accent-cyan/80 font-medium transition-colors">Volver a reservar</Link>
        </div>
      </div>
    );
  }

  const getEstadoInfo = () => {
    switch (turno.estado) {
      case 'pendiente':
        return {
          cardClass: 'bg-accent-gold/5 border-accent-gold/20 glow-gold',
          labelClass: 'text-accent-gold',
          label: 'Pendiente de confirmación',
          icon: '⏳'
        };
      case 'confirmado':
        return {
          cardClass: 'bg-accent-green/5 border-accent-green/20 glow-green',
          labelClass: 'text-accent-green',
          label: 'Confirmado - podés realizar la transferencia',
          icon: '✓'
        };
      case 'cancelado':
        return {
          cardClass: 'bg-accent-magenta/5 border-accent-magenta/20',
          labelClass: 'text-accent-magenta',
          label: 'Cancelado',
          icon: '✕'
        };
      default:
        return {
          cardClass: 'bg-white/5 border-border-dim',
          labelClass: 'text-text-secondary',
          label: turno.estado,
          icon: '?'
        };
    }
  };

  const estadoInfo = getEstadoInfo();

  return (
    <div className="min-h-screen bg-bg-primary noise-bg">
      <header className="border-b border-border-dim bg-bg-secondary/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-green flex items-center justify-center glow-cyan">
              <span className="text-bg-primary font-black text-sm">GC</span>
            </div>
          </Link>
          <Link href="/reservar" className="text-accent-cyan hover:text-accent-cyan/80 text-sm font-bold transition-colors uppercase tracking-wider">
            Nueva reserva →
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <div className={`border rounded-2xl p-6 ${estadoInfo.cardClass}`}>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">{estadoInfo.icon}</span>
            <div className={`font-black text-lg uppercase tracking-wide font-display ${estadoInfo.labelClass}`}>{estadoInfo.label}</div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-text-muted">Reserva #</span>
              <span className="font-bold text-text-primary">{turno.id}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-text-muted">Cancha</span>
              <span className="font-bold text-text-primary">{turno.cancha_nombre}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-text-muted">Estado</span>
              <span className={`font-bold uppercase ${estadoInfo.labelClass}`}>{turno.estado}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-text-muted">Fecha</span>
              <span className="font-bold text-text-primary">{turno.fecha}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-text-muted">Horario</span>
              <span className="font-mono font-bold text-accent-cyan">{turno.hora_inicio} - {turno.hora_fin}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-text-muted">Tarifa total</span>
              <span className="font-black text-xl text-gradient-gold">${turno.tarifa}</span>
            </div>
          </div>
        </div>

        {turno.estado === 'pendiente' && (
          <div className="card-glass rounded-2xl p-6 glow-cyan">
            <div className="bg-accent-gold/5 border border-accent-gold/10 rounded-lg px-4 py-3">
              <p className="text-xs text-accent-gold">
                Tu reserva está pendiente de confirmación por el administrador.
              </p>
            </div>
          </div>
        )}
        {turno.estado === 'confirmado' && (
          <div className="card-glass rounded-2xl p-6 glow-green">
            <div className="bg-accent-green/5 border border-accent-green/10 rounded-lg px-4 py-3">
              <p className="text-xs text-accent-green font-medium">
                Tu reserva fue confirmada. ¡Nos vemos en la cancha!
              </p>
            </div>
          </div>
        )}

        {turno.estado === 'cancelado' && (
          <div className="card-glass rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">✕</div>
            <p className="text-accent-magenta font-bold mb-4">Esta reserva fue cancelada.</p>
            <Link
              href="/reservar"
              className="inline-block btn-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider"
            >
              Hacer una nueva reserva
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
