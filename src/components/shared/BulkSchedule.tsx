'use client';

import { useState } from 'react';

const DIAS = [
  { label: 'Lun', value: 1 }, { label: 'Mar', value: 2 }, { label: 'Mié', value: 3 },
  { label: 'Jue', value: 4 }, { label: 'Vie', value: 5 }, { label: 'Sáb', value: 6 }, { label: 'Dom', value: 0 },
];

interface Props {
  canchaId: string;
  onSaved: () => void;
  onCancel: () => void;
}

export default function BulkSchedule({ canchaId, onSaved, onCancel }: Props) {
  const [seleccionados, setSeleccionados] = useState<number[]>([1, 2, 3, 4, 5]);
  const [horaApertura, setHoraApertura] = useState('08:00');
  const [horaCierre, setHoraCierre] = useState('22:00');
  const [saving, setSaving] = useState(false);

  const toggle = (v: number) => {
    setSeleccionados((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seleccionados.length) return;
    setSaving(true);
    await fetch('/api/horarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cancha_id: canchaId, bulk: true, dias: seleccionados, hora_apertura: horaApertura, hora_cierre: horaCierre }),
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="bg-bg-primary/50 border border-border-dim p-5 rounded-xl">
      <h4 className="text-sm font-bold text-text-primary mb-4 font-display uppercase tracking-wider">Configuración masiva de horarios</h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Días de la semana</label>
          <div className="flex gap-2 flex-wrap">
            {DIAS.map((d) => (
              <button key={d.value} type="button" onClick={() => toggle(d.value)}
                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                  seleccionados.includes(d.value)
                    ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan glow-cyan'
                    : 'border-border-dim text-text-muted hover:border-border-glow/30'
                }`}>{d.label}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-4 flex-wrap items-end">
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Apertura</label>
            <input type="time" value={horaApertura} onChange={(e) => setHoraApertura(e.target.value)} className="input-dark rounded-lg px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Cierre</label>
            <input type="time" value={horaCierre} onChange={(e) => setHoraCierre(e.target.value)} className="input-dark rounded-lg px-4 py-2.5 text-sm" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving || !seleccionados.length} className="btn-success px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-50 text-bg-primary">
              {saving ? 'Guardando...' : 'Aplicar a todos'}
            </button>
            <button type="button" onClick={onCancel} className="border border-border-dim text-text-muted px-4 py-2.5 rounded-lg text-xs font-medium hover:text-text-primary transition-colors">Cancelar</button>
          </div>
        </div>
      </form>
    </div>
  );
}
