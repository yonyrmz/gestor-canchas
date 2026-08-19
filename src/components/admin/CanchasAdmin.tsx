'use client';

import { useState, useEffect } from 'react';
import { Cancha } from '@/lib/db/schema';
import SearchBar from '@/components/shared/SearchBar';
import PhotoUpload from '@/components/shared/PhotoUpload';
import LocationPicker from '@/components/shared/LocationPicker';

interface UbicacionData {
  lat: number; lng: number; descripcion: string;
  calle: string; altura: string; localidad: string; provincia: string; pais: string;
}

interface UsuarioBasico { id: number; nombre: string; rol: string; }

interface CanchaConDuenio extends Cancha {
  propietario_nombre?: string;
  fotos_parsed?: string[];
  ubicacion_parsed?: UbicacionData | null;
}

function parseFotos(fotos?: string | null): string[] {
  if (!fotos) return [];
  try { const p = JSON.parse(fotos); return Array.isArray(p) ? p : []; } catch { return fotos.split(',').map(s => s.trim()).filter(Boolean); }
}

function parseUbicacion(u?: string | null): UbicacionData | null {
  if (!u) return null;
  try { return JSON.parse(u); } catch { return { lat: 0, lng: 0, descripcion: u, calle: '', altura: '', localidad: '', provincia: '', pais: 'Argentina' }; }
}

