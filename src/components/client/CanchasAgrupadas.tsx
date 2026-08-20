'use client';

import { useState, useEffect } from 'react';
import { Cancha, Horario } from '@/lib/db/schema';
import SearchBar from '@/components/shared/SearchBar';

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

interface UbicacionData {
  lat: number; lng: number; descripcion: string;
  calle: string; altura: string; localidad: string; provincia: string; pais: string;
}

interface CanchaConHorarios extends Cancha {
  horarios: Horario[];
  propietario_nombre: string;
  propietario_logo?: string;
  propietario_servicios?: string[];
  fotos_parsed?: string[];
  ubicacion_parsed?: UbicacionData | null;
}

interface Props {
  onSelectCancha: (cancha: CanchaConHorarios) => void;
}

interface GrupoPorUbicacion {
  key: string;
  label: string;
  canchas: CanchaConHorarios[];
}

interface OwnerProfile {
  id: string;
  logo?: string;
  servicios?: string[];
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
  if (!u) return 'Sin ubicación';
  const parts = [u.localidad, u.provincia, u.pais].filter(Boolean);
  return parts.join(', ') || 'Sin ubicación';
}

export default function CanchasAgrupadas({ onSelectCancha }: Props) {
  const [grupos, setGrupos] = useState<GrupoPorUbicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const resCanchas = await fetch('/api/canchas');
      const allCanchas: Cancha[] = await resCanchas.json();
      const disponibles = Array.isArray(allCanchas) ? allCanchas.filter((c) => c.disponible) : [];

      const propietarioIds = [...new Set(disponibles.map(c => c.propietario_id))];
      const ownersMap = new Map<string, OwnerProfile>();
      await Promise.all(
        propietarioIds.map(async (pid) => {
          try {
            const res = await fetch(`/api/perfil/dueño?usuario_id=${pid}`);
            const d = await res.json();
            if (d.perfil) {
              let serviciosParsed: string[] = [];
              if (d.perfil.servicios) {
                try { serviciosParsed = JSON.parse(d.perfil.servicios); } catch { /* ignore */ }
              }
              ownersMap.set(pid, { id: d.perfil.id, logo: d.perfil.logo, servicios: serviciosParsed });
            }
          } catch { /* ignore */ }
        })
      );

      const canchasConHorarios = await Promise.all(
        disponibles.map(async (c) => {
          const resH = await fetch(`/api/horarios?cancha_id=${c.id}`);
          const horarios: Horario[] = await resH.json();
          const owner = ownersMap.get(c.propietario_id);
          const parsed: CanchaConHorarios = {
            ...c, horarios, propietario_nombre: '',
            propietario_logo: owner?.logo,
            propietario_servicios: owner?.servicios,
            fotos_parsed: parseFotos(c.fotos),
            ubicacion_parsed: parseUbicacion(c.ubicacion),
          };
          return parsed;
        })
      );

      setGrupos(agruparPorUbicacion(canchasConHorarios));
      setLoading(false);
    };
    fetchData();
  }, []);

  const agruparPorUbicacion = (canchas: CanchaConHorarios[]): GrupoPorUbicacion[] => {
    const mapa = new Map<string, CanchaConHorarios[]>();
    for (const cancha of canchas) {
      const key = formatearUbicacion(cancha.ubicacion_parsed ?? null);
      if (!mapa.has(key)) mapa.set(key, []);
      mapa.get(key)!.push(cancha);
    }
    return Array.from(mapa.entries()).map(([key, canchas]) => ({
      key,
      label: key,
      canchas,
    }));
  };

  const filtrar = (grupos: GrupoPorUbicacion[]): GrupoPorUbicacion[] => {
    if (!busqueda.trim()) return grupos;
    const q = busqueda.toLowerCase();
    return grupos
      .map((g) => ({
        ...g,
        canchas: g.canchas.filter(
          (c) =>
            c.nombre.toLowerCase().includes(q) ||
            c.tipo.toLowerCase().includes(q) ||
            (c.ubicacion || '').toLowerCase().includes(q) ||
            (c.fotos_parsed || []).length > 0
        ),
      }))
      .filter((g) => g.canchas.length > 0);
  };

  if (loading) return <div className="p-6 text-text-muted animate-pulse">Cargando canchas...</div>;

  const gruposFiltrados = filtrar(grupos);

  if (gruposFiltrados.length === 0) {
    return (
      <div className="p-6">
        <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar cancha, tipo o ubicación..." />
        <p className="text-text-muted mt-4 text-center">
          {busqueda ? 'No se encontraron canchas para esa búsqueda' : 'No hay canchas disponibles'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-black tracking-wide text-text-primary font-display mb-4">CANCHAS DISPONIBLES</h2>
      <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar cancha, tipo o ubicación..." />
      <div className="space-y-8 mt-6">
        {gruposFiltrados.map((grupo) => {
          const owner = grupo.canchas[0];
          const servicios = owner?.propietario_servicios || [];
          return (
          <div key={grupo.key}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-accent-gold/30" />
              <h3 className="text-sm font-bold text-accent-gold uppercase tracking-widest font-display whitespace-nowrap">{grupo.label}</h3>
              <div className="h-px flex-1 bg-accent-gold/30" />
            </div>
            {owner?.propietario_logo && (
              <div className="flex items-center gap-3 mb-4 px-2">
                <img src={owner.propietario_logo} alt="Logo" className="w-10 h-10 rounded-full object-cover border border-border-dim" />
                {servicios.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {servicios.map((s, i) => (
                      <span key={i} className="text-[10px] bg-accent-gold/10 text-accent-gold border border-accent-gold/20 rounded-full px-2 py-0.5 font-medium">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="space-y-3">
              {grupo.canchas.map((cancha) => {
                const fotos = cancha.fotos_parsed || [];
                return (
                  <button
                    key={cancha.id}
                    onClick={() => onSelectCancha(cancha)}
                    className="w-full text-left border-2 border-border-dim hover:border-accent-cyan/30 bg-bg-card rounded-xl p-5 transition-all group"
                  >
                    <div className="flex gap-4 items-start">
                      {fotos.length > 0 && (
                        <img
                          src={fotos[0]}
                          alt={cancha.nombre}
                          className="h-20 w-20 rounded-lg object-cover flex-shrink-0 border border-border-dim group-hover:border-accent-cyan/30 transition-colors"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0">
                            <h4 className="font-bold text-lg text-text-primary truncate">{cancha.nombre}</h4>
                            <p className="text-sm text-text-muted">{cancha.tipo}</p>
                            {cancha.ubicacion_parsed && (
                              <p className="text-xs text-text-muted mt-0.5">
                                {cancha.ubicacion_parsed.calle && `${cancha.ubicacion_parsed.calle} ${cancha.ubicacion_parsed.altura}`.trim()}
                                {cancha.ubicacion_parsed.calle && cancha.ubicacion_parsed.localidad ? ' · ' : ''}
                                {cancha.ubicacion_parsed.localidad}
                              </p>
                            )}
                          </div>
                          <span className="text-gradient-gold font-black text-lg flex-shrink-0 ml-3">${cancha.precio_por_hora}<span className="text-xs text-text-muted font-normal">/h</span></span>
                        </div>
                        {cancha.horarios.length > 0 && (
                          <div className="flex gap-2 mt-3 flex-wrap">
                            {cancha.horarios.map((h) => (
                              <span key={h.id} className="bg-accent-cyan/10 text-accent-cyan text-xs px-2.5 py-1 rounded-full border border-accent-cyan/20 font-medium">
                                {DIAS[h.dia_semana]} {h.hora_apertura}-{h.hora_cierre}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
