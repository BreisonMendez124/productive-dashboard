# WMS Dashboard — Tablero de Productividad

**Versión:** 1.0   
**Equipo:** Desarrollo WMS  
**Fecha:** 2026-05-05

---

## Descripción General

**WMS Dashboard** es un tablero en tiempo real para el monitoreo de Diarios de Selección (DS) en almacén. Diseñado para su visualización en TV , con refresco automático cada 15 segundos y rotación automática entre 3 vistas cada 20 segundos.

### Características principales

-  **Refresco automático:** 15 segundos
-  **Rotación de vistas:** 20 segundos entre Slide 1, 2 y 3
-  **Responsive:** Optimizado para TV (16:9) 
-  **Seguridad:** API de lectura únicamente, CORS restringido, rate limiting
-  **Monitoreo:** Health check integrado (`/api/dashboard/health`)

---

##  Arquitectura

### Stack Tecnológico

| Capa       | Tecnología | Versión |
|------------|------------|---------|
| Frontend   | React      | 19      |
| Bundler    | Vite       | 5.x     |
| Backend    | Node.js    | 20 LTS  |
| Web Server | Express    | 5       |
| Database   | SQL Server | 2019+   |
| Gráficas   | Recharts   | 2.x     |

### Diagrama de Flujo

```
TV Almacén (http://SERVER:4000)
  ↓
  ├→ React App (App.jsx)
  │   ├→ Header.jsx
  │   ├→ Carousel.jsx
  │   ├→ Slide 1, 2, 3 (inline)
  │   └→ PieByType.jsx
  │
  └→ API Calls (lib/api.js)
      ↓
      Node.js Express (server:4000)
      ├→ /api/dashboard/slider1/* (5 endpoints)
      ├→ /api/dashboard/slider2/* (2 endpoints)
      ├→ /api/dashboard/slider3/* (1 endpoint)
      └→ /api/dashboard/health
          ↓
          SQL Server (puerto 1433)
```

---

## Estructura de Carpetas

```
wms-dashboard/
├── client/                          # Frontend React
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx           ← Encabezado con logo y estado
│   │   │   ├── Carousel.jsx         ← Control de rotación de slides
│   │   │   └── PieByType.jsx        ← Gráfica de torta (Slide 1)
│   │   ├── lib/
│   │   │   ├── api.js               ← Capa HTTP (fetchDashboard)
│   │   │   └── format.js            ← Utilidades (fmtDateTime, round1)
│   │   ├── App.jsx                  ← Componente raíz (3 slides inline)
│   │   ├── App.css                  ← Estilos (optimizado TV)
│   │   └── index.css                ← Resets globales
│   ├── index.html
│   ├── package.json
│   ├── .env.example
│   └── vite.config.js
│
├── server/                          # Backend Node.js
│   ├── src/
│   │   ├── core/
│   │   │   ├── env.mjs              ← Config centralizada
│   │   │   └── db.mjs               ← Pool SQL Server
│   │   ├── modules/dashboard/
│   │   │   ├── dashboard.service.mjs    ← Queries SQL (7 funciones)
│   │   │   ├── dashboard.controller.mjs ← Controladores HTTP
│   │   │   └── dashboard.routes.mjs     ← Rutas GET
│   │   ├── app.mjs                  ← Factory Express (middlewares)
│   │   └── server.mjs               ← Punto de entrada
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
├── .gitignore
└── README.md                        ← Este archivo
```

---

## Instalación y Configuración

### Requisitos Previos

