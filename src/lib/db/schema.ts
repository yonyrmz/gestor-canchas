export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  password: string;
  rol: 'superadmin' | 'dono' | 'cliente';
  telefono?: string;
  logo?: string;
  servicios?: string;
  created_at: string;
}

export interface Cancha {
  id: number;
  nombre: string;
  tipo: string;
  precio_por_hora: number;
  disponible: boolean;
  descripcion?: string;
  fotos?: string;
  ubicacion?: string;
  propietario_id: number;
  created_at: string;
}

export interface Turno {
  id: number;
  usuario_id: number;
  cancha_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  tarifa: number;
  sena_pagada: boolean;
  estado: 'pendiente' | 'confirmado' | 'cancelado' | 'no_show';
  multa?: number;
  multa_descripcion?: string;
  cancelacion_motivo?: string;
  created_at: string;
}

export interface Notificacion {
  id: number;
  usuario_id: number;
  turno_id: number;
  titulo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
}

export interface Horario {
  id: number;
  cancha_id: number;
  dia_semana: number;
  hora_apertura: string;
  hora_cierre: string;
  activo: boolean;
}

export interface Configuracion {
  id: number;
  clave: string;
  valor: string;
}
