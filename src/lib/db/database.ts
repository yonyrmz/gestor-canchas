import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', '..', '..', 'gestor-canchas.db');

let db: Awaited<ReturnType<typeof open>> | null = null;

export async function getDatabase() {
  if (db) return db;
  db = await open({ filename: DB_PATH, driver: sqlite3.Database });
  await db.exec('PRAGMA foreign_keys = ON');
  await initializeDatabase(db);
  return db;
}

async function initializeDatabase(database: Awaited<ReturnType<typeof open>>) {
  await database.exec(`
    CREATE TABLE IF NOT EXISTS Usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      rol TEXT CHECK(rol IN ('superadmin','dono','cliente')) NOT NULL DEFAULT 'cliente',
      telefono TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS Canchas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      tipo TEXT NOT NULL,
      precio_por_hora REAL NOT NULL,
      disponible BOOLEAN DEFAULT 1,
      descripcion TEXT,
      fotos TEXT,
      ubicacion TEXT,
      propietario_id INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (propietario_id) REFERENCES Usuarios(id)
    );
    CREATE TABLE IF NOT EXISTS Turnos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      cancha_id INTEGER NOT NULL,
      fecha TEXT NOT NULL,
      hora_inicio TEXT NOT NULL,
      hora_fin TEXT NOT NULL,
      tarifa REAL NOT NULL,
      sena_pagada BOOLEAN DEFAULT 0,
      estado TEXT CHECK(estado IN ('pendiente','confirmado','cancelado')) NOT NULL DEFAULT 'pendiente',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES Usuarios(id),
      FOREIGN KEY (cancha_id) REFERENCES Canchas(id)
    );
    CREATE TABLE IF NOT EXISTS Horarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cancha_id INTEGER NOT NULL,
      dia_semana INTEGER NOT NULL CHECK(dia_semana BETWEEN 0 AND 6),
      hora_apertura TEXT NOT NULL DEFAULT '08:00',
      hora_cierre TEXT NOT NULL DEFAULT '22:00',
      activo BOOLEAN DEFAULT 1,
      FOREIGN KEY (cancha_id) REFERENCES Canchas(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS Configuracion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clave TEXT UNIQUE NOT NULL,
      valor TEXT NOT NULL
    );
  `);

  const cfg = await database.get('SELECT COUNT(*) as count FROM Configuracion');
  if (cfg.count === 0) {
    await database.run("INSERT INTO Configuracion (clave, valor) VALUES ('alias','gestor.canchas.mp')");
    await database.run("INSERT INTO Configuracion (clave, valor) VALUES ('cbu','0000000000000000000000')");
    await database.run("INSERT INTO Configuracion (clave, valor) VALUES ('titular','Gestor de Canchas S.R.L.')");
    await database.run("INSERT INTO Configuracion (clave, valor) VALUES ('sena_porcentaje','50')");
  }

  try { await database.exec("ALTER TABLE Canchas ADD COLUMN propietario_id INTEGER NOT NULL DEFAULT 1"); } catch {}
  try { await database.exec("ALTER TABLE Canchas ADD COLUMN fotos TEXT"); } catch {}
  try { await database.exec("ALTER TABLE Canchas ADD COLUMN ubicacion TEXT"); } catch {}
  try { await database.exec("ALTER TABLE Turnos ADD COLUMN multa REAL DEFAULT 0"); } catch {}
  try { await database.exec("ALTER TABLE Turnos ADD COLUMN multa_descripcion TEXT"); } catch {}
  try { await database.exec("ALTER TABLE Turnos ADD COLUMN cancelacion_motivo TEXT"); } catch {}
  try { await database.exec("ALTER TABLE Usuarios ADD COLUMN logo TEXT"); } catch {}
  try { await database.exec("ALTER TABLE Usuarios ADD COLUMN servicios TEXT"); } catch {}

  await database.exec(`
    CREATE TABLE IF NOT EXISTS Notificaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      turno_id INTEGER,
      titulo TEXT NOT NULL,
      mensaje TEXT NOT NULL,
      leida BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES Usuarios(id)
    );
  `);

  const hasCancelHoras = await database.get("SELECT COUNT(*) as c FROM Configuracion WHERE clave = 'cancelacion_horas'");
  if (hasCancelHoras.c === 0) {
    await database.run("INSERT INTO Configuracion (clave, valor) VALUES ('cancelacion_horas','1')");
  }
}
