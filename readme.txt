================================================================================
                    GESTOR DE CANCHAS - INFORME COMPLETO
================================================================================

Sistema de gestión de canchas deportivas con reserva online, multi-rol y panel
de administración. Inspirado en el Mundial 2026.

================================================================================
1. STACK TECNOLÓGICO
================================================================================

Frontend:
  - Next.js 16.3.1 (App Router, Turbopack)
  - React 19
  - TypeScript
  - Tailwind CSS 4
  - Leaflet + OpenStreetMap (mapas)
  - @types/leaflet

Backend:
  - API Routes de Next.js (App Router)
  - SQLite (sqlite + sqlite3)
  - bcryptjs (hash de contraseñas)

Autenticación:
  - Sesiones via cookie httpOnly
  - JSON {userId, rol} en cookie
  - Sin JWT

================================================================================
2. ROLES Y JERARQUÍA
================================================================================

  superadmin ( nivel 3 )
       │
       ├── Crea, edita y elimina: usuarios, canchas, horarios, turnos
       ├── Configura: alias, CBU, titular, % seña, horas mín. cancelación
       ├── Genera usuarios dueños en bulk (generador masivo)
       ├── Acceso a /admin
       └── Credenciales: admin@gestor.com / admin123

  dono ( nivel 2 )
       │
       ├── Gestiona sus propias canchas (CRUD con fotos y ubicación)
       ├── Gestiona horarios de sus canchas (con toggle activo)
       ├── Confirma o cancela turnos de sus canchas (con motivo)
       ├── Registra no-show con multa configurable
       ├── Edifica perfil: logo + servicios disponibles
       ├── Ve historial de turnos y cancelaciones
       └── Acceso a /dono

  cliente ( nivel 1 )
       │
       ├── Visualiza canchas agrupadas por ubicación
       ├── Reserva turnos con calendario personalizado
       ├── Ve confirmación de turnos
       ├── Notificaciones en tiempo real (campanita)
       ├── Historial de reservas con countdown para cancelar
       ├── Cancela turnos dentro del plazo configurado
       └── Acceso a /reservar

================================================================================
3. BASE DE DATOS (SQLite)
================================================================================

TABLA: Usuarios
  - id             INTEGER PRIMARY KEY AUTOINCREMENT
  - nombre         TEXT NOT NULL
  - email          TEXT UNIQUE NOT NULL
  - password       TEXT NOT NULL (bcrypt)
  - rol            TEXT CHECK('superadmin','dono','cliente')
  - telefono       TEXT
  - logo           TEXT (ruta de imagen subida)
  - servicios      TEXT (JSON array de strings)
  - created_at     DATETIME DEFAULT CURRENT_TIMESTAMP

TABLA: Canchas
  - id               INTEGER PRIMARY KEY AUTOINCREMENT
  - nombre           TEXT NOT NULL
  - tipo             TEXT NOT NULL
  - precio_por_hora  REAL NOT NULL
  - disponible       BOOLEAN DEFAULT 1
  - descripcion      TEXT
  - fotos            TEXT (JSON array de rutas, max 5)
  - ubicacion        TEXT (JSON: lat, lng, descripcion, calle, altura,
                           localidad, provincia, pais)
  - propietario_id   INTEGER NOT NULL (FK → Usuarios)
  - created_at       DATETIME DEFAULT CURRENT_TIMESTAMP

TABLA: Turnos
  - id                  INTEGER PRIMARY KEY AUTOINCREMENT
  - usuario_id          INTEGER NOT NULL (FK → Usuarios)
  - cancha_id           INTEGER NOT NULL (FK → Canchas)
  - fecha               TEXT NOT NULL
  - hora_inicio         TEXT NOT NULL
  - hora_fin            TEXT NOT NULL
  - tarifa              REAL NOT NULL
  - sena_pagada         BOOLEAN DEFAULT 0
  - estado              TEXT CHECK('pendiente','confirmado','cancelado','no_show')
  - multa               REAL DEFAULT 0
  - multa_descripcion   TEXT
  - cancelacion_motivo  TEXT
  - created_at          DATETIME DEFAULT CURRENT_TIMESTAMP

