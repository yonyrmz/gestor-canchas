'use client';

import { useState, useEffect } from 'react';
import { Cancha, Horario } from '@/lib/db/schema';
import BulkSchedule from '@/components/shared/BulkSchedule';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function HorariosAdmin() {
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [canchaSeleccionada, setCanchaSeleccionada] = useState<number>(0);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBulk, setShowBulk] = useState(false);
  const [form, setForm] = useState({ dia_semana: '1', hora_apertura: '08:00', hora_cierre: '22:00' });

  useEffect(() => {
    fetch('/api/canchas')
      .then((r) => r.json())
      .then((data) => { setCanchas(data); setLoading(false); });
  }, []);

  useEffect(() => {
    if (canchaSeleccionada) {
      fetch(`/api/horarios?cancha_id=${canchaSeleccionada}`)
        .then((r) => r.json())
        .then(setHorarios);
      setShowBulk(false);
    }
  }, [canchaSeleccionada]);

  const fetchHorarios = () => {
    if (canchaSeleccionada) {
      fetch(`/api/horarios?cancha_id=${canchaSeleccionada}`)
        .then((r) => r.json())
        .then(setHorarios);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/horarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cancha_id: canchaSeleccionada,
        dia_semana: parseInt(form.dia_semana),
        hora_apertura: form.hora_apertura,
        hora_cierre: form.hora_cierre,
      }),
    });
    fetchHorarios();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/horarios?id=${id}`, { method: 'DELETE' });
    setHorarios(horarios.filter((h) => h.id !== id));
  };

  if (loading) return <div className="p-6 text-text-muted animate-pulse">Cargando...</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-black tracking-wide text-text-primary font-display mb-6">HORARIOS</h2>
      <div className="mb-6">
        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Seleccionar cancha</label>
        <select
          value={canchaSeleccionada}
          onChange={(e) => setCanchaSeleccionada(parseInt(e.target.value))}
          className="input-dark rounded-lg px-4 py-3 text-sm w-full max-w-md"
        >
          <option value={0}>-- Elegí una cancha --</option>
          {canchas.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre} ({c.tipo})</option>
          ))}
        </select>
      </div>

      {canchaSeleccionada > 0 && (
        <>
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setShowBulk(false)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                !showBulk ? 'btn-primary text-white' : 'border border-border-dim text-text-muted hover:text-text-primary'
              }`}
            >
              Individual
            </button>
            <button
              onClick={() => setShowBulk(true)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                showBulk ? 'btn-success text-bg-primary' : 'border border-border-dim text-text-muted hover:text-text-primary'
              }`}
            >
              Masivo
            </button>
          </div>

          {showBulk ? (
            <div className="mb-6">
              <BulkSchedule canchaId={canchaSeleccionada} onSaved={fetchHorarios} onCancel={() => setShowBulk(false)} />
            </div>
          ) : (
            <form onSubmit={handleAdd} className="bg-bg-primary/50 border border-border-dim p-5 rounded-xl mb-6 flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Día</label>
                <select
                  value={form.dia_semana}
                  onChange={(e) => setForm({ ...form, dia_semana: e.target.value })}
                  className="input-dark rounded-lg px-4 py-2.5 text-sm"
                >
                  {DIAS.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Apertura</label>
                <input type="time" value={form.hora_apertura}
                  onChange={(e) => setForm({ ...form, hora_apertura: e.target.value })}
                  className="input-dark rounded-lg px-4 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Cierre</label>
                <input type="time" value={form.hora_cierre}
                  onChange={(e) => setForm({ ...form, hora_cierre: e.target.value })}
                  className="input-dark rounded-lg px-4 py-2.5 text-sm" />
              </div>
              <button type="submit"
                className="btn-primary text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider">
                Agregar
              </button>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border-dim">
                  <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Día</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Apertura</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Cierre</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {horarios.map((h) => (
                  <tr key={h.id} className="border-b border-border-dim/50 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-semibold text-text-primary">{DIAS[h.dia_semana]}</td>
                    <td className="px-4 py-3 text-accent-cyan font-mono font-bold">{h.hora_apertura}</td>
                    <td className="px-4 py-3 text-accent-cyan font-mono font-bold">{h.hora_cierre}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(h.id)} className="text-accent-magenta/60 hover:text-accent-magenta text-xs font-bold uppercase tracking-wider transition-colors">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {horarios.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-text-muted">No hay horarios configurados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
