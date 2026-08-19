export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  telefono?: string | null;
  logo?: string | null;
  servicios?: string | null;
  createdAt?: string;
}

export interface Cancha {
  id: string;
  nombre: string;
  tipo: string;
  precio_por_hora: number;
  descripcion?: string | null;
  disponible: boolean;
  fotos?: string | null;
  ubicacion?: string | null;
  propietario_id: string;
}

export interface Turno {
  id: string;
  usuario_id: string;
  cancha_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  tarifa: number;
  sena_pagada: boolean;
  estado: string;
  multa?: number;
  multa_descripcion?: string | null;
  cancelacion_motivo?: string | null;
}

export interface Horario {
  id: string;
  cancha_id: string;
  dia_semana: number;
  hora_apertura: string;
  hora_cierre: string;
  activo: boolean;
}

export interface Notificacion {
  id: string;
  usuario_id: string;
  turno_id?: string | null;
  titulo: string;
  mensaje: string;
  leida: boolean;
  createdAt?: string;
}

export interface Configuracion {
  id: string;
  clave: string;
  valor: string;
}