TABLA: Horarios
  - id             INTEGER PRIMARY KEY AUTOINCREMENT
  - cancha_id      INTEGER NOT NULL (FK → Canchas ON DELETE CASCADE)
  - dia_semana     INTEGER CHECK(0-6)
  - hora_apertura  TEXT DEFAULT '08:00'
  - hora_cierre    TEXT DEFAULT '22:00'
  - activo         BOOLEAN DEFAULT 1

TABLA: Notificaciones
  - id             INTEGER PRIMARY KEY AUTOINCREMENT
  - usuario_id     INTEGER NOT NULL (FK → Usuarios)
  - turno_id       INTEGER
  - titulo         TEXT NOT NULL
  - mensaje        TEXT NOT NULL
  - leida          BOOLEAN DEFAULT 0
  - created_at     DATETIME DEFAULT CURRENT_TIMESTAMP

TABLA: Configuracion
  - id      INTEGER PRIMARY KEY AUTOINCREMENT
  - clave   TEXT UNIQUE NOT NULL
  - valor   TEXT NOT NULL

  Valores por defecto:
    alias              = gestor.canchas.mp
    cbu                = 0000000000000000000000
    titular            = Gestor de Canchas S.R.L.
    sena_porcentaje    = 50
    cancelacion_horas  = 1

================================================================================
4. ENDPOINTS API
================================================================================

--- Autenticación ---
  POST /api/auth/login       { email, password }       → { user }
  POST /api/auth/register    { nombre, email, password } → { user } (solo cliente)
  POST /api/auth/logout                                    → cookie cleared
  GET  /api/auth/me                                        → { user }

--- Usuarios ---
  GET    /api/usuarios?q=texto                              → [{ id, nombre, email, rol, telefono, logo, servicios }]
  POST   /api/usuarios { nombre, email, password, rol, telefono }
  PUT    /api/usuarios { id, nombre, email, rol, telefono }
  DELETE /api/usuarios?id=X                                 (borra en cascada)

--- Canchas ---
  GET    /api/canchas?propietario_id=X                      → [{ id, nombre, tipo, ... }]
  POST   /api/canchas { nombre, tipo, precio_por_hora, propietario_id, fotos, ubicacion, ... }
  PUT    /api/canchas { id, ... }
  DELETE /api/canchas?id=X

--- Turnos ---
  GET    /api/turnos?usuario_id=X                           → [{ id, fecha, hora_inicio, ..., usuario_nombre, cancha_nombre }]
  POST   /api/turnos { usuario_id, cancha_id, fecha, hora_inicio, hora_fin, tarifa }
  PUT    /api/turnos/update { id, estado, propietario_id, multa, motivo, ... }

--- Horarios ---
  GET    /api/horarios?cancha_id=X                          → [{ id, dia_semana, hora_apertura, hora_cierre, activo }]
  POST   /api/horarios { horarios: [{ cancha_id, dia_semana, hora_apertura, hora_cierre }] }
  PUT    /api/horarios { id, activo }
  DELETE /api/horarios?id=X

--- Notificaciones ---
  GET  /api/notificaciones?usuario_id=X                     → { notificaciones, noLeidas }
  PUT  /api/notificaciones { id }                            (marcar una leída)
  PUT  /api/notificaciones { usuario_id, marcarTodas: true } (marcar todas leídas)

--- Perfil Dueño ---
  GET  /api/perfil/dueño?usuario_id=X                       → { perfil }
  PUT  /api/perfil/dueño { usuario_id, logo }               (subir logo)
  PUT  /api/perfil/dueño { usuario_id, servicios }          (JSON array)

--- Upload ---
  POST /api/upload  FormData { file: imagen }                → { url: '/uploads/archivo.jpg' }

--- Configuración ---
  GET  /api/config                                          → { alias, cbu, titular, ... }
  PUT  /api/config { alias, cbu, titular, cancelacion_horas }

