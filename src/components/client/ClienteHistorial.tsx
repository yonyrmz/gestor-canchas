'use client';

import { useState, useEffect } from 'react';
import { Turno } from '@/lib/db/schema';

interface Props {
  userId: string;
}

interface TurnoConNombre extends Turno {
  cancha_nombre: string;
}

const ESTADO_CONFIG: Record<string, { label: string; color: string; glow: string }> = {
  confirmado: { label: 'Confirmado', color: 'text-accent-green', glow: 'glow-green border-accent-green/30 bg-accent-green/5' },
  pendiente: { label: 'Pendiente', color: 'text-accent-cyan', glow: 'glow-cyan border-accent-cyan/30 bg-accent-cyan/5' },
  cancelado: { label: 'Cancelado', color: 'text-text-muted', glow: 'border-border-dim bg-white/[0.02]' },
  no_show: { label: 'No asistió', color: 'text-accent-magenta', glow: 'glow-cyan border-accent-magenta/30 bg-accent-magenta/5' },
};

function getCountdown(deadline: Date): { h: number; m: number; s: number; expired: boolean } {
  const diff = deadline.getTime() - Date.now();
  if (diff <= 0) return { h: 0, m: 0, s: 0, expired: true };
  const totalSec = Math.floor(diff / 1000);
  return {
    h: Math.floor(totalSec / 3600),
    m: Math.floor((totalSec % 3600) / 60),
    s: totalSec % 60,
    expired: false,
  };
}

function CountdownTimer({ deadline, onExpired }: { deadline: Date; onExpired: () => void }) {
  const [cd, setCd] = useState(() => getCountdown(deadline));

  useEffect(() => {
    if (cd.expired) { onExpired(); return; }
    const id = setInterval(() => {
      const next = getCountdown(deadline);
      setCd(next);
      if (next.expired) { clearInterval(id); onExpired(); }
    }, 1000);
    return () => clearInterval(id);
  }, [deadline, onExpired, cd.expired]);

  if (cd.expired) return null;
  return (
    <span className="text-xs font-mono text-accent-gold font-bold">
      Cancelar en {cd.h}h {String(cd.m).padStart(2, '0')}m {String(cd.s).padStart(2, '0')}s
    </span>
  );
}

export default function ClienteHistorial({ userId }: Props) {
  const [turnos, setTurnos] = useState<TurnoConNombre[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelacionHoras, setCancelacionHoras] = useState<number>(1);
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);
  const [expirados, setExpirados] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/turnos?usuario_id=${userId}`)
      .then((r) => r.json())
      .then((data) => { setTurnos(data); setLoading(false); })
      .catch(() => setLoading(false));
    fetch('/api/config')
      .then((r) => r.json())
      .then((cfg: Record<string, string>) => {
        if (cfg.cancelacion_horas) setCancelacionHoras(parseInt(cfg.cancelacion_horas, 10));
      })
      .catch(() => {});
  }, [userId]);

  const handleCancel = async (turnoId: string) => {
    setCancelandoId(turnoId);
    await fetch('/api/turnos/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: turnoId, estado: 'cancelado', usuario_id: userId }),
    });
    setTurnos((prev) => prev.map((t) => t.id === turnoId ? { ...t, estado: 'cancelado' as const } : t));
    setCancelandoId(null);
  };

  const markExpired = (turnoId: string) => {
    setExpirados((prev) => new Set(prev).add(turnoId));
  };

  if (loading) return <div className="p-6 text-text-muted animate-pulse">Cargando historial...</div>;

  const agrupados = turnos.reduce<Record<string, TurnoConNombre[]>>((acc, t) => {
    const key = t.estado || 'pendiente';
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const orden: (keyof typeof ESTADO_CONFIG)[] = ['confirmado', 'pendiente', 'cancelado', 'no_show'];

  return (
    <div className="p-6">
      <h2 className="text-xl font-black tracking-wide text-text-primary font-display mb-6">MIS RESERVAS</h2>
      {turnos.length === 0 ? (
        <p className="text-text-muted text-center text-sm">No tenés reservas todavía</p>
      ) : (
        <div className="space-y-6">
          {orden.map((estado) => {
            const items = agrupados[estado];
            if (!items || items.length === 0) return null;
            const config = ESTADO_CONFIG[estado];
            return (
              <div key={estado}>
                <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${config.color} font-display`}>
                  {config.label} ({items.length})
                </h3>
                <div className="space-y-3">
                  {items.map((turno) => {
                    const puedeCancelar = (estado === 'confirmado' || estado === 'pendiente') && !expirados.has(turno.id);
                    const deadline = new Date(`${turno.fecha}T${turno.hora_inicio}:00`);
                    deadline.setHours(deadline.getHours() - cancelacionHoras);
                    return (
                      <div key={turno.id} className={`rounded-xl p-4 border transition-all ${config.glow}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-text-primary text-sm">{turno.cancha_nombre || `Cancha #${turno.cancha_id}`}</p>
                            <p className="text-xs text-text-muted mt-0.5">{turno.fecha} · {turno.hora_inicio} - {turno.hora_fin}</p>
                          </div>
                          <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${config.color} ${
                            estado === 'confirmado' ? 'border-accent-green/30 bg-accent-green/10' :
                            estado === 'pendiente' ? 'border-accent-cyan/30 bg-accent-cyan/10' :
                            estado === 'no_show' ? 'border-accent-magenta/30 bg-accent-magenta/10' :
                            'border-border-dim bg-white/[0.03]'
                          }`}>
                            {config.label}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="font-black text-sm text-gradient-gold">${turno.tarifa}</span>
                          <div className="flex items-center gap-3">
                            {estado === 'no_show' && turno.multa != null && (
                              <span className="text-xs font-bold text-accent-magenta">
                                Multa: ${turno.multa}{turno.multa_descripcion ? ` — ${turno.multa_descripcion}` : ''}
                              </span>
                            )}
                            {estado === 'cancelado' && turno.cancelacion_motivo && (
                              <span className="text-xs text-text-muted">
                                Motivo: {turno.cancelacion_motivo}
                              </span>
                            )}
                            {puedeCancelar && (
                              <CountdownTimer deadline={deadline} onExpired={() => markExpired(turno.id)} />
                            )}
                            {puedeCancelar && (
                              <button
                                onClick={() => handleCancel(turno.id)}
                                disabled={cancelandoId === turno.id}
                                className="text-xs font-bold text-accent-magenta border border-accent-magenta/30 px-3 py-1.5 rounded-lg hover:bg-accent-magenta/10 transition-all uppercase tracking-wider"
                              >
                                {cancelandoId === turno.id ? 'Cancelando...' : 'Cancelar'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
