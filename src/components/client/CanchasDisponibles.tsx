'use client';

import { useState, useEffect } from 'react';
import { Cancha, Horario } from '@/lib/db/schema';

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

interface CanchaConHorarios extends Cancha {
  horarios: Horario[];
}

interface Props {
  onSelectCancha: (cancha: CanchaConHorarios) => void;
  canchaSeleccionada: string | null;
}

export default function CanchasDisponibles({ onSelectCancha, canchaSeleccionada }: Props) {
  const [canchas, setCanchas] = useState<CanchaConHorarios[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const resCanchas = await fetch('/api/canchas');
      const allCanchas = await resCanchas.json();
      const disponibles = allCanchas.filter((c: Cancha) => c.disponible);

      const canchasConHorarios = await Promise.all(
        disponibles.map(async (c: Cancha) => {
          const resH = await fetch(`/api/horarios?cancha_id=${c.id}`);
          const horarios = await resH.json();
          return { ...c, horarios };
        })
      );

      setCanchas(canchasConHorarios);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-6 text-text-muted animate-pulse">Cargando canchas...</div>;
  if (canchas.length === 0) return <div className="p-6 text-text-muted">No hay canchas disponibles</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-black tracking-wide text-text-primary font-display mb-6">CANCHAS DISPONIBLES</h2>
      <div className="space-y-3">
        {canchas.map((cancha) => (
          <button
            key={cancha.id}
            onClick={() => onSelectCancha(cancha)}
            className={`w-full text-left border-2 rounded-xl p-5 transition-all ${
              canchaSeleccionada === cancha.id
                ? 'border-accent-cyan bg-accent-cyan/5 glow-cyan-strong'
                : 'border-border-dim hover:border-accent-cyan/30 bg-bg-primary/30'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-text-primary">{cancha.nombre}</h3>
                <p className="text-sm text-text-muted">{cancha.tipo}</p>
              </div>
              <span className="text-gradient-gold font-black text-lg">${cancha.precio_por_hora}<span className="text-xs text-text-muted font-normal">/h</span></span>
            </div>
            {cancha.descripcion && (
              <p className="text-sm text-text-secondary mt-2">{cancha.descripcion}</p>
            )}
            {cancha.horarios.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {cancha.horarios.map((h) => (
                  <span key={h.id} className="bg-accent-cyan/10 text-accent-cyan text-xs px-2.5 py-1 rounded-full border border-accent-cyan/20 font-medium">
                    {DIAS[h.dia_semana]} {h.hora_apertura}-{h.hora_cierre}
                  </span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
