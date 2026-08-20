'use client';

import { useState, useEffect } from 'react';

export default function ConfigAdmin() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((data) => { setConfig(data); setLoading(false); });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className="p-6 text-text-muted animate-pulse">Cargando...</div>;

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl font-black tracking-wide text-text-primary font-display mb-2">CONFIGURACIÓN</h2>
      <p className="text-xs text-text-muted mb-6">
        Datos de transferencia y reglas de cancelación.
      </p>
      <form onSubmit={handleSave} className="space-y-5 max-w-lg">
        <div>
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Alias</label>
          <input
            type="text"
            value={config.alias || ''}
            onChange={(e) => setConfig({ ...config, alias: e.target.value })}
            className="w-full input-dark rounded-lg px-4 py-3 text-sm font-mono"
            placeholder="ej: gestor.canchas.mp"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">CBU</label>
          <input
            type="text"
            value={config.cbu || ''}
            onChange={(e) => setConfig({ ...config, cbu: e.target.value })}
            className="w-full input-dark rounded-lg px-4 py-3 text-sm font-mono"
            placeholder="22 dígitos"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Titular de la cuenta</label>
          <input
            type="text"
            value={config.titular || ''}
            onChange={(e) => setConfig({ ...config, titular: e.target.value })}
            className="w-full input-dark rounded-lg px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Porcentaje de seña (%)</label>
          <input
            type="number"
            value={config.sena_porcentaje || '50'}
            onChange={(e) => setConfig({ ...config, sena_porcentaje: e.target.value })}
            className="w-full input-dark rounded-lg px-4 py-3 text-sm"
            min="1"
            max="100"
          />
        </div>

        <div className="border-t border-border-dim pt-5 mt-5">
          <h3 className="text-sm font-black tracking-wide text-accent-cyan font-display mb-1">CANCELACIÓN</h3>
          <p className="text-xs text-text-muted mb-4">
            Horas mínimas de anticipación para que un cliente pueda cancelar sin penalización.
          </p>
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Horas mínimas para cancelar</label>
            <input
              type="number"
              value={config.cancelacion_horas || '1'}
              onChange={(e) => setConfig({ ...config, cancelacion_horas: e.target.value })}
              className="w-full input-dark rounded-lg px-4 py-3 text-sm"
              min="1"
              max="72"
              placeholder="1"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn-gold px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          {saved && (
            <span className="text-accent-green text-sm font-bold animate-pulse">Guardado correctamente</span>
          )}
        </div>
      </form>
    </div>
  );
}
