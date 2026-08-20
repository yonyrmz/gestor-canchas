'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Cancha, Horario } from '@/lib/db/schema';
import { useAuth } from '@/components/AuthProvider';
import DatePicker from '@/components/shared/DatePicker';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

interface CanchaConHorarios extends Cancha {
  horarios: Horario[];
  propietario_nombre: string;
}

interface UbicacionData {
  lat: number; lng: number; descripcion: string;
  calle: string; altura: string; localidad: string; provincia: string; pais: string;
}

function parseFotos(fotos?: string | null): string[] {
  if (!fotos) return [];
  try { const p = JSON.parse(fotos); return Array.isArray(p) ? p : []; } catch { return fotos.split(',').map(s => s.trim()).filter(Boolean); }
}

function parseUbicacion(u?: string | null): UbicacionData | null {
  if (!u) return null;
  try { return JSON.parse(u); } catch { return null; }
}

function formatearUbicacion(u: UbicacionData | null): string {
  if (!u) return '';
  const parts = [u.descripcion, u.calle && `${u.calle} ${u.altura}`.trim(), u.localidad, u.provincia].filter(Boolean);
  return parts.join(', ');
}

interface Props {
  cancha: CanchaConHorarios;
  onVolver: () => void;
}

function generarSlots(horario: Horario) {
  const slots: string[] = [];
  const [apH, apM] = horario.hora_apertura.split(':').map(Number);
  const [ciH, ciM] = horario.hora_cierre.split(':').map(Number);
  const closeIsMidnight = ciH === 0 && ciM === 0;
  let h = apH, m = apM;
  while (closeIsMidnight ? (h !== 0 || m === 0) : (h < ciH || (h === ciH && m < ciM))) {
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    m += 60;
    if (m >= 60) { h++; m -= 60; }
    if (closeIsMidnight && h === 24) break;
  }
  return slots;
}

