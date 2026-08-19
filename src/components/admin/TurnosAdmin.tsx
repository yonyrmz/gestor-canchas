'use client';

import { useState, useEffect } from 'react';
import { Turno } from '@/lib/db/schema';
import SearchBar from '@/components/shared/SearchBar';

type TurnoConDetalles = Turno & {
  usuario_nombre: string;
  usuario_email: string;
  usuario_telefono: string;
  cancha_nombre: string;
  precio_por_hora: number;
};

export default function TurnosAdmin() {
  const [turnos, setTurnos] = useState<TurnoConDetalles[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => { fetchTurnos(); }, []);

  const fetchTurnos = async () => {
    const res = await fetch('/api/turnos');
    const data = await res.json();
    setTurnos(data);
    setLoading(false);
  };

  const updateTurno = async (id: string, updates: Record<string, unknown>) => {
    await fetch('/api/turnos/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    fetchTurnos();
  };

  const confirmarTurno = (id: string) => updateTurno(id, { estado: 'confirmado' });
  const rechazarTurno = (id: string) => updateTurno(id, { estado: 'cancelado' });

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'confirmado': return 'bg-accent-green/10 text-accent-green border border-accent-green/20';
      case 'pendiente': return 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20';
      case 'cancelado': return 'bg-accent-magenta/10 text-accent-magenta border border-accent-magenta/20';
      default: return 'bg-white/5 text-text-muted border border-border-dim';
    }
  };

  const filtrados = turnos.filter((t) => {
    if (filtro !== 'todos' && t.estado !== filtro) return false;
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return t.cancha_nombre.toLowerCase().includes(q) || t.usuario_nombre.toLowerCase().includes(q) || t.usuario_email.toLowerCase().includes(q) || t.fecha.includes(q);
  });

  if (loading) return <div className="p-6 text-text-muted animate-pulse">Cargando turnos...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black tracking-wide text-text-primary font-display">TURNOS</h2>
          <p className="text-xs text-text-muted mt-1">{filtrados.length} {filtro === 'todos' ? 'en total' : filtro + 's'}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-56">
            <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar turnos..." />
          </div>
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="input-dark rounded-lg px-3 py-2 text-xs font-medium"
          >
            <option value="todos">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="confirmado">Confirmados</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filtrados.map((turno) => (
          <div key={turno.id} className="bg-bg-primary/50 border border-border-dim rounded-xl p-5 hover:border-border-glow/30 transition-all">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div className="space-y-1.5 text-sm flex-1">
                <div className="font-bold text-base text-text-primary">{turno.cancha_nombre}</div>
                <div className="text-text-secondary">
                  <span className="text-text-muted">Cliente:</span> {turno.usuario_nombre}
                  <span className="text-text-muted mx-1">·</span>
                  <span className="text-text-muted text-xs">{turno.usuario_email}</span>
                </div>
                {turno.usuario_telefono && (
                  <div className="text-text-secondary text-xs">
                    <span className="text-text-muted">Tel:</span> {turno.usuario_telefono}
                  </div>
                )}
                <div className="text-text-secondary">
                  <span className="text-text-muted">Fecha:</span> {turno.fecha}
                  <span className="text-text-muted mx-2">|</span>
                  <span className="text-accent-cyan font-mono font-bold">{turno.hora_inicio} - {turno.hora_fin}</span>
                </div>
                <div>
                  <span className="text-text-muted text-xs">Tarifa: </span>
                  <span className="font-bold text-accent-gold">${turno.tarifa}</span>
                </div>
                <div className="pt-1">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getEstadoBadge(turno.estado)}`}>
                    {turno.estado.charAt(0).toUpperCase() + turno.estado.slice(1)}
                  </span>
                </div>
              </div>
              {turno.estado === 'pendiente' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => confirmarTurno(turno.id)}
                    className="btn-success px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => rechazarTurno(turno.id)}
                    className="btn-danger px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white"
                  >
                    Rechazar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {filtrados.length === 0 && (
          <div className="text-center py-12 text-text-muted">
            No hay turnos {filtro !== 'todos' ? `con estado "${filtro}"` : 'registrados'}
          </div>
        )}
      </div>
    </div>
  );
}
