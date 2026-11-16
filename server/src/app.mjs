/**
 * app.mjs
 * Fábrica de la aplicación Express.
 *
 * Responsabilidades:
 *  - Middlewares globales (CORS, JSON, seguridad)
 *  - Endpoint /health
 *
 * NOTA: helmet y express-rate-limit se reemplazaron con implementaciones
 * propias para no requerir acceso externo a npm (proxy corporativo).
 *
 * Las rutas de negocio se montan en server.mjs para mantener
 * separación de responsabilidades y evitar duplicación.
 */

import express from "express";
import cors from "cors";
import { getPool } from "./core/db.mjs";
import { config } from "./core/env.mjs";

// ── Cabeceras de seguridad ────────────────────────────────────────────────────
// Equivalente básico de helmet() implementado sin dependencia externa.
// Protege contra XSS, clickjacking e inyección de tipo de contenido.
function securityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options",        "DENY");
  res.setHeader("X-XSS-Protection",       "1; mode=block");
  res.setHeader("Referrer-Policy",        "no-referrer");
  res.setHeader("Cache-Control",          "no-store");
  next();
}

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Máximo 120 peticiones por IP cada 15 segundos.
// El tablero hace 8 llamadas cada 15 s → margen amplio para múltiples TVs.
// Implementado sin express-rate-limit para evitar instalación de nuevas deps.
const rateLimitStore = new Map(); // ip → { count, resetAt }
const RATE_WINDOW_MS = 15_000;
const RATE_MAX       = 120;

function rateLimiter(req, res, next) {
  const ip  = req.ip ?? req.socket?.remoteAddress ?? "unknown";
  const now = Date.now();
  let entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateLimitStore.set(ip, entry);
  }

  entry.count++;

  if (entry.count > RATE_MAX) {
    res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
    return res
      .status(429)
      .json({ error: "Demasiadas peticiones, intenta en unos segundos." });
  }

  next();
}

// Limpia entradas expiradas cada 60 s para no acumular memoria
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(ip);
  }
}, 60_000);

// ── CORS ──────────────────────────────────────────────────────────────────────
// En producción restringe al origen real del cliente (configurable en .env).
// En desarrollo permite localhost:5173 por defecto.
const allowedOrigins = config.app.corsOrigins;

const corsOptions = {
  origin(origin, callback) {
    // Permitir peticiones sin origen (curl, Postman, SSE desde mismo host)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS bloqueado para origen: ${origin}`));
  },
  methods: ["GET"],        // El tablero solo necesita GET
  optionsSuccessStatus: 200,
};

// ── Fábrica ───────────────────────────────────────────────────────────────────
export function createApp() {
  const app = express();

  // Middlewares globales — orden importante
  app.use(securityHeaders);
  app.use(cors(corsOptions));
  app.use(rateLimiter);
  app.use(express.json());

  // ── Health check ────────────────────────────────────────────────────────────
  app.get("/health", async (_req, res) => {
    try {
      const pool = await getPool();
      await pool.request().query("SELECT 1 AS ok;");
      res.json({ status: "ok", sql: "ok", ts: new Date().toISOString() });
    } catch (e) {
      res
        .status(503)
        .json({ status: "degraded", sql: "error", error: e.message });
    }
  });

  // ── Manejador global de errores ─────────────────────────────────────────────
  // Captura cualquier error que no se atrapó en los controladores.
  // El cuarto parámetro "next" es requerido por Express para identificar
  // este middleware como manejador de errores — no eliminar aunque no se use.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.status ?? 500;
    console.error(`[ERROR] ${err.message}`);
    res.status(status).json({
      error: status === 500 ? "Error interno del servidor" : err.message,
    });
  });

  return app;
}
