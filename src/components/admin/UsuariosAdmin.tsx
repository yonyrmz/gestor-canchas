'use client';

import { useState, useEffect } from 'react';
import { Usuario } from '@/lib/db/schema';
import SearchBar from '@/components/shared/SearchBar';

type UsuarioEditando = Partial<Pick<Usuario, 'nombre' | 'email' | 'rol' | 'telefono'>>;

interface CredencialGenerada {
  nombre: string;
  email: string;
  password: string;
  rol: string;
}

export default function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<UsuarioEditando>({});
  const [saving, setSaving] = useState(false);

  const [showGenerator, setShowGenerator] = useState(false);
  const [genRol, setGenRol] = useState<'cliente' | 'dono'>('cliente');
  const [genCantidad, setGenCantidad] = useState(5);
  const [genPrefijo, setGenPrefijo] = useState('');
  const [genCredenciales, setGenCredenciales] = useState<CredencialGenerada[]>([]);
  const [generando, setGenerando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => { fetchUsuarios(); }, []);

  const fetchUsuarios = async () => {
    const res = await fetch('/api/usuarios');
    const data = await res.json();
    setUsuarios(data);
    setLoading(false);
  };

  const iniciarEdicion = (u: Usuario) => {
    setEditandoId(u.id);
    setForm({ nombre: u.nombre, email: u.email, rol: u.rol, telefono: u.telefono || '' });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setForm({});
  };

  const guardarEdicion = async () => {
    if (!editandoId) return;
    setSaving(true);
    await fetch('/api/usuarios', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editandoId, ...form }),
    });
    setSaving(false);
    cancelarEdicion();
    fetchUsuarios();
  };

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    await fetch(`/api/usuarios?id=${id}`, { method: 'DELETE' });
    fetchUsuarios();
  };

  const getRolBadge = (rol: string) => {
    switch (rol) {
      case 'superadmin': return 'bg-accent-purple/10 text-accent-purple border border-accent-purple/20';
      case 'dono': return 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20';
      case 'cliente': return 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20';
      default: return 'bg-white/5 text-text-muted border border-border-dim';
    }
  };

  const generarUsuarios = async () => {
    setGenerando(true);
    setGenCredenciales([]);
    const credenciales: CredencialGenerada[] = [];
    const prefijo = genPrefijo.trim() || genRol;

    for (let i = 1; i <= genCantidad; i++) {
      const num = String(i).padStart(3, '0');
      const nombre = `${prefijo.charAt(0).toUpperCase() + prefijo.slice(1)} ${num}`;
      const email = `${prefijo.toLowerCase()}${num}@gestor.com`;
      const password = `pass${num}`;

      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password, rol: genRol }),
      });

      if (res.ok) {
        credenciales.push({ nombre, email, password, rol: genRol });
      }
    }

    setGenCredenciales(credenciales);
    setGenerando(false);
    fetchUsuarios();
  };

  const copiarCredenciales = () => {
    const texto = genCredenciales.map(c => `${c.email}\t${c.password}\t${c.rol}`).join('\n');
    navigator.clipboard.writeText(`Email\tContraseña\tRol\n${texto}`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const filtrados = usuarios.filter((u) => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.rol.toLowerCase().includes(q) || (u.telefono && u.telefono.toLowerCase().includes(q));
  });

  if (loading) return <div className="p-6 text-text-muted animate-pulse">Cargando usuarios...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black tracking-wide text-text-primary font-display">USUARIOS</h2>
          <p className="text-xs text-text-muted mt-1">{filtrados.length} {filtrados.length === 1 ? 'registrado' : 'registrados'}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-56"><SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar usuarios..." /></div>
          <button onClick={() => { setShowGenerator(!showGenerator); setGenCredenciales([]); }}
            className="btn-gold px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider">
            {showGenerator ? 'Cancelar' : '⚡ Generar'}
          </button>
        </div>
      </div>

      {showGenerator && (
        <div className="bg-bg-primary/50 border border-border-dim p-5 rounded-xl mb-6 space-y-4">
          <h3 className="text-sm font-bold text-accent-gold uppercase tracking-wider font-display">Generador masivo de usuarios</h3>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Rol</label>
              <select value={genRol} onChange={(e) => setGenRol(e.target.value as 'cliente' | 'dono')}
                className="input-dark rounded-lg px-4 py-2.5 text-sm">
                <option value="cliente">Cliente</option>
                <option value="dono">Dueño</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Cantidad</label>
              <input type="number" value={genCantidad} onChange={(e) => setGenCantidad(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                className="input-dark rounded-lg px-4 py-2.5 text-sm w-20" min="1" max="50" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Prefijo (opcional)</label>
              <input type="text" value={genPrefijo} onChange={(e) => setGenPrefijo(e.target.value)}
                placeholder={genRol} className="input-dark rounded-lg px-4 py-2.5 text-sm w-40" />
            </div>
            <button onClick={generarUsuarios} disabled={generando}
              className="btn-gold px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-50">
              {generando ? 'Generando...' : `Crear ${genCantidad} usuarios`}
            </button>
          </div>
          <p className="text-xs text-text-muted">
            Se crearán con el formato: <span className="text-accent-cyan font-mono">{genPrefijo || genRol}001@gestor.com</span> / <span className="text-accent-cyan font-mono">pass001</span>
          </p>

          {genCredenciales.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-accent-green uppercase tracking-wider font-display">
                  {genCredenciales.length} usuarios creados
                </h4>
                <button onClick={copiarCredenciales}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    copiado ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-cyan/15 text-accent-cyan hover:bg-accent-cyan/25 border border-accent-cyan/30'
                  }`}>
                  {copiado ? '✓ Copiado' : 'Copiar todo'}
                </button>
              </div>
              <div className="bg-bg-card border border-border-dim rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <table className="min-w-full text-xs">
                  <thead className="sticky top-0 bg-bg-card">
                    <tr className="border-b border-border-dim">
                      <th className="px-3 py-2 text-left font-bold text-text-muted uppercase">Nombre</th>
                      <th className="px-3 py-2 text-left font-bold text-text-muted uppercase">Email</th>
                      <th className="px-3 py-2 text-left font-bold text-text-muted uppercase">Contraseña</th>
                    </tr>
                  </thead>
                  <tbody>
                    {genCredenciales.map((c, i) => (
                      <tr key={i} className="border-b border-border-dim/30 hover:bg-white/[0.02]">
                        <td className="px-3 py-2 text-text-primary font-medium">{c.nombre}</td>
                        <td className="px-3 py-2 text-accent-cyan font-mono">{c.email}</td>
                        <td className="px-3 py-2 text-accent-gold font-mono font-bold">{c.password}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border-dim">
              <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Rol</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Teléfono</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((u) => (
              editandoId === u.id ? (
                <tr key={u.id} className="border-b border-border-dim/50 bg-accent-cyan/5">
                  <td className="px-4 py-3">
                    <input type="text" value={form.nombre || ''} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      className="input-dark rounded-lg px-3 py-1.5 text-sm w-full" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="input-dark rounded-lg px-3 py-1.5 text-sm w-full" />
                  </td>
                  <td className="px-4 py-3">
                    <select value={form.rol || 'cliente'} onChange={(e) => setForm({ ...form, rol: e.target.value as Usuario['rol'] })}
                      className="input-dark rounded-lg px-3 py-1.5 text-sm">
                      <option value="superadmin">Super Admin</option>
                      <option value="dono">Dueño</option>
                      <option value="cliente">Cliente</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input type="text" value={form.telefono || ''} onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                      className="input-dark rounded-lg px-3 py-1.5 text-sm w-full" placeholder="Opcional" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={guardarEdicion} disabled={saving}
                        className="btn-success px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-50">
                        {saving ? '...' : 'Guardar'}
                      </button>
                      <button onClick={cancelarEdicion}
                        className="border border-border-dim text-text-muted px-3 py-1.5 rounded-lg text-xs font-medium hover:text-text-primary transition-colors">
                        Cancelar
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={u.id} className="border-b border-border-dim/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-semibold text-text-primary">{u.nombre}</td>
                  <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getRolBadge(u.rol)}`}>
                      {u.rol === 'superadmin' ? 'Super Admin' : u.rol === 'dono' ? 'Dueño' : 'Cliente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{u.telefono || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => iniciarEdicion(u)}
                        className="text-accent-cyan/60 hover:text-accent-cyan text-xs font-bold uppercase tracking-wider transition-colors">
                        Editar
                      </button>
                      <button onClick={() => eliminar(u.id)}
                        className="text-accent-magenta/60 hover:text-accent-magenta text-xs font-bold uppercase tracking-wider transition-colors">
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              )
            ))}
            {filtrados.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-text-muted">No se encontraron usuarios</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