export default function CanchasAdmin() {
  const [canchas, setCanchas] = useState<CanchaConDuenio[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioBasico[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState({ nombre: '', tipo: 'Futbol 5', precio_por_hora: '', descripcion: '', propietario_id: '' });
  const [fotos, setFotos] = useState<string[]>([]);
  const [ubicacion, setUbicacion] = useState<UbicacionData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/canchas').then((r) => r.json()),
      fetch('/api/usuarios').then((r) => r.json()),
    ]).then(([canchasData, usuariosData]) => {
      setCanchas(canchasData.map((c: CanchaConDuenio) => ({
        ...c,
        fotos_parsed: parseFotos(c.fotos),
        ubicacion_parsed: parseUbicacion(c.ubicacion),
      })));
      setUsuarios(usuariosData.filter((u: UsuarioBasico) => u.rol === 'dono' || u.rol === 'superadmin'));
      setLoading(false);
    });
  }, []);

  const getDuenioNombre = (pid: number) => usuarios.find((u) => u.id === pid)?.nombre || '-';

  const iniciarEdicion = (c: CanchaConDuenio) => {
    setEditandoId(c.id);
    setShowForm(false);
    setForm({ nombre: c.nombre, tipo: c.tipo, precio_por_hora: String(c.precio_por_hora), descripcion: c.descripcion || '', propietario_id: String(c.propietario_id) });
    setFotos(c.fotos_parsed || []);
    setUbicacion(c.ubicacion_parsed || null);
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setForm({ nombre: '', tipo: 'Futbol 5', precio_por_hora: '', descripcion: '', propietario_id: '' });
    setFotos([]);
    setUbicacion(null);
  };

  const buildPayload = () => ({
    nombre: form.nombre, tipo: form.tipo, precio_por_hora: parseFloat(form.precio_por_hora),
    descripcion: form.descripcion || undefined, propietario_id: parseInt(form.propietario_id),
    fotos: JSON.stringify(fotos), ubicacion: ubicacion ? JSON.stringify(ubicacion) : undefined,
  });

  const guardarEdicion = async () => {
    if (!editandoId) return;
    setSaving(true);
    await fetch('/api/canchas', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editandoId, ...buildPayload(), disponible: true }),
    });
    setSaving(false);
    cancelarEdicion();
    fetchCanchas();
  };

  const fetchCanchas = async () => {
    const res = await fetch('/api/canchas');
    const data = await res.json();
    setCanchas(data.map((c: CanchaConDuenio) => ({ ...c, fotos_parsed: parseFotos(c.fotos), ubicacion_parsed: parseUbicacion(c.ubicacion) })));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/canchas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildPayload()) });
    setForm({ nombre: '', tipo: 'Futbol 5', precio_por_hora: '', descripcion: '', propietario_id: '' });
    setFotos([]);
    setUbicacion(null);
    setShowForm(false);
    setSaving(false);
    fetchCanchas();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta cancha?')) return;
    await fetch(`/api/canchas?id=${id}`, { method: 'DELETE' });
    fetchCanchas();
  };

  const toggleDisponible = async (cancha: CanchaConDuenio) => {
    await fetch('/api/canchas', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cancha.id, nombre: cancha.nombre, tipo: cancha.tipo, precio_por_hora: cancha.precio_por_hora, disponible: !cancha.disponible, descripcion: cancha.descripcion, ubicacion: cancha.ubicacion, fotos: cancha.fotos }),
    });
    fetchCanchas();
  };

  const formatearUbicacion = (u?: UbicacionData | null) => {
    if (!u) return '-';
    const parts = [u.descripcion, u.calle && `${u.calle} ${u.altura}`.trim(), u.localidad, u.provincia].filter(Boolean);
    return parts.join(', ') || '-';
  };

  const filtrados = canchas.filter((c) => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return c.nombre.toLowerCase().includes(q) || c.tipo.toLowerCase().includes(q) || (c.ubicacion || '').toLowerCase().includes(q);
  });

  if (loading) return <div className="p-6 text-text-muted animate-pulse">Cargando canchas...</div>;

  const formFields = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input type="text" placeholder="Nombre de la cancha" value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="input-dark rounded-lg px-4 py-2.5 text-sm" required />
        <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="input-dark rounded-lg px-4 py-2.5 text-sm">
          <option>Futbol 5</option><option>Futbol 7</option><option>Futbol 11</option>
          <option>Basquet</option><option>Tenis</option><option>Paddle</option><option>Bocha</option><option>Otro</option>
        </select>
        <input type="number" placeholder="Precio por hora ($)" value={form.precio_por_hora}
          onChange={(e) => setForm({ ...form, precio_por_hora: e.target.value })}
          className="input-dark rounded-lg px-4 py-2.5 text-sm" min="0" step="0.01" required />
        {!editandoId && (
          <select value={form.propietario_id} onChange={(e) => setForm({ ...form, propietario_id: e.target.value })}
            className="input-dark rounded-lg px-4 py-2.5 text-sm" required>
            <option value="">Seleccionar dueño</option>
            {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
          </select>
        )}
        <input type="text" placeholder="Descripción (opcional)" value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="input-dark rounded-lg px-4 py-2.5 text-sm sm:col-span-2" />
      </div>
      <div>
        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Fotos</label>
        <PhotoUpload photos={fotos} onChange={setFotos} />
      </div>
      <div>
        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Ubicación</label>
        <LocationPicker value={ubicacion} onChange={setUbicacion} />
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black tracking-wide text-text-primary font-display">CANCHAS</h2>
          <p className="text-xs text-text-muted mt-1">{filtrados.length} registradas</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-56"><SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar canchas..." /></div>
          <button onClick={() => { setShowForm(!showForm); cancelarEdicion(); }}
            className="btn-primary text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider">
            {showForm ? 'Cancelar' : '+ Nueva'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-bg-primary/50 border border-border-dim p-5 rounded-xl mb-6">
          {formFields}
          <button type="submit" disabled={saving}
            className="btn-primary px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-50 mt-4">
            {saving ? 'Guardando...' : 'Guardar Cancha'}
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border-dim">
              <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Dueño</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Ubicación</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Precio/Hora</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((cancha) => (
              editandoId === cancha.id ? (
                <tr key={cancha.id} className="border-b border-border-dim/50 bg-accent-cyan/5">
                  <td colSpan={7} className="px-4 py-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                          className="input-dark rounded-lg px-3 py-1.5 text-sm" placeholder="Nombre" />
                        <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="input-dark rounded-lg px-3 py-1.5 text-sm">
                          <option>Futbol 5</option><option>Futbol 7</option><option>Futbol 11</option>
                          <option>Basquet</option><option>Tenis</option><option>Paddle</option><option>Bocha</option><option>Otro</option>
                        </select>
                        <input type="number" value={form.precio_por_hora} onChange={(e) => setForm({ ...form, precio_por_hora: e.target.value })}
                          className="input-dark rounded-lg px-3 py-1.5 text-sm" placeholder="Precio" min="0" step="0.01" />
                        <input type="text" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                          className="input-dark rounded-lg px-3 py-1.5 text-sm" placeholder="Descripción" />
                      </div>
                      <PhotoUpload photos={fotos} onChange={setFotos} />
                      <LocationPicker value={ubicacion} onChange={setUbicacion} />
                      <div className="flex gap-2">
                        <button onClick={guardarEdicion} disabled={saving}
                          className="btn-primary px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-50">
                          {saving ? '...' : 'Guardar'}
                        </button>
                        <button onClick={cancelarEdicion}
                          className="border border-border-dim text-text-muted px-3 py-1.5 rounded-lg text-xs font-medium hover:text-text-primary transition-colors">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={cancha.id} className="border-b border-border-dim/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-semibold text-text-primary">
                    <div className="flex items-center gap-2">
                      {cancha.fotos_parsed && cancha.fotos_parsed.length > 0 && (
                        <img src={cancha.fotos_parsed[0]} alt="" className="w-8 h-8 rounded object-cover" />
                      )}
                      {cancha.nombre}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{cancha.tipo}</td>
                  <td className="px-4 py-3 text-text-secondary">{getDuenioNombre(cancha.propietario_id)}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs max-w-[200px] truncate">{formatearUbicacion(cancha.ubicacion_parsed)}</td>
                  <td className="px-4 py-3 font-bold text-accent-gold">${cancha.precio_por_hora}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleDisponible(cancha)}
                      className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-all ${
                        cancha.disponible ? 'bg-accent-green/10 text-accent-green border border-accent-green/20' : 'bg-accent-magenta/10 text-accent-magenta border border-accent-magenta/20'
                      }`}>
                      {cancha.disponible ? 'Disponible' : 'Ocupada'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => iniciarEdicion(cancha)} className="text-accent-cyan/60 hover:text-accent-cyan text-xs font-bold uppercase tracking-wider transition-colors">Editar</button>
                      <button onClick={() => handleDelete(cancha.id)} className="text-accent-magenta/60 hover:text-accent-magenta text-xs font-bold uppercase tracking-wider transition-colors">Eliminar</button>
                    </div>
                  </td>
                </tr>
              )
            ))}
            {filtrados.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-text-muted">No se encontraron canchas</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