================================================================================
5. COMPONENTES
================================================================================

--- Shared (reutilizables) ---
  - DatePicker        → Calendario custom con tema oscuro
  - SearchBar         → Barra de búsqueda reutilizable
  - BulkSchedule      → Creación masiva de horarios
  - PhotoUpload       → Upload de fotos con preview (max 5, 5MB cada una)
  - LocationPicker    → Mapa Leaflet + Nominatim geocoding + pin arrastrable
                        Toggle satélite/oscuro (ESRI WorldImagery + CartoDB dark)
                        Geolocalización del navegador

--- Admin (/admin) ---
  - UsuariosAdmin     → CRUD usuarios, buscador, filtro por rol,
                        generador bulk de dueños (prefijo + cantidad,
                        credenciales generadas + copiar al clipboard)
  - CanchasAdmin      → CRUD canchas con PhotoUpload + LocationPicker,
                        mostrar fotos thumbnails + ubicación formateada
  - HorariosAdmin     → CRUD horarios por cancha con toggle activo
  - TurnosAdmin       → Lista turnos con filtros, búsqueda, paginación
  - ConfigAdmin       → Editar alias, CBU, titular, % seña, horas cancelación

--- Dueño (/dono) ---
  - DueñoPerfil       → Logo circular con upload + lista de servicios editables
  - DueñoCanchas      → CRUD canchas del dueño con fotos y ubicación
  - DueñoHorarios     → Horarios de sus canchas con toggle activo
  - DueñoTurnos       → Tabs: Activos / Historial
                        Pendientes: Confirmar / Cancelar
                        Confirmados: Cancelar (con motivo) / No se presentó (con multa)
                        Historial: turnos cancelados + no_show con multa

--- Cliente (/reservar) ---
  - CanchasAgrupadas  → Canchas disponibles agrupadas por ubicación,
                        con logo del dueño + badges de servicios
  - FormularioReserva → DatePicker + slots con medianoche + política cancelación
  - ClienteHistorial  → Turnos agrupados por estado,
                        countdown para cancelar (timer en tiempo real),
                        motivo de cancelación visible
  - ReservarPage      → Header con campanita notificaciones (badge rojo),
                        dropdown notificaciones, botón "Mis Reservas",
                        turnos confirmados destacados (glow verde)

--- Turno Detail (/reservar/turno) ---
  - TurnoContent      → Detalle del turno con estado,
                        pendiente: "Pendiente de confirmación"
                        confirmado: "Reserva confirmada, ¡nos vemos!"

================================================================================
6. FLUJOS PRINCIPALES
================================================================================

--- Reserva de cliente ---
  1. Cliente selecciona cancha (agrupada por ubicación)
  2. Elige fecha (DatePicker) y horario (slots disponibles)
  3. Crea reserva → estado = 'pendiente'
  4. Dueño recibe turno y lo confirma o cancela
  5. Si confirma → cliente recibe notificación
  6. Si cancela → cliente recibe notificación con motivo

--- Cancelación por dueño ---
  1. Dueño ve turno confirmado
  2. Click "Cancelar turno" → formulario inline con motivo
  3. Confirma → turno pasa a 'cancelado'
  4. Se guarda motivo en cancelacion_motivo del turno
  5. Se crea notificación para el cliente con el motivo
  6. Cliente ve motivo en historial

--- No-show por dueño ---
  1. Dueño ve turno confirmado, cliente no se presentó
  2. Click "No se presentó" → formulario con multa ($) y descripción
  3. Registra → turno pasa a 'no_show'
  4. Se guarda multa y multa_descripcion
  5. Cliente recibe notificación con monto de multa

--- Cancelación por cliente ---
  1. Cliente ve turno en "Mis Reservas"
  2. Timer muestra tiempo restante (cancelacion_horas antes del turno)
  3. Mientras haya tiempo → botón "Cancelar" visible
  4. Click cancelar → turno pasa a 'cancelado'
  5. Timer llega a 0 → botón desaparece

