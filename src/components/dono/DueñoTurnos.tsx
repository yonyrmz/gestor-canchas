'use client';

import { useState, useEffect, useMemo } from 'react';
import { Cancha, Turno } from '@/lib/db/schema';
import SearchBar from '@/components/shared/SearchBar';

type TurnoConDetalles = Turno & {
  usuario_nombre: string;
  usuario_email: string;
  usuario_telefono: string;
  cancha_nombre: string;
  precio_por_hora: number;
  propietario_id: string;
};

type Tab = 'activos' | 'historial';

export default function DueñoTurnos({ userId }: { userId: string }) {
  const [turnos, setTurnos] = useState<TurnoConDetalles[]>([]);
  const [canchasIds, setCanchasIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [tab, setTab] = useState<Tab>('activos');
  const [noShowForm, setNoShowForm] = useState<string | null>(null);
  const [cancelForm, setCancelForm] = useState<string | null>(null);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [multa, setMulta] = useState('');
  const [multaDesc, setMultaDesc] = useState('');

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  useEffect(() => {
    Promise.all([
      fetch(`/api/canchas?propietario_id=${userId}`).then((r) => r.json()),
      fetch('/api/turnos').then((r) => r.json()),
    ]).then(([canchasData, turnosData]: [Cancha[], TurnoConDetalles[]]) => {
      const ids = Array.isArray(canchasData) ? canchasData.map((c) => c.id) : [];
      setCanchasIds(ids);
      setTurnos(Array.isArray(turnosData) ? turnosData.filter((t) => ids.includes(t.cancha_id)) : []);
      setLoading(false);
    });
  }, [userId]);

  const refreshTurnos = () => {
    fetch('/api/turnos').then((r) => r.json()).then((data: TurnoConDetalles[]) => {
      setTurnos(Array.isArray(data) ? data.filter((t) => canchasIds.includes(t.cancha_id)) : []);
    });
  };

  const updateTurno = async (id: string, updates: Record<string, unknown>) => {
    await fetch('/api/turnos/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates, propietario_id: userId }),
    });
    refreshTurnos();
  };

  const confirmarTurno = (id: string) => updateTurno(id, { estado: 'confirmado' });
  const cancelarTurno = (id: string) => updateTurno(id, { estado: 'cancelado' });
  const cancelarConMotivo = (id: string) => {
    updateTurno(id, { estado: 'cancelado', motivo: cancelMotivo });
    setCancelForm(null);
    setCancelMotivo('');
  };

  const registrarNoShow = (id: string) => {
    updateTurno(id, {
      estado: 'no_show',
      multa: parseFloat(multa) || 0,
      multa_descripcion: multaDesc,
    });
    setNoShowForm(null);
    setMulta('');
    setMultaDesc('');
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'confirmado': return 'bg-accent-green/10 text-accent-green border border-accent-green/20';
      case 'pendiente': return 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20';
      case 'cancelado': return 'bg-accent-magenta/10 text-accent-magenta border border-accent-magenta/20';
      case 'no_show': return 'bg-accent-magenta/10 text-accent-magenta border border-accent-magenta/20';
      default: return 'bg-white/5 text-text-muted border border-border-dim';
    }
  };

  const isActivos = (t: TurnoConDetalles) => {
    return t.estado === 'pendiente' || t.estado === 'confirmado';
  };

  const isHistorial = (t: TurnoConDetalles) => {
    if (t.estado === 'cancelado' || t.estado === 'no_show') return true;
    if (t.estado === 'confirmado' && t.fecha < today) return true;
    return false;
  };

  const filtrados = useMemo(() => {
    return turnos.filter((t) => {
      const matchTab = tab === 'activos' ? isActivos(t) : isHistorial(t);
      const matchEstado = filtro === 'todos' || t.estado === filtro;
      const matchSearch = !search || t.cancha_nombre.toLowerCase().includes(search.toLowerCase()) || t.usuario_nombre.toLowerCase().includes(search.toLowerCase());
      return matchTab && matchEstado && matchSearch;
    });
  }, [turnos, filtro, search, tab, today]);

  if (loading) return <div className="p-6 text-text-muted animate-pulse">Cargando turnos...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black tracking-wide text-text-primary font-display">MIS TURNOS</h2>
          <p className="text-xs text-text-muted mt-1">{filtrados.length} turno{filtrados.length !== 1 ? 's' : ''}</p>
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
          <option value="no_show">No se presentó</option>
        </select>
      </div>

      <div className="flex gap-1 mb-4 bg-bg-secondary/50 rounded-lg p-1 max-w-sm">
        <button
          onClick={() => setTab('activos')}
          className={`flex-1 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
            tab === 'activos'
              ? 'bg-bg-card text-accent-cyan border border-accent-cyan/20 glow-cyan'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          Activos
        </button>
        <button
          onClick={() => setTab('historial')}
          className={`flex-1 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
            tab === 'historial'
              ? 'bg-bg-card text-accent-gold border border-accent-gold/20 glow-gold'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          Historial
        </button>
      </div>

      <div className="mb-4 max-w-md">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por cancha o cliente..." />
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
                {turno.estado === 'no_show' && turno.multa != null && turno.multa > 0 && (
                  <div>
                    <span className="text-text-muted text-xs">Multa: </span>
                    <span className="font-bold text-accent-magenta">${turno.multa}</span>
                    {turno.multa_descripcion && (
                      <span className="text-text-muted text-xs ml-2">({turno.multa_descripcion})</span>
                    )}
                  </div>
                )}
                {turno.estado === 'cancelado' && turno.cancelacion_motivo && (
                  <div>
                    <span className="text-text-muted text-xs">Motivo cancelación: </span>
                    <span className="text-text-secondary text-xs">{turno.cancelacion_motivo}</span>
                  </div>
                )}
                <div className="pt-1">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getEstadoBadge(turno.estado)}`}>
                    {turno.estado === 'no_show' ? 'No se presentó' : turno.estado.charAt(0).toUpperCase() + turno.estado.slice(1)}
                  </span>
                </div>
              </div>
              {tab === 'activos' && turno.estado === 'pendiente' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => confirmarTurno(turno.id)}
                    className="btn-success px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => cancelarTurno(turno.id)}
                    className="btn-danger px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white"
                  >
                    Cancelar
                  </button>
                </div>
              )}
              {tab === 'activos' && turno.estado === 'confirmado' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setCancelForm(cancelForm === turno.id ? null : turno.id)}
                    className="border border-accent-magenta/30 text-accent-magenta px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-accent-magenta/10 transition-all"
                  >
                    Cancelar turno
                  </button>
                  <button
                    onClick={() => setNoShowForm(noShowForm === turno.id ? null : turno.id)}
                    className="border border-accent-gold/30 text-accent-gold px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-accent-gold/10 transition-all"
                  >
                    No se presentó
                  </button>
                </div>
              )}
            </div>

            {noShowForm === turno.id && (
              <div className="mt-4 p-4 bg-bg-secondary/50 border border-border-dim rounded-lg space-y-3">
                <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Registrar inasistencia</div>
                <div className="flex gap-3 flex-wrap">
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Multa ($)</label>
                    <input
                      type="number"
                      value={multa}
                      onChange={(e) => setMulta(e.target.value)}
                      className="input-dark rounded-lg px-3 py-2 text-sm w-32"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs text-text-muted mb-1">Descripción</label>
                    <input
                      type="text"
                      value={multaDesc}
                      onChange={(e) => setMultaDesc(e.target.value)}
                      className="input-dark rounded-lg px-3 py-2 text-sm w-full"
                      placeholder="No se presentó sin avisar"
                    />
                  </div>
                </div>
                <button
                  onClick={() => registrarNoShow(turno.id)}
                  className="btn-danger px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-white"
                >
                  Registrar
                </button>
              </div>
            )}
            {cancelForm === turno.id && (
              <div className="mt-4 p-4 bg-bg-secondary/50 border border-accent-magenta/20 rounded-lg space-y-3">
                <div className="text-xs font-bold text-accent-magenta uppercase tracking-wider">Cancelar turno confirmado</div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Motivo (opcional)</label>
                  <input
                    type="text"
                    value={cancelMotivo}
                    onChange={(e) => setCancelMotivo(e.target.value)}
                    className="input-dark rounded-lg px-3 py-2 text-sm w-full"
                    placeholder="Ej: No puedo atender ese día..."
                  />
                </div>
                <p className="text-xs text-text-muted">El cliente recibirá una notificación con el motivo.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => cancelarConMotivo(turno.id)}
                    className="btn-danger px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-white"
                  >
                    Confirmar cancelación
                  </button>
                  <button
                    onClick={() => { setCancelForm(null); setCancelMotivo(''); }}
                    className="px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-text-muted border border-border-dim hover:border-border-glow/30 transition-all"
                  >
                    Volver
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtrados.length === 0 && (
          <div className="text-center py-12 text-text-muted">
            No hay turnos {tab === 'activos' ? 'activos' : 'en historial'}
          </div>
        )}
      </div>
    </div>
  );
}
