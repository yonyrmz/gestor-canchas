'use client';

import { useState, useEffect, useRef } from 'react';

interface Perfil {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  logo?: string;
  servicios?: string;
}

interface Props {
  userId: string;
}

export default function DueñoPerfil({ userId }: Props) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [servicios, setServicios] = useState<string[]>([]);
  const [nuevoServicio, setNuevoServicio] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/perfil/dueño?usuario_id=${userId}`)
      .then(r => r.json())
      .then(d => {
        setPerfil(d.perfil);
        if (d.perfil?.servicios) {
          try { setServicios(JSON.parse(d.perfil.servicios)); } catch { setServicios([]); }
        }
      });
  }, [userId]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setMsg('Máximo 5MB'); return; }
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (data.url) {
        setPerfil(prev => prev ? { ...prev, logo: data.url } : prev);
        await fetch('/api/perfil/dueño', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario_id: userId, logo: data.url }),
        });
        setMsg('Logo actualizado');
      }
    } catch { setMsg('Error al subir logo'); }
    setUploading(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const addServicio = () => {
    if (!nuevoServicio.trim()) return;
    setServicios([...servicios, nuevoServicio.trim()]);
    setNuevoServicio('');
  };

  const removeServicio = (i: number) => {
    setServicios(servicios.filter((_, idx) => idx !== i));
  };

  const saveServicios = async () => {
    setSaving(true);
    await fetch('/api/perfil/dueño', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: userId, servicios: JSON.stringify(servicios) }),
    });
    setSaving(false);
    setMsg('Servicios guardados');
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-black tracking-wide text-text-primary font-display mb-6">MI PERFIL</h2>

      <div className="flex flex-col sm:flex-row gap-8 items-start">
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-28 h-28 rounded-full border-2 border-dashed border-border-dim hover:border-accent-cyan/50 flex items-center justify-center overflow-hidden transition-colors cursor-pointer group"
          >
            {perfil?.logo ? (
              <img src={perfil.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <svg className="w-8 h-8 mx-auto text-text-muted group-hover:text-accent-cyan transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 011.423-.235l.557.076c.146.035.3.063.46.082a3 3 0 004.122-4.122 3.75 3.75 0 01-.46-.082l-.557-.076a4.5 4.5 0 011.423-.235M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[10px] text-text-muted mt-1 block">{uploading ? 'Subiendo...' : 'Logo'}</span>
              </div>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          {msg && <span className="text-xs text-accent-green animate-pulse">{msg}</span>}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-muted">Nombre:</span>
            <span className="text-sm text-text-primary font-medium">{perfil?.nombre}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-muted">Email:</span>
            <span className="text-sm text-text-secondary">{perfil?.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-muted">Teléfono:</span>
            <span className="text-sm text-text-secondary">{perfil?.telefono || '—'}</span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-bold text-text-primary mb-3 uppercase tracking-wider">Servicios Disponibles</h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={nuevoServicio}
            onChange={(e) => setNuevoServicio(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addServicio()}
            placeholder="Ej: Estacionamiento, Buffet, vestuarios..."
            className="input-dark flex-1"
          />
          <button
            type="button"
            onClick={addServicio}
            className="px-4 py-2 bg-accent-cyan/20 hover:bg-accent-cyan/30 border border-accent-cyan/50 rounded-lg text-accent-cyan text-sm font-medium transition-colors cursor-pointer"
          >
            Agregar
          </button>
        </div>
        {servicios.length > 0 && (
          <div className="space-y-2">
            {servicios.map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-bg-secondary/50 border border-border-dim/50 rounded-lg px-4 py-2">
                <span className="text-sm text-text-secondary">{s}</span>
                <button
                  type="button"
                  onClick={() => removeServicio(i)}
                  className="text-text-muted hover:text-accent-magenta text-xs transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={saveServicios}
              disabled={saving}
              className="btn-primary w-full mt-2"
            >
              {saving ? 'Guardando...' : 'Guardar servicios'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