export default function FormularioReserva({ cancha, onVolver }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [fecha, setFecha] = useState('');
  const [horaSeleccionada, setHoraSeleccionada] = useState('');
  const [slotsDisponibles, setSlotsDisponibles] = useState<string[]>([]);
  const [turnosOcupados, setTurnosOcupados] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancelacionHoras, setCancelacionHoras] = useState<number | null>(null);

  const diaSemana = fecha ? new Date(fecha + 'T12:00:00').getDay() : -1;
  const horarioDelDia = cancha.horarios.find((h) => h.dia_semana === diaSemana);

  const fechaMinima = new Date().toISOString().split('T')[0];

  const fotos = parseFotos(cancha.fotos);
  const ubicacion = parseUbicacion(cancha.ubicacion);

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((cfg: { clave: string; valor: string }[]) => {
        const entry = cfg.find((c) => c.clave === 'cancelacion_horas');
        if (entry) setCancelacionHoras(parseInt(entry.valor, 10));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (fecha && horarioDelDia) {
      const slots = generarSlots(horarioDelDia);
      setSlotsDisponibles(slots);
      setHoraSeleccionada('');

      fetch(`/api/turnos?fecha=${fecha}&cancha_id=${cancha.id}`)
        .then((r) => r.json())
        .then((turnos) => {
          const ocupados: string[] = [];
          for (const t of turnos) {
            if (t.estado !== 'cancelado') {
              const slots = generarSlots({ hora_apertura: t.hora_inicio, hora_cierre: t.hora_fin } as Horario);
              ocupados.push(...slots);
            }
          }
          setTurnosOcupados(ocupados);
        });
    } else {
      setSlotsDisponibles([]);
    }
  }, [fecha, cancha, horarioDelDia]);

  const canCancelCheck = (): boolean => {
    if (cancelacionHoras === null || !fecha || !horaSeleccionada) return false;
    const turnoInicio = new Date(`${fecha}T${horaSeleccionada}:00`);
    const now = new Date();
    const diffMs = turnoInicio.getTime() - now.getTime();
    const diffHoras = diffMs / (1000 * 60 * 60);
    return diffHoras >= cancelacionHoras;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !fecha || !horaSeleccionada) return;

    setLoading(true);
    setError('');

    const turnoInicio = new Date(`${fecha}T${horaSeleccionada}:00`);
    const now = new Date();
    const diffHoras = (turnoInicio.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (cancelacionHoras !== null && diffHoras < cancelacionHoras) {
      setError(`No podés cancelar este turno después de reservarlo. La política permite cancelar hasta ${cancelacionHoras} hora(s) antes.`);
      setLoading(false);
      return;
    }

    const horaFin = `${String(parseInt(horaSeleccionada.split(':')[0]) + 1).padStart(2, '0')}:${horaSeleccionada.split(':')[1]}`;
    const tarifa = cancha.precio_por_hora;

    const res = await fetch('/api/turnos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario_id: user.id,
        cancha_id: cancha.id,
        fecha,
        hora_inicio: horaSeleccionada,
        hora_fin: horaFin,
        tarifa,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Error al reservar');
      return;
    }

    router.push(`/reservar/turno?turno_id=${data.turno.id}`);
  };

  return (
    <div className="p-4 sm:p-6">
      <button onClick={onVolver} className="text-accent-cyan hover:text-accent-cyan/80 text-sm mb-4 font-medium transition-colors">&larr; Volver a canchas</button>

      {fotos.length > 0 && (
        <img
          src={fotos[0]}
          alt={cancha.nombre}
          className="w-full h-48 rounded-xl object-cover mb-5 border border-border-dim"
        />
      )}

      <h2 className="text-xl font-black tracking-wide text-text-primary font-display mb-1">{cancha.nombre}</h2>
      <p className="text-text-muted text-sm mb-1">{cancha.tipo} · <span className="text-accent-gold font-bold">${cancha.precio_por_hora}/hora</span></p>
      {ubicacion && (
        <p className="text-text-muted text-xs mb-6">{formatearUbicacion(ubicacion)}</p>
      )}
      {!ubicacion && <div className="mb-6" />}

      {cancelacionHoras !== null && (
        <div className="bg-accent-cyan/5 border border-accent-cyan/20 rounded-lg px-4 py-3 mb-5 text-xs text-accent-cyan font-medium">
          Podés cancelar hasta {cancelacionHoras} hora(s) antes del turno
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Fecha</label>
          <DatePicker value={fecha} onChange={setFecha} minDate={fechaMinima} />
        </div>

        {fecha && !horarioDelDia && (
          <div className="bg-accent-magenta/10 border border-accent-magenta/20 text-accent-magenta px-4 py-3 rounded-lg text-sm font-medium">
            La cancha no tiene horarios disponibles los {DIAS[diaSemana]}s.
          </div>
        )}

        {slotsDisponibles.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Elegí un horario</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slotsDisponibles.map((slot) => {
                const ocupado = turnosOcupados.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={ocupado}
                    onClick={() => setHoraSeleccionada(slot)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-bold border transition-all ${
                      ocupado
                        ? 'bg-white/[0.02] text-text-muted/40 border-border-dim cursor-not-allowed line-through'
                        : horaSeleccionada === slot
                        ? 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan glow-cyan'
                        : 'border-border-dim text-text-secondary hover:border-accent-cyan/30 hover:text-text-primary'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-accent-magenta/10 border border-accent-magenta/20 text-accent-magenta px-4 py-3 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        {horaSeleccionada && (
          <div className="bg-accent-cyan/5 border border-accent-cyan/20 rounded-xl p-5 glow-cyan">
            <h3 className="font-bold text-sm text-accent-cyan uppercase tracking-wider mb-3 font-display">Resumen de reserva</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-text-muted">Cancha</span>
                <span className="font-semibold text-text-primary">{cancha.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Fecha</span>
                <span className="font-semibold text-text-primary">{fecha}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Horario</span>
                <span className="font-mono font-bold text-accent-cyan">{horaSeleccionada} - {`${String(parseInt(horaSeleccionada.split(':')[0]) + 1).padStart(2, '0')}:${horaSeleccionada.split(':')[1]}`}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-accent-cyan/10">
                <span className="text-text-muted">Tarifa</span>
                <span className="font-black text-lg text-gradient-gold">${cancha.precio_por_hora}</span>
              </div>
            </div>
          </div>
        )}

        {!fecha && (
          <p className="text-center text-text-muted text-sm">Seleccioná una fecha para ver los horarios disponibles</p>
        )}
        {fecha && !horarioDelDia && (
          <p className="text-center text-text-muted text-sm">No hay horarios configurados para este día</p>
        )}
        {fecha && horarioDelDia && !horaSeleccionada && (
          <p className="text-center text-text-muted text-sm">Elegí un horario para continuar</p>
        )}
        <button
          type="submit"
          disabled={!horaSeleccionada || loading}
          className={`w-full py-3.5 rounded-xl font-black tracking-wide text-sm uppercase transition-all ${
            horaSeleccionada && !loading
              ? 'btn-gold cursor-pointer'
              : 'bg-white/[0.03] text-text-muted/40 border border-border-dim cursor-not-allowed'
          }`}
        >
          {loading ? 'Reservando...' : horaSeleccionada ? 'Confirmar Reserva' : 'Elegí un horario'}
        </button>
      </form>
    </div>
  );
}