--- Eliminación de usuario (cascade) ---
  1. Admin elimina usuario
  2. Se borran: notificaciones → turnos → canchas (con horarios) → usuario

================================================================================
7. DISEÑO VISUAL
================================================================================

Tema: Mundial 2026 - Dark Mode Premium
  - Fondo principal: bg-primary (#0a0e1a)
  - Fondo secundario: bg-secondary (#111827)
  - Fondo cards: bg-card (#161e2e)
  - Bordes: border-dim (#1e293b), border-glow (#334155)

Colores de acento:
  - Cyan (#00d4ff)    → Acciones principales, turnos pendientes
  - Gold (#ffd700)    → Precios, badges dorados, servicios
  - Green (#00ff87)   → Confirmados, estados exitosos
  - Magenta (#ff2d78) → Cancelados, multas, danger

Fuentes:
  - Orbitron (font-display) → Títulos, headers
  - Inter → Texto general

Efectos:
  - glow-cyan, glow-gold, glow-green → Sombras de color
  - card-glass → Glass morphism (backdrop-blur)
  - noise-bg → Textura de ruido sutil
  - text-gradient-cyan, text-gradient-gold → Degradados en texto

================================================================================
8. ARCHIVOS PRINCIPALES
================================================================================

src/
├── app/
│   ├── page.tsx                    Landing page
│   ├── login/page.tsx              Login
│   ├── registro/page.tsx           Registro (solo cliente)
│   ├── admin/page.tsx              Panel administrador
│   ├── dono/page.tsx               Panel dueño
│   ├── reservar/
│   │   ├── page.tsx                Reservas + notificaciones
│   │   └── turno/TurnoContent.tsx  Detalle de turno
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── register/route.ts
│       │   ├── logout/route.ts
│       │   └── me/route.ts
│       ├── usuarios/route.ts       CRUD usuarios
│       ├── canchas/route.ts        CRUD canchas
│       ├── turnos/route.ts         CRUD turnos
│       ├── turnos/update/route.ts  Actualizar turno
│       ├── horarios/route.ts       CRUD horarios
│       ├── notificaciones/route.ts CRUD notificaciones
│       ├── perfil/dueño/route.ts   Perfil dueño
│       ├── config/route.ts         Configuración
│       └── upload/route.ts         Upload de archivos
├── components/
│   ├── AuthProvider.tsx            Context de autenticación
│   ├── shared/
│   │   ├── DatePicker.tsx
│   │   ├── SearchBar.tsx
│   │   ├── BulkSchedule.tsx
│   │   ├── PhotoUpload.tsx
│   │   └── LocationPicker.tsx
│   ├── admin/
│   │   ├── UsuariosAdmin.tsx
│   │   ├── CanchasAdmin.tsx
│   │   ├── HorariosAdmin.tsx
│   │   ├── TurnosAdmin.tsx
│   │   └── ConfigAdmin.tsx
│   ├── dono/
│   │   ├── DueñoPerfil.tsx
│   │   ├── DueñoCanchas.tsx
│   │   ├── DueñoHorarios.tsx
│   │   └── DueñoTurnos.tsx
│   └── client/
│       ├── CanchasAgrupadas.tsx
│       ├── FormularioReserva.tsx
│       └── ClienteHistorial.tsx
├── lib/
│   └── db/
│       ├── schema.ts               Interfaces TypeScript
│       └── database.ts             Conexión + migraciones SQLite
├── scripts/
│   └── seed-admin.ts               Seeder del superadmin
└── public/
    └── uploads/canchas/            Fotos de canchas y logos

================================================================================
9. COMANDOS
================================================================================

  npm run dev          → Desarrollo (Turbopack)
  npm run build        → Build de producción
  npm run start        → Iniciar producción
  npx tsx scripts/seed-admin.ts  → Crear superadmin

================================================================================
10. CREDENCIALES POR DEFECTO
================================================================================

  Superadmin:  admin@gestor.com / admin123

================================================================================
FIN DEL INFORME
================================================================================