- **Node.js 20 LTS** (descargar de https://nodejs.org)
- **SQL Server 2019+** (con acceso a base de datos)
- **Npm** (incluido con Node.js)

### Paso 1: Configurar Variables de Entorno

#### Backend (`server/.env`)

```bash
# Servidor
PORT=4000
NODE_ENV=production

# SQL Server
SQL_SERVER=192.168.1.100          # Host o IP
SQL_DATABASE=almacen_db           # Base de datos
SQL_USER=wms_dashboard_reader     # Usuario SQL (lectura-sola)
SQL_PASSWORD=contrasena_segura

# CORS (las IPs del TV y/o servidor web)
CORS_ORIGINS=http://192.168.1.150:80,http://192.168.1.150:443

# Opcionales
SQL_ENCRYPT=false
SQL_TRUST_CERT=true
```

#### Frontend (`client/.env`)

```bash
# URL del backend
VITE_API_BASE=http://192.168.1.100:4000
```

### Paso 2: Instalar Dependencias

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### Paso 3: Arrancar en Desarrollo

```bash
# Terminal 1: Backend
cd server
npm run dev          # Arranca en http://localhost:4000

# Terminal 2: Frontend
cd ../client
npm run dev          # Arranca en http://localhost:5173
```

Abrir navegador en: http://localhost:5173

### Paso 4: Build de Producción

```bash
# Frontend: generar archivos estáticos
cd client
npm run build        # Genera client/dist/

# Copiar dist/ a servidor web (Nginx, IIS, etc.)
# Configurar reverse proxy hacia http://localhost:4000 para /api
```

---

## Endpoints de la API

Todos retornan JSON con estructura: `{ rows: [...], total: N, ts: "ISO-fecha" }`

### Slider 1 — Estado de Diarios

| Endpoint | Descripción | Ejemplo |
|----------|-------------|---------|
| `GET /api/dashboard/slider1/diarios-por-estado` | Diarios agrupados por estado (S, W, E, etc.) | [{ estado: "W", cantidad_diarios: 15 }, ...] |
| `GET /api/dashboard/slider1/lineas-por-estado` | Líneas por estado | [{ estado: "W", cantidad_lineas: 48 }, ...] |
| `GET /api/dashboard/slider1/diarios-por-tipo` | Diarios por tipo (para gráfica torta) | [{ tipo: "Picking", cantidad_diarios: 20 }, ...] |
| `GET /api/dashboard/slider1/top-sin-asignar` | TOP 10 DS sin asignar (mes) | [{ documento: "DS001", tiempo_hhmm: "01:45" }, ...] |
| `GET /api/dashboard/slider1/aging` | Antigüedad (3 grupos: <30min, 30-60min, >1h) | [{ categoria: "Menos de 30 min", cantidad: 8, color: "#34C759" }, ...] |

### Slider 2 — Productividad de Operadores

| Endpoint | Descripción | Parámetro |
|----------|-------------|-----------|
| `GET /api/dashboard/slider2/top` | Ranking operadores | `?periodo=dia` o `?periodo=mes` |

**Respuesta:** `[{ usuario: "JUAN", avg_minutos: 1.8, lineas_completadas: 42, score_productividad: 36 }, ...]`

### Slider 3 — Detalle de Diarios

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/dashboard/slider3/detalle` | TOP 20 DS activos con detalle |

### Monitoreo

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/dashboard/health` | Estado del servidor y BD |

**Respuesta esperada:** `{ status: "ok", sql: "ok" }`

---

##  Componentes Frontend

### App.jsx
**Componente raíz.** Gestiona:
- Estado global (data, loading, error, lastUpdate)
- Refresco automático cada 15s (AbortController)
- Renderizado de 3 slides + Carousel

**Funciones internas:**
- `Slide1()` — Vista estado diarios
- `Slide2()` — Vista productividad operadores
- `Slide3()` — Vista detalle diarios activos
- `Panel()` — Tarjeta base reutilizable
- `BasicTable()` — Tabla genérica configurable
- `AgingCards()` — Tarjetas de antigüedad
- `ScoreBar()` — Barra visual de productividad
- `TopTable()` — Tabla de rankings

### Header.jsx
**Encabezado.** Muestra:
- Logo (placeholder `logo.png`)
- Título y hora última actualización
- Indicador de error (si existe)
- Pills (Compañía: 010)

### Carousel.jsx
**Controlador de rotación.** Props:
- `children` — Array de slides
- `intervalMs` — Intervalo de rotación (default 20s)

### PieByType.jsx
**Gráfica de torta (donut).** Props:
- `data` — Array `{ name: string, value: number }`


---

## Seguridad

### Consideraciones Implementadas

 **API de lectura únicamente** (solo GET, sin INSERT/UPDATE/DELETE)

 **CORS restringido** a orígenes definidos en `.env` (CORS_ORIGINS)

 **Rate limiting manual:** 120 req / 15 segundos por IP

 **Headers HTTP de seguridad:**
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `X-Content-Type-Options: nosniff`

 **Parámetros SQL parametrizados** (previene SQL Injection)

 **Usuario SQL de lectura-sola** (wms_dashboard_reader)

 **Variables de entorno** (no hay credenciales en código)

### Auditoría de Dependencias

```bash
# Backend
npm audit --production

# Frontend
npm audit --production
```

---

## Variables de Entorno

### Server (.env)

| Variable         | Requerida | Default     | Descripción                   |
|------------------|-----------|-------------|-------------------------------|
| `PORT`           | No        | 4000        | Puerto del servidor           |
| `NODE_ENV`       | No        | development | development ó production      |
| `SQL_SERVER`     | **Sí**    | -           | Host/IP SQL Server            |
| `SQL_DATABASE`   | **Sí**    | -           | Nombre BD                     |
| `SQL_USER`       | **Sí**    | -           | Usuario SQL                   |
| `SQL_PASSWORD`   | **Sí**    | -           | Contraseña SQL                |
| `SQL_ENCRYPT`    | No        | false       | Cifrar conexión TLS           |
| `SQL_TRUST_CERT` | No        | true        | Confiar cert autofirmado      |
| `CORS_ORIGINS`   | No        | *           | Orígenes permitidos (coma-sep)|

### Client (.env)

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| `VITE_API_BASE` | No | http://localhost:4000 | URL backend |

---

## Testing y Validación

### Health Check

```bash
curl http://localhost:4000/api/dashboard/health
# Respuesta: { "status": "ok", "sql": "ok" }
```

### Endpoints de Datos

```bash
# Diarios por estado
curl "http://localhost:4000/api/dashboard/slider1/diarios-por-estado"

# Top operadores (día)
curl "http://localhost:4000/api/dashboard/slider2/top?periodo=dia"

# Top operadores (mes)
curl "http://localhost:4000/api/dashboard/slider2/top?periodo=mes"
```
---

## Historial de Cambios

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 2026-05-05 | Release inicial |

---
